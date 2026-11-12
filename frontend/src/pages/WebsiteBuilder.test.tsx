// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WebsiteBuilder from './WebsiteBuilder';

const { createWebsiteJobMock, getJobStatusMock } = vi.hoisted(() => ({
  createWebsiteJobMock: vi.fn(),
  getJobStatusMock: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: {
    createWebsiteJob: createWebsiteJobMock,
    getJobStatus: getJobStatusMock,
  },
}));

afterEach(() => cleanup());

describe('WebsiteBuilder prompt flow', () => {
  beforeEach(() => {
    localStorage.setItem('language', 'en');
    createWebsiteJobMock.mockReset().mockResolvedValue({
      success: true,
      data: { jobId: 'website-job-1', status: 'queued' },
    });
    getJobStatusMock.mockReset().mockResolvedValue({
      success: true,
      data: {
        id: 'website-job-1',
        status: 'completed',
        result: {
          metadata: {
            html: '<!doctype html><html lang="en"><body><h1>SINA test site</h1></body></html>',
          },
        },
      },
    });
  });

  it('submits one prompt and renders the returned HTML preview', async () => {
    render(<MemoryRouter><WebsiteBuilder /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Describe the website you want'), {
      target: { value: 'Create a bilingual website for a handmade ceramics studio with products and contact details.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Build my website' }));

    await waitFor(() => expect(createWebsiteJobMock).toHaveBeenCalledTimes(1));
    expect(createWebsiteJobMock).toHaveBeenCalledWith({
      prompt: 'Create a bilingual website for a handmade ceramics studio with products and contact details.',
      language: 'en',
    });
    await waitFor(() => {
      expect(screen.getAllByRole('alert').some((alert) => alert.textContent?.includes('Website draft generated successfully.'))).toBe(true);
    });
    expect(screen.getByTitle('Website live preview')).toHaveAttribute('srcdoc', expect.stringContaining('SINA test site'));
  });

  it('requires a meaningful prompt before creating a job', async () => {
    render(<MemoryRouter><WebsiteBuilder /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Describe the website you want'), { target: { value: 'short' } });
    expect(screen.getByRole('button', { name: 'Build my website' })).toBeDisabled();
    expect(createWebsiteJobMock).not.toHaveBeenCalled();
  });
});
