// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Job } from '../types';
import '../i18n/config';
import Jobs from './Jobs';

const { listJobsMock, cancelJobMock } = vi.hoisted(() => ({
  listJobsMock: vi.fn(),
  cancelJobMock: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: {
    listJobs: listJobsMock,
    cancelJob: cancelJobMock,
  },
}));

const manifest = {
  title: 'Dungeon of Echoes',
  description: 'A short dungeon-crawling adventure.',
  assetCount: 2,
  scenes: [
    {
      id: 'scene-1',
      name: 'Entrance',
      description: 'A mossy stone doorway.',
      imageUrl: 'https://cdn.test/entrance.png',
    },
    {
      id: 'scene-2',
      name: 'Hall',
      description: 'A torchlit hall.',
      imageUrl: 'https://cdn.test/hall.png',
    },
  ],
};

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    type: 'game_build',
    status: 'completed',
    priority: 'normal',
    input: {},
    result: {
      contentUrl: 'data:text/html,<p>download</p>',
      format: 'text/html',
      metadata: {
        manifest,
        artifact: { filename: 'dungeon.html', format: 'text/html', sceneCount: 2 },
      },
    },
    createdAt: '2026-10-25T00:00:00.000Z',
    updatedAt: '2026-10-25T00:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

beforeEach(() => {
  listJobsMock.mockReset();
  listJobsMock.mockResolvedValue({ success: true, data: [makeJob()] });
  cancelJobMock.mockReset();
});

describe('Jobs scene viewer preview', () => {
  it('opens a safe in-app preview and navigates between scenes', async () => {
    render(<Jobs />);

    fireEvent.click(await screen.findByRole('button', { name: 'Preview scene viewer' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Dungeon of Echoes')).toBeInTheDocument();
    expect(within(dialog).getByText('A mossy stone doorway.')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'Entrance' })).toHaveAttribute(
      'src',
      'https://cdn.test/entrance.png',
    );

    fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByText('Scene 2 of 2')).toBeInTheDocument();
    expect(within(dialog).getByText('A torchlit hall.')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('only offers preview for game builds and rejects unsafe image schemes', async () => {
    const unsafeManifest = {
      ...manifest,
      scenes: [{ ...manifest.scenes[0], imageUrl: 'javascript:alert(1)' }],
    };
    listJobsMock.mockResolvedValueOnce({
      success: true,
      data: [
        makeJob({
          id: 'game-job',
          result: {
            contentUrl: 'data:text/html,<p>download</p>',
            format: 'text/html',
            metadata: {
              manifest: unsafeManifest,
              artifact: { filename: 'unsafe.html', format: 'text/html', sceneCount: 1 },
            },
          },
        }),
        makeJob({ id: 'other-job', type: 'game_creation' }),
      ],
    });

    render(<Jobs />);

    const previewButtons = await screen.findAllByRole('button', { name: 'Preview scene viewer' });
    expect(previewButtons).toHaveLength(1);
    fireEvent.click(previewButtons[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Entrance' })).toBeInTheDocument();
  });
});
