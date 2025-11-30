import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fileService } from '../services/fileService';
import { useWebSocket } from '../hooks/useWebSocket'; // <--- Import the new hook
import { FileMetadata } from '../types';
import '../pages/Dashboard.css';

const DataViewer = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return <p>No data to display</p>;
  const headers = Object.keys(data[0]);
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>{headers.map(h => <td key={`${i}-${h}`}>{String(row[h])}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function Dashboard() {
  const { role, username, logout } = useAuth();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [selectedFileContent, setSelectedFileContent] = useState<any[] | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Stable Load Function
  const loadFiles = useCallback(async () => {
    try {
      const data = await fileService.getAll();
      setFiles(data);
    } catch (error) {
      console.error("Failed to load files", error);
    }
  }, []);

  // 2. Initial Load
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // 3. REAL-TIME MAGIC ✨
  // This one line handles connection, disconnection, and auto-reconnection!
  useWebSocket((message) => {
    if (message === "file_uploaded" || message === "file_deleted") {
      console.log("🔔 Update received:", message);
      loadFiles();
    }
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    try {
      await fileService.upload(e.target.files[0]);
      // Note: WebSocket will trigger the update for everyone, including us
    } catch (error) {
      alert("Upload failed!");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fileService.delete(id);
      // Note: WebSocket will trigger the update
      setSelectedFileContent(null);
    } catch (error) {
      alert("Delete failed! (Are you an admin?)");
    }
  };

  const handleView = async (id: number) => {
    setLoadingContent(true);
    try {
      const data = await fileService.getContent(id);
      setSelectedFileContent(data);
    } catch (error) {
      alert("Could not load file content");
    } finally {
      setLoadingContent(false);
    }
  };

  return (
    <div className="container">
      <div className="nav">
        <div>
          <h2>CSV Dashboard</h2>
          <small>Welcome, {username} ({role})</small>
        </div>
        <button className="secondary" onClick={logout}>Logout</button>
      </div>

      {role === 'admin' && (
        <div className="card admin-upload">
          <strong>Admin Upload:</strong>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleUpload} />
        </div>
      )}

      <div className="card">
        <h3>Available Files</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Size (Bytes)</th>
                <th>Uploaded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id}>
                  <td>{file.filename}</td>
                  <td>{file.size_bytes}</td>
                  <td>{file.uploaded_by}</td>
                  <td>
                    <button onClick={() => handleView(file.id)}>View</button>
                    {role === 'admin' && (
                      <button className="delete" onClick={() => handleDelete(file.id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr><td colSpan={4} className="text-center">No files found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loadingContent && <p className="text-center">Loading CSV Data...</p>}
      
      {selectedFileContent && (
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
            <h3>File Content</h3>
            <button className="secondary" onClick={() => setSelectedFileContent(null)}>Close</button>
          </div>
          <DataViewer data={selectedFileContent} />
        </div>
      )}
    </div>
  );
}