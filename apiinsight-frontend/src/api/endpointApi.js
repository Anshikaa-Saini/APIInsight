import axiosInstance from './axiosInstance';

export const listEndpointsApi = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/endpoints`).then((res) => res.data);

export const getEndpointApi = (endpointId) =>
  axiosInstance.get(`/endpoints/${endpointId}`).then((res) => res.data);
