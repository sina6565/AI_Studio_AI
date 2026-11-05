// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('WebsiteBuilder', () => {
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

  it('submits a website job and renders the returned HTML preview', async () => {
    render(<MemoryRouter><WebsiteBuilder /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText('Website / brand name'), { target: { value: 'SINA Studio' } });
    fireEvent.change(screen.getByLabelText('Main headline'), { target: { value: 'Build a universe' } });
    fireEvent.change(screen.getByLabelText('What is this website about?'), { target: { value: 'A creative studio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate website' }));

    await waitFor(() => expect(createWebsiteJobMock).toHaveBeenCalledTimes(1));
    expect(createWebsiteJobMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'SINA Studio',
      tagline: 'Build a universe',
      description: 'A creative studio',
      kind: 'business',
      palette: 'midnight',
      language: 'en',
    }));
    expect(await screen.findByText('Website generated successfully.')).toBeInTheDocument();
    expect(screen.getByTitle('Website live preview')).toHaveAttribute('srcdoc', expect.stringContaining('SINA test site'));
  });

  it('requires a headline before creating a job', async () => {
    render(<MemoryRouter><WebsiteBuilder /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Website / brand name'), { target: { value: 'SINA Studio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate website' }));

    expect(await screen.findByText('Enter a headline.')).toBeInTheDocument();
    expect(createWebsiteJobMock).not.toHaveBeenCalled();
  });
});
