import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Header from '../../src/lib/components/Header.svelte';

describe('Header Component', () => {
  it('renders project name', () => {
    render(Header, { props: { projectName: 'Test Project' } });
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('uses default project name when not provided', () => {
    render(Header);
    expect(screen.getByText('OinkerUI')).toBeInTheDocument();
  });
});