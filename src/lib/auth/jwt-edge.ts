/**
 * Edge-compatible JWT utilities using jose
 * Replaces jsonwebtoken for Edge Runtime compatibility
 */

import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nova-rdv-secret-key'
);

export interface TokenPayload extends JWTPayload {
  patient_id: string;
  issued_at: number;
}

/**
 * Sign a JWT token (Edge-compatible)
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT token (Edge-compatible)
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Create a session token
 */
export async function createSessionToken(patientId: string): Promise<string> {
  const payload: TokenPayload = {
    patient_id: patientId,
    issued_at: Date.now(),
  };
  
  return await signToken(payload);
}

/**
 * Validate a session token
 */
export async function validateSessionToken(token: string): Promise<{
  valid: boolean;
  patientId?: string;
  error?: string;
}> {
  const payload = await verifyToken(token);
  
  if (!payload) {
    return { valid: false, error: 'Invalid token' };
  }
  
  if (!payload.patient_id) {
    return { valid: false, error: 'Invalid token payload' };
  }
  
  return { valid: true, patientId: payload.patient_id };
}