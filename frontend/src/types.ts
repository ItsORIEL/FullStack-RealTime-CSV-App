export interface User {
  id: number;
  username: string;
  role: string;
}

export interface FileMetadata {
  id: number;
  filename: string;
  filepath: string;
  size_bytes: number;
  uploaded_by: string;
  upload_date: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}