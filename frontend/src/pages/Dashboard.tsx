import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

interface FileData {
  id: number;
  filename: string;
  size_bytes: number;
  upload_date: string;
  uploaded_by: string;
}

export default function Dashboard() {
  const { token, logout, username, role } = useAuth();
  
  // State
  const [files, setFiles] = useState<FileData[]>([]);
  const [viewData, setViewData] = useState<any[] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);

  const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchFiles = async () => {
    try {
      const response = await apiClient.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error("Failed to load files", error);
    }
  };

  useEffect(() => {
    fetchFiles();
    const websocket = new WebSocket('ws://127.0.0.1:8000/ws');
    
    websocket.onopen = () => console.log("✅ Connected to Real-Time Server");
    websocket.onmessage = (event) => {
      if (event.data === "file_uploaded" || event.data === "file_deleted") {
        fetchFiles();
      }
    };
    socketRef.current = websocket;
    return () => websocket.close();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setUploading(true);
    const fileToUpload = event.target.files[0];
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      await apiClient.post('/upload', formData);
    } catch (error) {
      alert("Upload failed! (Are you an admin?)");
    } finally {
      setUploading(false);
      event.target.value = ""; 
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiClient.delete(`/files/${fileId}`);
    } catch (error) {
      alert("Delete failed!");
    }
  };

  const handleView = async (file: FileData) => {
    try {
      const response = await apiClient.get(`/files/${file.id}/content`);
      setViewData(response.data);
      setSelectedFileName(file.filename);
    } catch (error) {
      alert("Could not load CSV content.");
    }
  };

  return (
    <div className="container">
      {/* HEADER */}
      <div className="nav">
        <h2>📂 CSV Dashboard</h2>
        <div>
          <span>Logged in as: <b>{username}</b> ({role}) </span>
          <button onClick={logout} className="delete small">Logout</button>
        </div>
      </div>

      {/* ADMIN UPLOAD SECTION */}
      {role === 'admin' && (
        <div className="card admin-upload">
          <h3>📤 Upload New CSV</h3>
          <input type="file" accept=".csv" onChange={handleUpload} disabled={uploading} />
          {uploading && <span className="loading-text">Uploading...</span>}
        </div>
      )}

      {/* FILE LIST */}
      <div className="card">
        <h3>Available Files</h3>
        {files.length === 0 ? <p>No files yet.</p> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Uploaded By</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id}>
                    <td>{file.filename}</td>
                    <td>{file.uploaded_by}</td>
                    <td>{file.size_bytes} B</td>
                    <td>
                      <button onClick={() => handleView(file)}>View</button>
                      {role === 'admin' && (
                        <button 
                          className="delete" 
                          onClick={() => handleDelete(file.id)} 
                          style={{ marginLeft: '10px' }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CSV DATA VIEWER */}
      {viewData && (
        <div className="card">
          <div className="nav">
            <h3>👁️ Viewing: {selectedFileName}</h3>
            <button onClick={() => setViewData(null)} className="secondary">Close</button>
          </div>
          
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {viewData.length > 0 && Object.keys(viewData[0]).map(headerKey => (
                    <th key={headerKey}>{headerKey}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((cellValue: any, cellIndex) => (
                      <td key={cellIndex}>{cellValue}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}