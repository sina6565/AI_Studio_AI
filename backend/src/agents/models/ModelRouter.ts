/**
 * Model routing port. Concrete Ollama / remote adapters are intentionally not
 * included in this foundation commit; remote use must be explicitly permitted.
 */
export interface ModelRouteRequest {
  capability: string;
  preferredModel?: string;
  privacy: 'local_only' | 'remote_allowed';
  maxCost?: number;
  contextWindowRequired?: number;
}

export interface ModelRouteSelection {
  providerId: string;
  modelId: string;
  isRemote: boolean;
  estimatedCost?: number;
}

export interface ModelRouter {
  select(request: ModelRouteRequest): Promise<ModelRouteSelection>;
}
