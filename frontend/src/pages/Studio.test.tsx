// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../i18n/config';
import Studio from './Studio';

const { listProjectsMock, createGameJobMock, createPromptGameJobMock, createJobMock, getJobStatusMock } = vi.hoisted(() => ({
  listProjectsMock: vi.fn(),
  createGameJobMock: vi.fn(),
  createPromptGameJobMock: vi.fn(),
  createJobMock: vi.fn(),
  getJobStatusMock: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: {
    listProjects: listProjectsMock,
    createGameJob: createGameJobMock,
    createPromptGameJob: createPromptGameJobMock,
    createJob: createJobMock,
    getJobStatus: getJobStatusMock,
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
    data: { jobId: 'scene-job-1', status: 'queued', createdAt: '2026-10-25T00:00:00.000Z' },
  });
  createPromptGameJobMock.mockReset().mockResolvedValue({
    success: true,
    data: { jobId: 'job-1', status: 'queued', createdAt: '2026-10-25T00:00:00.000Z' },
  });
  createJobMock.mockReset().mockResolvedValue({
    success: true,
    data: { jobId: 'image-job-1', status: 'queued' },
  });
  getJobStatusMock.mockReset().mockResolvedValue({
    success: true,
    data: {
      id: 'image-job-1',
      status: 'completed',
      result: { contentUrl: 'https://cdn.example.test/generated.png', format: 'png' },
    },
  });
});

describe('Studio playable game creation', () => {
  it('builds a playable 2D game from one prompt and attaches it to the selected project', async () => {
    getJobStatusMock.mockResolvedValue({
      success: true,
      data: {
        id: 'job-1',
        status: 'completed',
        result: { metadata: { playableGame: { schemaVersion: 1 } } },
      },
    });
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
    fireEvent.change(screen.getByLabelText('Describe your game in one prompt'), {
      target: { value: 'Build a 2D maze adventure where the player collects gems and reaches the exit.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Build playable game' }));

    await waitFor(() => expect(createPromptGameJobMock).toHaveBeenCalledWith(
      'Build a 2D maze adventure where the player collects gems and reaches the exit.',
      'project-1',
    ));
    expect(await screen.findByRole('link', { name: 'Play game' }, { timeout: 5000 })).toHaveAttribute('href', '/play/job-1');
  });

  it('requires a meaningful prompt before enabling the playable game build', async () => {
    render(<MemoryRouter><Studio /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Game' }));
    fireEvent.click(screen.getByRole('button', { name: 'Build playable 2D game' }));
    fireEvent.change(screen.getByLabelText('Describe your game in one prompt'), {
      target: { value: 'short' },
    });
    expect(screen.getByRole('button', { name: 'Build playable game' })).toBeDisabled();
    expect(createPromptGameJobMock).not.toHaveBeenCalled();
  });

  it('keeps the original scene-concept creation path available', async () => {
    render(<MemoryRouter><Studio /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Game' }));
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
      'create',
      undefined,
    ));
  });
});

describe('Studio asynchronous media generation', () => {
  it('polls the queued job and displays the media only after completion', async () => {
    render(
      <MemoryRouter>
        <Studio />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Describe what you want to create...'), {
      target: { value: 'A luminous blue planet' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => expect(createJobMock).toHaveBeenCalledWith({
      type: 'image_generation',
      input: { prompt: 'A luminous blue planet', size: '1024x1024', quality: 'standard' },
    }));
    const image = await screen.findByRole('img', { name: 'Generated' }, { timeout: 5000 });
    expect(image).toHaveAttribute('src', 'https://cdn.example.test/generated.png');
    expect(getJobStatusMock).toHaveBeenCalledWith('image-job-1');
  });
});
