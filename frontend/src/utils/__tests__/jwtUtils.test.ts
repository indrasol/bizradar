/**
 * Tests for JWT utilities
 */
import { decodeJWT, extractSessionId, extractUserId } from '../jwtUtils';

// Mock JWT token for testing (this is a real JWT structure but with test data)
const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJzZXNzaW9uX2lkIjoiYWFhYS1iYmJiLWNjY2MtZGRkZC1lZWVlIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDAsImF1ZCI6ImF1dGhlbnRpY2F0ZWQifQ.test-signature';

describe('JWT Utils', () => {
  describe('decodeJWT', () => {
    it('should decode a valid JWT token', () => {
      const result = decodeJWT(mockJWT);
      expect(result).toBeDefined();
      expect(result.sub).toBe('test-user-id');
      expect(result.session_id).toBe('aaaa-bbbb-cccc-dddd-eeee');
    });

    it('should return null for invalid JWT', () => {
      const result = decodeJWT('invalid-jwt');
      expect(result).toBeNull();
    });

    it('should return null for malformed JWT', () => {
      const result = decodeJWT('not.a.jwt');
      expect(result).toBeNull();
    });
  });

  describe('extractSessionId', () => {
    it('should extract session_id from valid JWT', () => {
      const result = extractSessionId(mockJWT);
      expect(result).toBe('aaaa-bbbb-cccc-dddd-eeee');
    });

    it('should return null for invalid JWT', () => {
      const result = extractSessionId('invalid-jwt');
      expect(result).toBeNull();
    });

    it('should return null when session_id is missing', () => {
      const jwtWithoutSessionId = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTY0MDk5ODgwMCwiYXVkIjoiYXV0aGVudGljYXRlZCJ9.test-signature';
      const result = extractSessionId(jwtWithoutSessionId);
      expect(result).toBeNull();
    });
  });

  describe('extractUserId', () => {
    it('should extract user_id (sub) from valid JWT', () => {
      const result = extractUserId(mockJWT);
      expect(result).toBe('test-user-id');
    });

    it('should return null for invalid JWT', () => {
      const result = extractUserId('invalid-jwt');
      expect(result).toBeNull();
    });
  });
});
