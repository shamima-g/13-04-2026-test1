/**
 * MSW Node.js server — used in Vitest / React Testing Library tests.
 * Automatically started/stopped/reset via vitest.setup.ts.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
