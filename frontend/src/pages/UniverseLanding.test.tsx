// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi, beforeAll } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../i18n/config';
import UniverseLanding from './UniverseLanding';

// The WebGL scene is replaced with an inert stand-in; timeline/store stay real.
vi.mock('@/components/universe/HeroScene', () => ({ default: () => null }));

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  Element.prototype.scrollIntoView = vi.fn();
});

function renderLanding() {
  return render(
    <MemoryRouter>
      <UniverseLanding />
    </MemoryRouter>,
  );
}

describe('UniverseLanding', () => {
  it('renders the brand hero with both studio slogans and the creation prompt', () => {
    renderLanding();
    expect(screen.getByText('FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE')).toBeInTheDocument();
    expect(screen.getByText('CREATE ANYTHING. BECOME EVERYTHING.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What will you create?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start creating/i })).toBeInTheDocument();
  });

  it('renders all six worlds', () => {
    renderLanding();
    for (const name of ['Games', 'Websites', 'Videos', 'Audio', 'Characters', '3D Assets']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });

  it('links pre-order calls to the founder pre-order page', () => {
    renderLanding();
    const preorderLinks = screen
      .getAllByRole('link')
      .filter((a) => (a.getAttribute('href') || '').startsWith('/preorder'));
    expect(preorderLinks.length).toBeGreaterThan(0);
    expect(screen.getByText('GLOBAL ADS THEATER')).toBeInTheDocument();
  });

  it('switches the whole page to Persian with the language toggle', async () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: /switch language/i }));
    expect(await screen.findByText('از یک ایده‌ی تنها تا یک جهان کامل')).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });
});
