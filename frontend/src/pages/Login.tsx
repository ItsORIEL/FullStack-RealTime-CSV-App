import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      if (isLoginMode) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await axios.post('http://127.0.0.1:8000/token', formData);
        login(response.data.access_token);
        navigate('/'); 
      } else {
        await axios.post('http://127.0.0.1:8000/signup', { username, password });
        
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        const response = await axios.post('http://127.0.0.1:8000/token', formData);
        login(response.data.access_token);
        navigate('/');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.response?.data?.detail || "An error occurred");
    }
  };

  return (
    <div className="container login-container">
      <div className="card">
        <h2 className="text-center">{isLoginMode ? "Login" : "Sign Up"}</h2>
        
        {errorMessage && <div className="error">{errorMessage}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              value={username} 
              onChange={event => setUsername(event.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={event => setPassword(event.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="full-width">
            {isLoginMode ? "Log In" : "Create Account"}
          </button>
        </form>

        <p className="text-center" style={{ marginTop: '20px' }}>
          {isLoginMode ? "New user?" : "Already have an account?"}{" "}
          <span 
            className="link-text"
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode ? "Sign up here" : "Login here"}
          </span>
        </p>
      </div>
    </div>
  );
}