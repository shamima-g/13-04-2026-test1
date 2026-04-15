/**
 * Integration Test: API Client
 *
 * Tests verify that the API client correctly formats requests and handles
 * responses. Uses fetch spy to verify HTTP layer behavior.
 */

import { vi, beforeEach } from 'vitest';
import { apiClient, get, post } from '@/lib/api/client';
import type { APIError } from '@/types/api';

describe('API Client Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful API requests', () => {
    it('should fetch data and parse JSON response', async () => {
      // Arrange
      const mockData = { id: 1, name: 'Test User' };
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      // Act
      const result = await apiClient<typeof mockData>('/v1/users/1', {
        method: 'GET',
      });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/users/1'),
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(result).toEqual(mockData);
    });

    it('should send POST request with body using convenience method', async () => {
      // Arrange
      const requestBody = { name: 'New User', email: 'user@example.com' };
      const mockResponse = { id: 2, ...requestBody };
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        }),
      );

      // Act
      const result = await post<typeof mockResponse>(
        '/v1/users',
        requestBody,
        'TestUser',
      );

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/users'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: expect.objectContaining({
            LastChangedUser: 'TestUser',
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle query parameters', async () => {
      // Arrange
      const mockData = [{ id: 1, name: 'User 1' }];
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      // Act
      await get<typeof mockData>('/v1/users', { role: 'admin', active: true });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('role=admin'),
        expect.anything(),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('active=true'),
        expect.anything(),
      );
    });
  });

  describe('Error handling', () => {
    it('should handle 404 errors with proper error structure', async () => {
      // Arrange
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ Messages: ['User not found'] }), {
          status: 404,
          statusText: 'Not Found',
          headers: { 'content-type': 'application/json' },
        }),
      );

      // Act & Assert
      try {
        await apiClient('/v1/users/999', { method: 'GET' });
        throw new Error('Should have thrown an error');
      } catch (error) {
        const apiError = error as APIError;
        expect(apiError.statusCode).toBe(404);
        expect(apiError.message).toContain('Not Found');
        expect(apiError.details).toEqual(['User not found']);
      }
    });

    it('should handle 500 server errors', async () => {
      // Arrange
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'content-type': 'application/json' },
        }),
      );

      // Act & Assert
      try {
        await apiClient('/v1/data', { method: 'GET' });
        throw new Error('Should have thrown an error');
      } catch (error) {
        const apiError = error as APIError;
        expect(apiError.statusCode).toBe(500);
        expect(apiError.message).toContain('Internal Server Error');
      }
    });

    it('should handle network errors', async () => {
      // Arrange
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(
        new TypeError('Failed to fetch'),
      );

      // Act & Assert
      try {
        await apiClient('/v1/users', { method: 'GET' });
        throw new Error('Should have thrown an error');
      } catch (error) {
        const apiError = error as APIError;
        expect(apiError.message).toContain('Network error');
        expect(apiError.statusCode).toBe(0);
      }
    });
  });

  describe('Request configuration', () => {
    it('should include LastChangedUser header for audit trails', async () => {
      // Arrange
      const mockData = { success: true };
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      // Act
      await apiClient('/v1/data', {
        method: 'POST',
        body: JSON.stringify({ value: 'test' }),
        lastChangedUser: 'TestUser',
      });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            LastChangedUser: 'TestUser',
          }),
        }),
      );
    });

    it('should handle 204 No Content responses', async () => {
      // Arrange
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(null, {
          status: 204,
          headers: {},
        }),
      );

      // Act
      const result = await apiClient('/v1/users/1', { method: 'DELETE' });

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
