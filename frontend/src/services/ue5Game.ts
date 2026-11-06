import apiClient from './api';

export interface UE5RoomBuildRequest {
  manifest: Record<string, unknown>;
  projectId?: string;
}

/**
 * Submit a 3D room/game build through the authenticated jobs API.
 * The actual runtime target is Unreal Engine 5.
 */
export async function submitUE5RoomBuild(
  request: UE5RoomBuildRequest,
  projectId?: string,
) {
  return apiClient.createJob({
    type: 'game_3d_build',
    input: request,
    ...(projectId ? { projectId } : {}),
  });
}
