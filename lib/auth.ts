import { SignJWT, jwtVerify } from "jose";

// jose (not jsonwebtoken) deliberately: this is imported from middleware.ts,
// which runs on the Edge runtime — jsonwebtoken relies on Node's `crypto`
// module and doesn't work there, jose works in both Edge and Node.

const encoder = new TextEncoder();

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return encoder.encode(secret);
}

export type SessionPayload = {
  userId: string;
  mobile: string;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string" || typeof payload.mobile !== "string") {
      return null;
    }
    return { userId: payload.userId, mobile: payload.mobile };
  } catch {
    return null;
  }
}
