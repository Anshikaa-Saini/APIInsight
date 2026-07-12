import axiosInstance from './axiosInstance';

export const executeTestCaseApi = (testCaseId) =>
  axiosInstance.post(`/testcases/${testCaseId}/execute`).then((res) => res.data);

export const executeEndpointApi = (endpointId) =>
  axiosInstance.post(`/endpoints/${endpointId}/execute`).then((res) => res.data);

export const executeProjectApi = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/execute`).then((res) => res.data);

export const listExecutionsForEndpointApi = (endpointId) =>
  axiosInstance.get(`/endpoints/${endpointId}/executions`).then((res) => res.data);

export const listExecutionsForProjectApi = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/executions`).then((res) => res.data);

export const updateBaseUrlApi = (projectId, baseUrl) =>
  axiosInstance.patch(`/projects/${projectId}/base-url`, { baseUrl }).then((res) => res.data);
