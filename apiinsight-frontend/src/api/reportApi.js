import axiosInstance from './axiosInstance';

export const generateReportApi = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/generate-report`).then((res) => res.data);

export const getLatestReportApi = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/report`).then((res) => res.data);

export const getReportHistoryApi = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/reports/history`).then((res) => res.data);
