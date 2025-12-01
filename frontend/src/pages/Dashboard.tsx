import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { fileService } from '../services/fileService';
import { useWebSocket } from '../hooks/useWebSocket';
import { FileMetadata } from '../types';
import DataViewer from '../components/DataViewer';

export default function Dashboard() {
  const { role, username, logout } = useAuth();
  const [filesList, setFilesList] = useState<FileMetadata[]>([]);
  const [selectedFileContent, setSelectedFileContent] = useState<Record<string, string | number>[] | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFilesList = useCallback(async () => {
    try {
      const filesData = await fileService.getAll();
      setFilesList(filesData);
    } catch {
      console.error('Failed to load files');
    }
  }, []);

  useEffect(() => {
    loadFilesList();
  }, [loadFilesList]);

  useWebSocket((message) => {
    if (message === 'file_uploaded' || message === 'file_deleted') {
      console.log('🔔 Update received:', message);
      loadFilesList();
    }
  });

  const handleFileUpload = async (uploadEvent: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadEvent.target.files || !uploadEvent.target.files[0]) return;
    try {
      await fileService.upload(uploadEvent.target.files[0]);
    } catch {
      alert('Upload failed!');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileDelete = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await fileService.delete(fileId);
      setSelectedFileContent(null);
    } catch {
      alert('Delete failed! (Are you an admin?)');
    }
  };

  const handleViewFile = async (fileId: number) => {
    setIsLoadingContent(true);
    try {
      const csvContent = await fileService.getContent(fileId);
      setSelectedFileContent(csvContent);
    } catch {
      alert('Could not load file content');
    } finally {
      setIsLoadingContent(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ padding: 2 }}>
        {/* Header Toolbar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
            padding: 2,
            backgroundColor: '#fafafa',
            borderRadius: 1,
          }}
        >
          <Box>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600, marginBottom: 0.5 }}>
              CSV Dashboard
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Welcome, <strong>{username}</strong> ({role})
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={logout}
          >
            Logout
          </Button>
        </Box>
        {role === 'admin' && (
          <Card
            sx={{
              marginBottom: 3,
              padding: 3,
              borderLeft: '5px solid #1976d2',
              backgroundColor: '#f3f4f6',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <CloudUploadIcon sx={{ color: '#1976d2' }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Admin Upload:
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ flex: 1 }}
              />
            </Stack>
          </Card>
        )}

        <Card sx={{ marginBottom: 3 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flex: 1, fontWeight: 600 }}>
              Available Files
            </Typography>
          </Toolbar>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>
                    Filename
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>
                    Size (Bytes)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>
                    Uploaded By
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filesList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ padding: 3 }}>
                      <Typography color="textSecondary">No files found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filesList.map((fileItem) => (
                    <TableRow
                      key={fileItem.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f9f9f9',
                        },
                      }}
                    >
                      <TableCell>{fileItem.filename}</TableCell>
                      <TableCell>{fileItem.size_bytes}</TableCell>
                      <TableCell>{fileItem.uploaded_by}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="info"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewFile(fileItem.id)}
                          >
                            View
                          </Button>
                          {role === 'admin' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleFileDelete(fileItem.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {isLoadingContent && (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {selectedFileContent && (
          <Card sx={{ marginBottom: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 2,
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                File Content
              </Typography>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setSelectedFileContent(null)}
              >
                Close
              </Button>
            </Box>
            <Box sx={{ padding: 2 }}>
              <DataViewer csvData={selectedFileContent} />
            </Box>
          </Card>
        )}
      </Box>
    </Container>
  );
}