import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api',
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const checkGoogleConnectionStatus = () => {
  return apiClient.get('/google/status');
};

export const syncMeetingToGoogle = (meetingId) => {
  if (!meetingId) {
    return Promise.reject(new Error('Meeting ID is required'));
  }
  return apiClient.post(`/google/sync/${meetingId}`);
};
