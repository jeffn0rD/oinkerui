import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatInterface from '../../src/lib/components/ChatInterface.svelte';

describe('Chat Flow Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('renders chat interface', () => {
    render(ChatInterface, { props: { messages: [] } });
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
  });

  it('displays messages when provided', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ];
    
    render(ChatInterface, { props: { messages } });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });
});