import axios from 'axios';
import type { APIJob, APICandidate, APIPipelineEvent } from '../types';

const api = axios.create({ baseURL: '/api' });

export const listJobs = (): Promise<APIJob[]> =>
  api.get('/jobs').then(r => r.data);

export const getJob = (id: string): Promise<APIJob> =>
  api.get(`/jobs/${id}`).then(r => r.data);

export const createJob = (company_name: string, jd_raw: string): Promise<{ id: string }> =>
  api.post('/jobs', { company_name, jd_raw }).then(r => r.data);

export const getShortlist = (id: string, matchWeight = 0.6, interestWeight = 0.4): Promise<APICandidate[]> =>
  api.get(`/jobs/${id}/shortlist`, { params: { matchWeight, interestWeight } }).then(r => r.data);

export const getPipelineEvents = (id: string): Promise<APIPipelineEvent[]> =>
  api.get(`/jobs/${id}/pipeline-events`).then(r => r.data);

export const getOutreachCandidates = (): Promise<APICandidate[]> =>
  api.get('/jobs/outreach-candidates').then(r => r.data);
