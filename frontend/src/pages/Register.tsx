import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/auth/register`, { email, password });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel">
        <div className="panel-header">
          <h1>Create Account</h1>
          <p>Start tracking your secure logins</p>
        </div>
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" 
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password" 
              required 
            />
          </div>
          
          {error && <div className="error-text">{error}</div>}
          
          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
          </div>
        </form>
        
        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in instead</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
