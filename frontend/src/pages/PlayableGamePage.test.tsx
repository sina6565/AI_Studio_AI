// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { GameSnapshot } from '../games/playableGame';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '../i18n/config';
import PlayableGamePage from './PlayableGamePage';

const { getJobStatusMock } = vi.hoisted(() => ({ getJobStatusMock: vi.fn() }));

vi.mock('../services/api', () => ({
  default: { getJobStatus: getJobStatusMock },
}));

vi.mock('../components/games/PhaserPlayableGameCanvas', async () => {
  const ReactModule = await import('react');
  return {
    default: ({ onSnapshot }: { onSnapshot: (snapshot: GameSnapshot) => void }) =>
      ReactModule.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onSnapshot({
            x: 48,
            y: 48,
            score: 60,
            collectedCrystals: 6,
            totalCrystals: 6,
            lives: 3,
            secondsRemaining: 32,
            status: 'won',
            endReason: 'exit',
            invulnerable: false,
          }),
        },
        'Simulate completed play',
      ),
  };
});

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

function renderGame() {
  return render(
    <MemoryRouter initialEntries={['/play/job-1']}>
      <Routes>
        <Route path="/play/:jobId" element={<PlayableGamePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => cleanup());
beforeEach(() => {
  getJobStatusMock.mockReset().mockResolvedValue({
    success: true,
    data: {
      id: 'job-1',
      type: 'game_build',
      status: 'completed',
      priority: 'normal',
      input: { title: 'Crystal Run' },
      result: {
        contentUrl: 'data:text/html,viewer',
        format: 'text/html',
        metadata: { playableGame },
      },
      createdAt: '2026-10-25T00:00:00.000Z',
      updatedAt: '2026-10-25T00:00:00.000Z',
    },
  });
});

describe('PlayableGamePage', () => {
  it('loads a validated game build and reflects a completed gameplay state', async () => {
    renderGame();

    expect(await screen.findByText('Crystal Run')).toBeInTheDocument();
    expect(screen.getByText('Use arrow keys or WASD to move. Collect every crystal, avoid red hazards, then reach the green exit before time runs out.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Simulate completed play' }));
    expect(await screen.findByText(/You escaped!/)).toBeInTheDocument();
    expect(screen.getByText(/Final score: 60/)).toBeInTheDocument();
  });

  it('does not start a runtime for an unsupported definition', async () => {
    getJobStatusMock.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'job-1',
        type: 'game_build',
        status: 'completed',
        priority: 'normal',
        input: {},
        result: { contentUrl: '', format: 'text/html', metadata: { playableGame: { script: 'bad' } } },
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-25T00:00:00.000Z',
      },
    });
    renderGame();

    expect(await screen.findByText('The saved game definition is invalid or unsupported.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Simulate completed play' })).not.toBeInTheDocument();
  });
});
