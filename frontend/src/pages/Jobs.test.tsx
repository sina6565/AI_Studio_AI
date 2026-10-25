// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Job } from '../types';
import '../i18n/config';
import Jobs from './Jobs';

const { listJobsMock, cancelJobMock, buildGameJobMock } = vi.hoisted(() => ({
  listJobsMock: vi.fn(),
  cancelJobMock: vi.fn(),
  buildGameJobMock: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: {
    listJobs: listJobsMock,
    cancelJob: cancelJobMock,
    buildGameJob: buildGameJobMock,
  },
}));

const playableGame = {
  schemaVersion: 1,
  engine: { id: 'phaser', version: '4.2.1' },
  title: 'Dungeon of Echoes',
  description: 'A short dungeon-crawling adventure.',
  world: {
    columns: 20,
    rows: 15,
    tileSize: 32,
    seed: 42,
    layout: Array.from({ length: 15 }, (_, row) =>
      Array.from({ length: 20 }, (_, column) =>
        row === 0 || column === 0 || row === 14 || column === 19 ? '#' : '.',
      ).join(''),
    ).map((line, row) => {
      if (row !== 1) return line;
      return `${line.slice(0, 1)}PCE${line.slice(4)}`;
    }).map((line, row) => {
      if (row !== 10) return line;
      return `${line.slice(0, 10)}H${line.slice(11)}`;
    }),
  },
  rules: {
    movementSpeed: 160,
    startingLives: 3,
    timeLimitSeconds: 120,
    pointsPerCrystal: 10,
    winCondition: 'collect_all_crystals_then_reach_exit',
    lossCondition: 'no_lives_or_time_expires',
  },
};

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

function renderJobs() {
  return render(
    <MemoryRouter>
      <Jobs />
    </MemoryRouter>,
  );
}

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
        playableGame,
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
  buildGameJobMock.mockReset().mockResolvedValue({
    success: true,
    data: { jobId: 'build-job-2', status: 'queued', createdAt: '2026-10-25T00:00:00.000Z' },
  });
});

describe('Jobs scene viewer preview', () => {
  it('opens a safe in-app preview and navigates between scenes', async () => {
    renderJobs();

    expect(await screen.findByRole('link', { name: 'Play 2D game' })).toHaveAttribute(
      'href',
      '/play/job-1',
    );
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

  it('builds a playable game from a completed manifest and keeps its project link', async () => {
    listJobsMock.mockResolvedValueOnce({
      success: true,
      data: [
        makeJob({
          type: 'game_creation',
          metadata: { projectId: 'project-1' },
          result: {
            contentUrl: 'https://cdn.test/entrance.png',
            format: 'application/json',
            metadata: { manifest },
          },
        }),
      ],
    });

    renderJobs();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Build playable 2D game from this manifest' }),
    );

    expect(buildGameJobMock).toHaveBeenCalledWith(manifest, 'project-1');
    expect(await screen.findByText('Playable 2D build queued (job build-job-2). Track it on Jobs.'))
      .toBeInTheDocument();
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

    renderJobs();

    const previewButtons = await screen.findAllByRole('button', { name: 'Preview scene viewer' });
    expect(previewButtons).toHaveLength(1);
    fireEvent.click(previewButtons[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Entrance' })).toBeInTheDocument();
  });
});
