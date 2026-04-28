import crypto from "crypto";

const API_KEY_PREFIX = "cs_";

export function generateApiKey(userId: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = crypto.randomBytes(4).toString("hex");
  const payload = `${API_KEY_PREFIX}${userId}_${timestamp}_${random}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url")
    .slice(0, 32);

  return `${payload}.${signature}`;
}

export function validateApiKey(
  apiKey: string,
  secret: string
): { valid: boolean; userId?: string; timestamp?: number } {
  if (!apiKey || typeof apiKey !== "string") {
    return { valid: false };
  }

  const parts = apiKey.split(".");
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [payload, providedSignature] = parts;

  if (!payload.startsWith(API_KEY_PREFIX)) {
    return { valid: false };
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url")
    .slice(0, 32);

  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    );
    if (!valid) {
      return { valid: false };
    }
  } catch {
    return { valid: false };
  }

  const payloadWithoutPrefix = payload.slice(API_KEY_PREFIX.length);
  const payloadParts = payloadWithoutPrefix.split("_");

  if (payloadParts.length < 3) {
    return { valid: false };
  }

  const random = payloadParts.pop()!;
  const timestampStr = payloadParts.pop()!;
  const userId = payloadParts.join("_");
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false };
  }

  return { valid: true, userId, timestamp };
}

export function isApiKeyExpired(
  timestamp: number,
  maxAgeSeconds: number = 365 * 24 * 60 * 60
): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - timestamp > maxAgeSeconds;
}

export function extractUserIdFromApiKey(apiKey: string): string | null {
  if (!apiKey || !apiKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const parts = apiKey.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const payload = parts[0];
  const payloadWithoutPrefix = payload.slice(API_KEY_PREFIX.length);
  const payloadParts = payloadWithoutPrefix.split("_");

  if (payloadParts.length < 3) {
    return null;
  }
  payloadParts.pop();
  payloadParts.pop();
  return payloadParts.join("_") || null;
}
