import axios, { AxiosInstance } from 'axios';

export interface HuggingFaceModel {
  id: string;
  author?: string;
  pipelineTag?: string;
  libraryName?: string;
  downloads?: number;
  likes?: number;
  gated?: boolean | string;
  private?: boolean;
  tags: string[];
  license?: string;
  modalities: string[];
  task?: string;
  source: 'huggingface_hub';
  executionReady: false;
}

export interface HuggingFaceSearchOptions {
  search?: string;
  task?: string;
  limit?: number;
  sort?: 'downloads' | 'likes' | 'lastModified';
}

/**
 * Read-only Hugging Face Hub catalog integration.
 * Hub discovery is deliberately separate from inference execution: a Hub
 * model card does not prove that an inference provider/endpoint can run it.
 */
export class HuggingFaceCatalogService {
  private client: AxiosInstance;

  constructor(client?: AxiosInstance) {
    this.client = client || axios.create({
      baseURL: 'https://huggingface.co',
      timeout: Number(process.env.HUGGINGFACE_TIMEOUT || 15000),
      headers: {
        ...(process.env.HUGGINGFACE_TOKEN
          ? { Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}` }
          : {}),
      },
    });
  }

  private inferModalities(model: any): string[] {
    const tags: string[] = Array.isArray(model?.tags) ? model.tags : [];
    const task = String(model?.pipeline_tag || '').toLowerCase();
    const text = tags.join(' ').toLowerCase() + ' ' + task;
    const modalities = new Set<string>();

    if (/text-generation|text2text-generation|conversational|text-classification|question-answering|feature-extraction/.test(text)) modalities.add('text');
    if (/text-to-image|image-to-image|image-generation|text-to-3d|image-to-3d|image-classification|image-segmentation/.test(text)) modalities.add('image');
    if (/text-to-video|image-to-video|video-generation|video-classification/.test(text)) modalities.add('video');
    if (/text-to-audio|text-to-speech|text-to-music|audio-generation|audio-to-audio/.test(text)) modalities.add('audio');
    if (/automatic-speech-recognition|audio-to-text|speech-to-text/.test(text)) modalities.add('speech');
    if (/text-to-3d|image-to-3d|3d-generation|3d-model/.test(text)) modalities.add('3d');
    if (/text-to-motion|motion-generation|animation/.test(text)) modalities.add('animation');

    return Array.from(modalities);
  }

  private normalize(model: any): HuggingFaceModel {
    const tags = Array.isArray(model?.tags) ? model.tags.filter((tag: unknown): tag is string => typeof tag === 'string') : [];
    const cardData = model?.cardData || {};
    return {
      id: String(model?.id || model?.modelId || ''),
      author: model?.author,
      pipelineTag: model?.pipeline_tag,
      libraryName: model?.library_name,
      downloads: Number.isFinite(model?.downloads) ? model.downloads : undefined,
      likes: Number.isFinite(model?.likes) ? model.likes : undefined,
      gated: model?.gated,
      private: Boolean(model?.private),
      tags,
      license: typeof cardData.license === 'string' ? cardData.license : tags.find((tag) => tag.startsWith('license:'))?.slice(8),
      modalities: this.inferModalities(model),
      task: model?.pipeline_tag,
      source: 'huggingface_hub',
      executionReady: false,
    };
  }

  async searchModels(options: HuggingFaceSearchOptions = {}): Promise<HuggingFaceModel[]> {
    const limit = Math.min(100, Math.max(1, Math.floor(options.limit || 30)));
    const params: Record<string, string | number> = {
      limit,
      full: 'true',
      sort: options.sort || 'downloads',
      direction: -1,
    };
    if (options.search?.trim()) params.search = options.search.trim().slice(0, 120);
    if (options.task?.trim()) params.pipeline_tag = options.task.trim().slice(0, 80);

    const response = await this.client.get('/api/models', { params });
    const models = Array.isArray(response.data) ? response.data : [];
    return models.map((model: any) => this.normalize(model)).filter((model: HuggingFaceModel) => model.id);
  }
}

export default new HuggingFaceCatalogService();
