import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const checkHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const runScan = async (url) => {
  const res = await api.post('/scans', { url });
  return res.data;
};

export const getScans = async () => {
  const res = await api.get('/scans');
  return res.data;
};

export const getScanById = async (id) => {
  const res = await api.get(`/scans/${id}`);
  return res.data;
};

export const deleteScan = async (id) => {
  const res = await api.delete(`/scans/${id}`);
  return res.data;
};

export const compareScans = async (aId, bId) => {
  const res = await api.get(`/scans/compare?a=${encodeURIComponent(aId)}&b=${encodeURIComponent(bId)}`);
  return res.data;
};

export const getReportUrl = (id) => {
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${base}/scans/${id}/report`;
};

export default api;
