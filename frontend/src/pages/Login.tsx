import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Link,
  Container,
  Stack,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuthSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    setIsProcessing(true);

    try {
      if (isLoginMode) {
        // Login Flow
        const authResponse = await authService.login(usernameInput, passwordInput);
        login(authResponse.access_token);
        navigate('/');
      } else {
        // Signup Flow
        await authService.signup(usernameInput, passwordInput);
        // Auto login after signup
        const authResponse = await authService.login(usernameInput, passwordInput);
        login(authResponse.access_token);
        navigate('/');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLoginMode(!isLoginMode);
    setUsernameInput('');
    setPasswordInput('');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Card
          sx={{
            width: '100%',
            padding: 4,
            boxShadow: 3,
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            align="center"
            gutterBottom
            sx={{ marginBottom: 3, fontWeight: 600 }}
          >
            {isLoginMode ? 'Login' : 'Create Account'}
          </Typography>

          <Box component="form" onSubmit={handleAuthSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Username"
                type="text"
                value={usernameInput}
                onChange={(event) => setUsernameInput(event.target.value)}
                required
                variant="outlined"
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                required
                variant="outlined"
              />

              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                disabled={isProcessing}
                sx={{ marginTop: 1, padding: '10px' }}
              >
                {isProcessing
                  ? 'Processing...'
                  : isLoginMode
                    ? 'Sign In'
                    : 'Sign Up'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ marginTop: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              {isLoginMode ? "Need an account? " : "Have an account? "}
              <Link
                component="button"
                variant="body2"
                onClick={toggleAuthMode}
                sx={{
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {isLoginMode ? 'Sign up' : 'Login'}
              </Link>
            </Typography>
          </Box>
        </Card>
      </Box>
    </Container>
  );
}