import axios from 'axios';

export async function callML(endpointPath, payload, query = {}) {
  const base = process.env.ML_URL || 'http://127.0.0.1:8000';
  let url = `${base.replace(/\/$/, '')}/${endpointPath.replace(/^\//, '')}`;
  const q = new URLSearchParams(query).toString();
  if (q) url += `?${q}`;
  const resp = await axios.post(url, payload);
  return resp.data;
}
