/**
 * Example Protected API Route
 *
 * This demonstrates how to protect API endpoints with role-based access control
 * and input validation using Zod schemas.
 *
 * Key patterns shown:
 * 1. Using withRoleProtection to require specific roles
 * 2. Validating request body with Zod schemas
 * 3. Proper error handling and status codes
 * 4. Type-safe request/response handling
 *
 * FRS roles: admin and team-member only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoleProtection } from '@/lib/auth/auth-helpers';
import { validateRequest } from '@/lib/validation/schemas';
import { UserRole } from '@/types/roles';

/**
 * Request validation schema for this endpoint
 */
const requestSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  data: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  }),
});

/**
 * GET /api/example/protected-action
 *
 * Example endpoint requiring team-member role or higher (any authenticated user)
 * Returns information about the current user's permissions.
 */
export const GET = withRoleProtection(
  async (): Promise<NextResponse> => {
    try {
      return NextResponse.json({
        message: 'You have access to this protected endpoint',
        allowedActions: ['read'],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in protected endpoint:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  },
  { minimumRole: UserRole.TEAM_MEMBER },
);

/**
 * POST /api/example/protected-action
 *
 * Example endpoint requiring admin role.
 * Demonstrates input validation with Zod.
 */
export const POST = withRoleProtection(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Parse and validate request body
      const body = await request.json();
      const validation = validateRequest(requestSchema, body);

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.errors },
          { status: 400 },
        );
      }

      // Type-safe access to validated data
      const { action, data } = validation.data;

      // Perform the action (placeholder logic)
      const result = {
        success: true,
        action,
        data,
        processedAt: new Date().toISOString(),
      };

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 },
        );
      }

      console.error('Error in protected endpoint:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  },
  { role: UserRole.ADMIN },
);

/**
 * DELETE /api/example/protected-action
 *
 * Example endpoint requiring ADMIN role only.
 * Demonstrates exact role matching.
 */
export const DELETE = withRoleProtection(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract ID from query params
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { error: 'Missing required parameter: id' },
          { status: 400 },
        );
      }

      // Perform deletion (placeholder logic)
      return NextResponse.json({
        success: true,
        message: `Resource ${id} deleted successfully`,
        deletedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in protected endpoint:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  },
  { role: UserRole.ADMIN },
);

/**
 * PATCH /api/example/protected-action
 *
 * Example endpoint requiring admin role.
 */
export const PATCH = withRoleProtection(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await request.json();

      return NextResponse.json({
        success: true,
        message: 'Resource updated successfully',
        data: body,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in protected endpoint:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  },
  { role: UserRole.ADMIN },
);
