jest.mock('axios', () => ({ __esModule: true, default: { create: jest.fn() } }));
import axios from 'axios';
import { HuggingFaceCatalogService } from '../src/models/HuggingFaceCatalogService';

describe('HuggingFaceCatalogService', () => {
  const create = axios.create as unknown as jest.Mock;
  const get = jest.fn();

  beforeEach(() => {
    get.mockReset();
    create.mockReset();
    create.mockReturnValue({ get });
  });

  it('discovers and normalizes models without claiming inference readiness', async () => {
    get.mockResolvedValue({ data: [{
      id: 'org/image-model',
      author: 'org',
      pipeline_tag: 'text-to-image',
      tags: ['license:apache-2.0'],
      downloads: 1200,
      likes: 42,
      cardData: { license: 'apache-2.0' },
    }] });
    const service = new HuggingFaceCatalogService();
    const models = await service.searchModels({ task: 'text-to-image', limit: 10 });
    expect(models[0]).toMatchObject({
      id: 'org/image-model',
      modalities: ['image'],
      license: 'apache-2.0',
      executionReady: false,
      source: 'huggingface_hub',
    });
    expect(get).toHaveBeenCalledWith('/api/models', {
      params: { limit: 10, full: 'true', sort: 'downloads', direction: -1, pipeline_tag: 'text-to-image' },
    });
  });

  it('classifies model cards across video, audio, speech and 3D tags', async () => {
    get.mockResolvedValue({ data: [{
      id: 'org/multimodal',
      pipeline_tag: 'image-to-video',
      tags: ['text-to-3d', 'text-to-speech', 'automatic-speech-recognition'],
    }] });
    const service = new HuggingFaceCatalogService();
    const [model] = await service.searchModels();
    expect(model.modalities).toEqual(expect.arrayContaining(['video', '3d', 'audio', 'speech']));
  });

  it('clamps requested limits and trims search input', async () => {
    get.mockResolvedValue({ data: [] });
    const service = new HuggingFaceCatalogService();
    await service.searchModels({ search: '  llama  ', limit: 1000, sort: 'likes' });
    expect(get).toHaveBeenCalledWith('/api/models', {
      params: { limit: 100, full: 'true', sort: 'likes', direction: -1, search: 'llama' },
    });
  });
});
