import { authMiddleware } from "./middleware/auth.middleware";
import fastify from "fastify";
import { registerRateLimiter } from "./middleware/rateLimiter.middleware";
import { recipesRoutes } from "./routes/recipes.routes";
import { recipesPublicRoutes } from "./routes/recipes.public.routes";
import { usersRoutes } from "./routes/users.routes";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { authRoutes } from "./routes/auth.routes";
import { notificationsRoutes } from "./routes/notifications.routes";
import { healthRoutes } from "./routes/health.routes";
import { globalErrorHandler, validateEnv, getLoggerConfig, registerMetrics, silenceHealthLogs } from "@transcendence/common";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { chatRoutes } from "./routes/chat.routes";
import { gdprRoutes } from "./routes/gdpr.routes";
import { ingredientsRoutes } from "./routes/ingredients.routes";
import jwt from "@fastify/jwt";
import fs from "fs";

const DOMAIN = process.env.DOMAIN;
const API_GATEWAY_PORT = process.env.API_GATEWAY_PORT;

const configuredOrigins = (process.env.CORS_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
const devOrigins = [
  "http://localhost:5173", "http://localhost:3001", "https://localhost",
  "https://cookshare.me", "https://www.cookshare.me"
];
if (DOMAIN && DOMAIN !== "localhost" && DOMAIN !== "cookshare.me") {
  devOrigins.push(`http://${DOMAIN}:5173`, `https://${DOMAIN}:5173`, `https://${DOMAIN}:3001`, `https://${DOMAIN}`);
}
const allowedOrigins = [...new Set([...configuredOrigins, ...devOrigins])];

function isLocalNetworkOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
  } catch { return false; }
}

if (!DOMAIN || !API_GATEWAY_PORT) {
  process.stderr.write("Error: DOMAIN and API_GATEWAY_PORT must be set in environment variables.\n");
  process.exit(1);
}

const env = validateEnv();

export const app = fastify({
  logger: getLoggerConfig("api-gateway"),
  disableRequestLogging: true,
  https: {
    key: fs.readFileSync(process.env.TLS_KEY_PATH || '/certs/key.pem'),
    cert: fs.readFileSync(process.env.TLS_CERT_PATH || '/certs/cert.pem'),
  },
  routerOptions: {
    maxParamLength: 256
  },
  ajv: {
    customOptions: {
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: true,
      allErrors: true,
      strict: false,
      keywords: ["example"]
    }
  }
});

app.setErrorHandler(globalErrorHandler);
silenceHealthLogs(app);

app.addHook('onSend', async (_request, reply, payload) => {
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');

  reply.header('X-Content-Type-Options', 'nosniff');

  reply.header('X-Frame-Options', 'DENY');

  reply.header('X-XSS-Protection', '1; mode=block');

  reply.header('Referrer-Policy', 'no-referrer');

  reply.removeHeader('X-Powered-By');
  reply.header('Server', '');

  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  reply.header(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  return payload;
});

app.register(cookie, {
  secret: env.COOKIE_SECRET,
  parseOptions: {}
});

app.register(jwt, {
  secret: env.JWT_SECRET,
});

app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  }
});

app.get('/api/health', {
  schema: {
    tags: ["System"],
    summary: "Get API Gateway health status",
    description: "### Overview\nProvides a basic health check for the API Gateway service.\n\n### Security\n- Publicly accessible.",
    response: {
      200: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          service: { type: "string", example: "api-gateway" },
          timestamp: { type: "string", format: "date-time" }
        }
      }
    }
  }
}, async () => ({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() }));

const start = async () => {
  try {
    await registerRateLimiter(app);
    await app.register(cors, {
      origin: (origin, cb) => {
        if (!origin)
          return cb(null, true);
        if (allowedOrigins.includes(origin) || isLocalNetworkOrigin(origin)) {
          cb(null, true);
        } else {
          cb(new Error("Not allowed by CORS"), false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "x-gateway-api-key"],
      exposedHeaders: ["set-cookie"],
    });
    await app.register(swagger, {
      openapi:
      {
        openapi: "3.0.3",
        info: {
          title: "Transcendence API Gateway",
          version: "1.0.0",
          description: "Central entry point for the Transcendence microservices architecture."
        },
        servers: [
          {
            url: process.env.PUBLIC_URL || `https://cookshare.me/api`,
            description: "Production API Server"
          },
          {
            url: `https://localhost/api`,
            description: "Local API Server"
          }
        ],
        components: {
          securitySchemes: {
            apiKeyAuth: {
              type: "apiKey",
              name: "x-gateway-api-key",
              in: "header"
            },
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT"
            }
          }
        }
      }
    });

    await app.register(swaggerUi, {
      routePrefix: "/api/v1/documentation",
      staticCSP: false,
      uiConfig: {
        validatorUrl: null
      }
    });

    await registerMetrics(app, "api-gateway");

    await app.register(async (api) => {
      await api.register(authRoutes);
      await api.register(gdprRoutes);
      await api.register(healthRoutes);
      await api.register(ingredientsRoutes);
      await api.register(recipesPublicRoutes);

      await api.register(async (privateApi) => {
        privateApi.addHook("preHandler", authMiddleware);
        await privateApi.register(recipesRoutes);
        await privateApi.register(usersRoutes);
        await privateApi.register(notificationsRoutes);
        await privateApi.register(chatRoutes);
      });
    }, { prefix: '/api/v1' });

    await app.ready();
    await app.listen({ port: env.API_GATEWAY_PORT, host: "0.0.0.0" });

    app.log.info(`API Gateway running on ${DOMAIN}:${env.API_GATEWAY_PORT}`);

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, closing server...`);
    await app.close();
    process.exit(0);
  });
});

start();
