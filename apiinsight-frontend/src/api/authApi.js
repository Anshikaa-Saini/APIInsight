import axiosInstance from './axiosInstance';

export const registerApi = (payload) =>
  axiosInstance.post('/auth/register', payload).then((res) => res.data);

export const loginApi = (payload) =>
  axiosInstance.post('/auth/login', payload).then((res) => res.data);

export const getMeApi = () => axiosInstance.get('/auth/me').then((res) => res.data);
