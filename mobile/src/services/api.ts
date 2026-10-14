/**
 * API Client for Mobile
 * Shares configuration with frontend
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { Job, JobStats, Project, User } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface CreateJobPayload {
  type: string;
  input: Record<string, unknown>;
  priority?: number;
  webhookUrl?: string;
}

class MobileAPIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
    });

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  private unwrap<T>(response: AxiosResponse<ApiEnvelope<T>>): T {
    return response.data.data;
  }

  async healthCheck(): Promise<{ status: string }> {
    const res = await this.client.get('/v1/health');
    return res.data;
  }

  async register(
    email: string,
    username: string,
    password: string,
  ): Promise<AuthResult> {
    const res = await this.client.post<ApiEnvelope<AuthResult>>(
      '/v1/auth/register',
      { email, username, password },
    );
    const result = this.unwrap(res);
    this.setToken(result.token);
    return result;
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const res = await this.client.post<ApiEnvelope<AuthResult>>(
      '/v1/auth/login',
      { email, password },
    );
    const result = this.unwrap(res);
    this.setToken(result.token);
    return result;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/v1/auth/logout');
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<User> {
    const res = await this.client.get<ApiEnvelope<User>>('/v1/users/me');
    return this.unwrap(res);
  }

  async createJob(payload: CreateJobPayload): Promise<Job> {
    const res = await this.client.post<ApiEnvelope<Job>>('/v1/jobs', payload);
    return this.unwrap(res);
  }

  async listJobs(): Promise<Job[]> {
    const res = await this.client.get<ApiEnvelope<Job[]>>('/v1/jobs');
    return this.unwrap(res);
  }

  async getJobStats(): Promise<JobStats> {
    const res = await this.client.get<ApiEnvelope<JobStats>>('/v1/jobs/stats');
    return this.unwrap(res);
  }

  async getJobStatus(jobId: string): Promise<Job> {
    const res = await this.client.get<ApiEnvelope<Job>>(`/v1/jobs/${jobId}`);
    return this.unwrap(res);
  }

  async cancelJob(jobId: string): Promise<void> {
    await this.client.post(`/v1/jobs/${jobId}/cancel`);
  }

  async listProjects(): Promise<Project[]> {
    const res = await this.client.get<ApiEnvelope<Project[]>>('/v1/projects');
    return this.unwrap(res);
  }

  async createProject(payload: {
    name: string;
    description?: string;
    type?: string;
  }): Promise<Project> {
    const res = await this.client.post<ApiEnvelope<Project>>(
      '/v1/projects',
      payload,
    );
    return this.unwrap(res);
  }

  async generate(
    type: string,
    input: Record<string, unknown>,
  ): Promise<Job> {
    return this.createJob({ type, input });
  }
}

export default new MobileAPIClient();
