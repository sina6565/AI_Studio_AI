/**
 * Type definitions for mobile app
 */

export type UserRole = 'user' | 'admin';

export type JobStatus =
  | 'queued'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type JobType = 'image' | 'video' | 'audio' | 'speech' | 'game';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface JobResult {
  contentUrl?: string;
  [key: string]: unknown;
}

export interface JobError {
  code: string;
  message: string;
}

export interface Job {
  id: string;
  type: JobType | string;
  status: JobStatus;
  progress?: number;
  result?: JobResult;
  error?: JobError;
  createdAt: string;
  updatedAt?: string;
}

export interface JobStats {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  type?: string;
  createdAt?: string;
}

export interface NavigationParams {
  jobId?: string;
  projectId?: string;
}
