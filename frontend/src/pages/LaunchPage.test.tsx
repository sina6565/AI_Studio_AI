// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../i18n/config';
import LaunchPage from './LaunchPage';

afterEach(() => cleanup());

function renderLaunch() {
  return render(<MemoryRouter><LaunchPage /></MemoryRouter>);
}

describe('LaunchPage', () => {
  it('clearly separates implemented product workflows from research roadmap', () => {
    renderLaunch();
    expect(screen.getByText('What you can use today')).toBeInTheDocument();
    expect(screen.getByText('What comes next')).toBeInTheDocument();
    expect(screen.getByText('Website Builder')).toBeInTheDocument();
    expect(screen.getByText('SINA AI POOL NETWORK')).toBeInTheDocument();
  });

  it('switches to Persian and updates document direction', async () => {
    renderLaunch();
    fireEvent.click(screen.getByRole('button', { name: 'فا' }));
    expect(await screen.findByText('اکنون چه چیزهایی در محصول وجود دارد؟')).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });
});
