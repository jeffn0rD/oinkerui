import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API
vi.mock('../../src/lib/utils/api.js', () => ({
  healthApi: {
    check: vi.fn().mockResolvedValue({ status: 'ok' })
  }
}));

// Mock the stores before importing the component
vi.mock('../../src/lib/stores/uiStore.js', () => {
  const { writable } = require('svelte/store');
  return {
    theme: writable('dark'),
    loading: writable(false),
    streaming: writable(false),
    stopStreaming: vi.fn(),
    startStreaming: vi.fn()
  };
});

import Header from '../../src/lib/components/Header.svelte';

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows OinkerUI branding', () => {
    render(Header);
    expect(screen.getByText('OinkerUI')).toBeInTheDocument();
  });

  it('renders settings and profile buttons', () => {
    render(Header);
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
    expect(screen.getByTitle('Profile')).toBeInTheDocument();
  });

  it('shows connection status after health check', async () => {
    render(Header);
    // Wait for the async health check to complete
    await vi.waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('shows Disconnected when health check fails', async () => {
    const { healthApi } = await import('../../src/lib/utils/api.js');
    healthApi.check.mockRejectedValueOnce(new Error('Network error'));
    
    render(Header);
    await vi.waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });
});