/**
 * Integration Test: Page Rendering
 *
 * Tests page components with data fetching, user interactions, and state
 * management. Uses fetch spy to verify HTTP interactions.
 */

import { vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Example: A page component that fetches and displays data
function ExampleDataPage() {
  const [data, setData] = React.useState<{ name: string } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Data Page</h1>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Load Data'}
      </button>
      {error && <div role="alert">Error: {error}</div>}
      {data && <div>Name: {data.name}</div>}
    </div>
  );
}

describe('Page Rendering Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data fetching workflow', () => {
    it('should load and display data when button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockData = { name: 'Test Data' };
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      render(<ExampleDataPage />);

      // Act
      const loadButton = screen.getByRole('button', { name: /load data/i });
      await user.click(loadButton);

      // Assert - wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Name: Test Data')).toBeInTheDocument();
      });

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledWith('/api/data');
    });

    it('should display error message when fetch fails', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(null, { status: 400 }),
      );

      render(<ExampleDataPage />);

      // Act
      const loadButton = screen.getByRole('button', { name: /load data/i });
      await user.click(loadButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch');
      });
    });

    it('should handle network errors', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(
        new Error('Network error'),
      );

      render(<ExampleDataPage />);

      // Act
      await user.click(screen.getByRole('button', { name: /load data/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible heading', () => {
      // Arrange & Act
      render(<ExampleDataPage />);

      // Assert
      expect(
        screen.getByRole('heading', { name: /data page/i }),
      ).toBeInTheDocument();
    });

    it('should disable button during loading', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.spyOn(global, 'fetch').mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  new Response(JSON.stringify({}), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                  }),
                ),
              100,
            ),
          ),
      );

      render(<ExampleDataPage />);

      // Act
      await user.click(screen.getByRole('button', { name: /load data/i }));

      // Assert
      expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
    });
  });
});
