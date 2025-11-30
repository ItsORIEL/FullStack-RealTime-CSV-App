const API_URL = import.meta.env.VITE_API_URL;

export const getHeaders = (isJson = true) => {
  const headers: HeadersInit = {};
  const token = localStorage.getItem('token');
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

export const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API Request Failed');
  }
  return response.json();
};

export const getBaseUrl = () => API_URL;