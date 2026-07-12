import axiosInstance from './axiosInstance';

export const generateTestCasesForEndpointApi = (endpointId) =>
  axiosInstance.post(`/endpoints/${endpointId}/generate-testcases`).then((res) => res.data);

export const generateTestCasesForProjectApi = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/generate-testcases`).then((res) => res.data);

export const listTestCasesApi = (endpointId) =>
  axiosInstance.get(`/endpoints/${endpointId}/testcases`).then((res) => res.data);
