import { getBaseUrl, getHeaders, handleResponse } from './apiUtils';
import { FileMetadata } from '../types';

export const fileService = {
  getAll: async (): Promise<FileMetadata[]> => {
    const response = await fetch(`${getBaseUrl()}/files`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${getBaseUrl()}/upload`, {
      method: 'POST',
      headers: getHeaders(false),
      body: formData,
    });
    return handleResponse(response);
  },

  delete: async (id: number) => {
    const response = await fetch(`${getBaseUrl()}/files/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getContent: async (id: number): Promise<any[]> => {
    const response = await fetch(`${getBaseUrl()}/files/${id}/content`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  }
};