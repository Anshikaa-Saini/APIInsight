import axiosInstance from './axiosInstance';

export const uploadFileApi = (file) => {
  const formData = new FormData();
  formData.append('specFile', file);
  return axiosInstance
    .post('/projects/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

export const uploadUrlApi = (url) =>
  axiosInstance.post('/projects/upload-url', { url }).then((res) => res.data);

export const listProjectsApi = () => axiosInstance.get('/projects').then((res) => res.data);

export const getProjectApi = (projectId) =>
  axiosInstance.get(`/projects/${projectId}`).then((res) => res.data);

export const deleteProjectApi = (projectId) =>
  axiosInstance.delete(`/projects/${projectId}`).then((res) => res.data);
