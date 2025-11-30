import { getBaseUrl, getHeaders, handleResponse } from './apiUtils';
import { AuthResponse, User } from '../types';

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${getBaseUrl()}/token`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: formData,
    });
    return handleResponse(response);
  },

  signup: async (username: string, password: string): Promise<User> => {
    const response = await fetch(`${getBaseUrl()}/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  getMe: async (): Promise<User> => {
    const response = await fetch(`${getBaseUrl()}/users/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  }
};