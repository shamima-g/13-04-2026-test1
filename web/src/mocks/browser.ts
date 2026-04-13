/**
 * MSW browser worker — used in development and browser-based tests.
 * Import and start this in the app entry point when NEXT_PUBLIC_API_MOCKING=true.
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
