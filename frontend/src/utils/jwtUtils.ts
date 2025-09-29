/**
 * JWT Token Utilities
 * Helper functions for working with JWT tokens
 */

/**
 * Decode a JWT token and extract its payload
 * @param token - The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
export function decodeJWT(token: string): any | null {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT token format');
      return null;
    }

    // Decode the payload (middle part)
    const payload = parts[1];
    
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.warn('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Extract session_id from a JWT token
 * @param token - The JWT token
 * @returns The session_id or null if not found
 */
export function extractSessionId(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.session_id || null;
}

/**
 * Extract user_id from a JWT token
 * @param token - The JWT token
 * @returns The user_id (sub claim) or null if not found
 */
export function extractUserId(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.sub || null;
}
