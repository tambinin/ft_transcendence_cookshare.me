import { FastifyRequest, FastifyReply } from "fastify";
import { ForbiddenError, UnauthorizedError, validateApiKey, isApiKeyExpired } from "@transcendence/common";

const API_MASTER_SECRET = process.env.API_MASTER_SECRET || process.env.API_GATEWAY_KEY || "";

const API_KEY_MAX_AGE_SECONDS = parseInt(process.env.API_KEY_MAX_AGE_SECONDS || "31536000", 10);

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      await request.jwtVerify();
      const user = (request as any).user;
      (request as any).apiKeyUserId = user?.id || "jwt-user";
      return;
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }
  }

  const apiKey = request.headers["x-gateway-api-key"] as string | undefined;

  if (!apiKey) {
    request.log.warn("API Key not found");
    throw new ForbiddenError("Authentication required");
  }

  if (apiKey.startsWith("cs_")) {
    const result = validateApiKey(apiKey, API_MASTER_SECRET);

    if (!result.valid) {
      request.log.warn("Invalid signed API Key");
      throw new ForbiddenError("Invalid API Key");
    }
    
    if (result.timestamp && isApiKeyExpired(result.timestamp, API_KEY_MAX_AGE_SECONDS)) {
      request.log.warn(`Expired API Key for user ${result.userId}`);
      throw new ForbiddenError("API Key expired");
    }

    (request as any).apiKeyUserId = result.userId;
    request.log.info(`API request from user: ${result.userId}`);
    return;
  }

  if (apiKey === process.env.API_GATEWAY_KEY) {
    (request as any).apiKeyUserId = "gateway";
    return;
  }

  request.log.warn("Invalid API Key");
  throw new ForbiddenError("Invalid API Key");
}