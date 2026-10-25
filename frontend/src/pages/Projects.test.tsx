// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../i18n/config';
import Projects from './Projects';

const { listProjectsMock, listJobsMock, createProjectMock } = vi.hoisted(() => ({
  listProjectsMock: vi.fn(),
  listJobsMock: vi.fn(),
  createProjectMock: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: {
    listProjects: listProjectsMock,
    listJobs: listJobsMock,
    createProject: createProjectMock,
  },
}));

const playableGame = {
  schemaVersion: 1,
  engine: { id: 'phaser', version: '4.2.1' },
  title: 'Crystal Run',
  description: 'Collect crystals.',
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

afterEach(() => cleanup());

beforeEach(() => {
  listProjectsMock.mockReset().mockResolvedValue({
    success: true,
    data: [{
      id: 'project-1',
      name: 'My Adventure',
      type: 'game_project',
      description: 'Test project',
      jobs: ['job-1'],
      assets: [],
      createdAt: '2026-10-25T00:00:00.000Z',
      updatedAt: '2026-10-25T00:00:00.000Z',
    }],
  });
  listJobsMock.mockReset().mockResolvedValue({
    success: true,
    data: [{
      id: 'job-1',
      type: 'game_build',
      status: 'completed',
      priority: 'normal',
      input: { title: 'Crystal Run' },
      metadata: { projectId: 'project-1' },
      result: { contentUrl: 'data:text/html,viewer', format: 'text/html', metadata: { playableGame } },
      createdAt: '2026-10-25T00:00:00.000Z',
      updatedAt: '2026-10-25T00:00:00.000Z',
    }],
  });
  createProjectMock.mockReset();
});

describe('Projects linked games', () => {
  it('shows playable builds linked by the project job list and opens the game route', async () => {
    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Crystal Run')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Play' })).toHaveAttribute('href', '/play/job-1');
  });
});
