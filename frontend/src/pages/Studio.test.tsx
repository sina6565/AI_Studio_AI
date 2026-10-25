// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../i18n/config';
import Studio from './Studio';

const { listProjectsMock, createGameJobMock } = vi.hoisted(() => ({
  listProjectsMock: vi.fn(),
  createGameJobMock: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: {
    listProjects: listProjectsMock,
    createGameJob: createGameJobMock,
  },
}));

afterEach(() => cleanup());
beforeEach(() => {
  listProjectsMock.mockReset().mockResolvedValue({
    success: true,
    data: [{
      id: 'project-1',
      name: 'My Adventure',
      type: 'game_project',
      jobs: [],
      assets: [],
      createdAt: '2026-10-25T00:00:00.000Z',
      updatedAt: '2026-10-25T00:00:00.000Z',
    }],
  });
  createGameJobMock.mockReset().mockResolvedValue({
    success: true,
    data: { jobId: 'job-1', status: 'queued', createdAt: '2026-10-25T00:00:00.000Z' },
  });
});

describe('Studio playable game creation', () => {
  it('submits a playable build with the selected project association', async () => {
    render(
      <MemoryRouter>
        <Studio />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Game' }));
    const projectSelector = await screen.findByRole('combobox', { name: 'Attach to project (optional)' });
    fireEvent.mouseDown(projectSelector);
    const listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByRole('option', { name: 'My Adventure' }));

    fireEvent.click(screen.getByRole('button', { name: 'Build playable 2D game' }));
    fireEvent.change(screen.getByLabelText('Game title'), { target: { value: 'Crystal Run' } });
    fireEvent.change(screen.getByLabelText('Game description'), { target: { value: 'Collect every crystal.' } });
    fireEvent.change(screen.getByLabelText('Scene name 1'), { target: { value: 'Ruins' } });
    fireEvent.change(screen.getByLabelText('Scene description 1'), { target: { value: 'A courtyard with an exit.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => expect(createGameJobMock).toHaveBeenCalledWith(
      {
        title: 'Crystal Run',
        description: 'Collect every crystal.',
        genre: undefined,
        artStyle: undefined,
        scenes: [{ name: 'Ruins', description: 'A courtyard with an exit.' }],
      },
      'build',
      'project-1',
    ));
    expect(await screen.findByText(/job-1/)).toBeInTheDocument();
  });
});
