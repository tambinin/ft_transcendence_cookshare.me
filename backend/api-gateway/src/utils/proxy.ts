import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { hydrateRecipes } from "./hydration";
import { HttpStatus, sendError, fetchWithTimeout } from "@transcendence/common";
import https from "https";
import tls from "tls";
import fs from "fs";

const caCertPath = process.env.TLS_CERT_PATH || '/certs/cert.pem';

let internalCa: Buffer | undefined;
try {
    internalCa = fs.readFileSync(caCertPath);
} catch {
}

if (internalCa) {
    const origCreateSecureContext = tls.createSecureContext;
    tls.createSecureContext = function (options?: tls.SecureContextOptions) {
        const ctx = origCreateSecureContext.call(tls, options);
        ctx.context.addCACert(internalCa!);
        return ctx;
    };
}

export async function proxyRequest(
    request: FastifyRequest,
    reply: FastifyReply,
    path: string,
    serviceUrl: string
) {
    const url = new URL(`${serviceUrl}${path}`);
    const query = request.query as Record<string, any>;
    if (query) {
        Object.keys(query).forEach(key => {
            if (query[key] !== undefined) {
                url.searchParams.append(key, String(query[key]))
            }
        });
    }
    const options: RequestInit = {
        method: request.method,
        headers: {
            "x-internal-api-key": process.env.INTERNAL_API_KEY,
            ...(request.headers.authorization && {
                "authorization": request.headers.authorization
            }),
            ...(request.headers.cookie && {
                "cookie": request.headers.cookie
            })
        }
    };
    if (['POST', 'PUT', 'DELETE'].includes(request.method) && request.body) {
        options.headers["content-type"] = "application/json";
        options.body = JSON.stringify(request.body);
    }
    try {
        const response = await fetchWithTimeout(url.toString(), options, 30_000);

        const statusCode = response.status;
        const body = await response.json();
        const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
        if (setCookieHeaders.length > 0) {
            for (const cookie of setCookieHeaders) {
                reply.header('set-cookie', cookie);
            }
        } else {
            const singleCookie = response.headers.get('set-cookie');
            if (singleCookie) {
                reply.header('set-cookie', singleCookie);
            }
        }
        return { statusCode, body };
    } catch (error) {
        throw error;
    }
}

export async function proxyHydrate(
    app: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply,
    path: string,
    serviceUrl: string
) {
    try {
        const { statusCode, body } = await proxyRequest(request, reply, path, serviceUrl);

        if (statusCode >= 200 && statusCode < 300 && body.data) {
            body.data = await hydrateRecipes(app, body.data);
        }
        return reply.status(statusCode).send(body);
    } catch (error) {
        const status = (error as any).status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message = (error as any).data?.message || "Internal server error";
        sendError(reply, message, status);
    }
}

export async function proxyMultipart(
    request: FastifyRequest,
    reply: FastifyReply,
    path: string,
    serviceUrl: string,
    options: { fileRequired?: boolean; method?: string } = { fileRequired: true, method: 'POST' }
) {
    const url = new URL(`${serviceUrl}${path}`);
    const query = request.query as Record<string, any>;
    if (query) {
        Object.keys(query).forEach(key => {
            if (query[key] !== undefined) {
                url.searchParams.append(key, String(query[key]));
            }
        });
    }

    try {
        const FormData = (await import('form-data')).default;
        const formData = new FormData();

        const parts = request.parts();
        let hasFile = false;

        for await (const part of parts) {
            if (part.type === 'file') {
                hasFile = true;
                const buffer = await part.toBuffer();
                formData.append(part.fieldname, buffer, {
                    filename: part.filename,
                    contentType: part.mimetype
                });
            } else {
                formData.append(part.fieldname, part.value);
            }
        }

        if (options.fileRequired && !hasFile) {
            return reply.status(400).send({
                status: "error",
                message: "No file uploaded"
            });
        }
        const parsedUrl = new URL(serviceUrl);
        const isHttps = parsedUrl.protocol === 'https:';
        const responseData = await new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
            const submitOptions: any = {
                protocol: parsedUrl.protocol as 'http:' | 'https:',
                host: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: path,
                method: options.method || 'POST',
                headers: {
                    "x-internal-api-key": process.env.INTERNAL_API_KEY!,
                    ...(request.headers.authorization && {
                        "authorization": request.headers.authorization
                    }),
                    ...(request.headers.cookie && {
                        "cookie": request.headers.cookie
                    })
                }
            };

            if (isHttps) {
                submitOptions.agent = new https.Agent({
                    ca: internalCa,
                    rejectUnauthorized: !!internalCa
                });
            }

            formData.submit(submitOptions, (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const body = JSON.parse(data);
                        resolve({ statusCode: res.statusCode || 500, body });
                    } catch {
                        resolve({ statusCode: res.statusCode || 500, body: { message: data } });
                    }
                });
                res.on('error', reject);
            });
        });

        return reply.status(responseData.statusCode).send(responseData.body);
    } catch (error: any) {
        return sendError(reply, error.message || "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
