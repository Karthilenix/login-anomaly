import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface HistoryRecord {
  id: number;
  ip_address: string;
  location: string;
  device: string;
  login_time: string;
  risk_score: number;
  is_suspicious: boolean;
}

interface Analytics {
  averageRisk: string;
  suspiciousCount: number;
  recentLogins: number;
  connectedDevicesCount: number;
  lastLocation: string;
  uniqueDevices: string[];
}

const Dashboard = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ 
    averageRisk: '0', 
    suspiciousCount: 0, 
    recentLogins: 0,
    connectedDevicesCount: 0,
    lastLocation: 'Unknown',
    uniqueDevices: []
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const [historyRes, analyticsRes] = await Promise.all([
          axios.get(`${API_URL}/api/history`, config),
          axios.get(`${API_URL}/api/history/risk-analysis`, config)
        ]);

        setHistory(historyRes.data);
        setAnalytics(analyticsRes.data);
      } catch (error) {
        console.error('Error fetching data', error);
        if ((error as any).response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const alertMessage = location.state?.alert;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Overview Dashboard</h1>
        <button className="btn-outline" onClick={handleLogout}>Log Out</button>
      </div>

      {alertMessage && (
        <div className="alert-box">
          <div>
            <strong>Warning:</strong> {alertMessage}
          </div>
        </div>
      )}

      {analytics.suspiciousCount > 0 && !alertMessage && (
        <div className="alert-box warning">
          <div>
            <strong>Attention:</strong> You have {analytics.suspiciousCount} suspicious logins recently. Please check your tracking logs securely.
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Last Known Location</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '0.5rem', color: '#818cf8' }}>
            {analytics.lastLocation}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Connected Devices</div>
          <div className="stat-value">{analytics.connectedDevicesCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Average Risk Score</div>
          <div className="stat-value">{analytics.averageRisk}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Suspicious Attempts</div>
          <div className="stat-value">{analytics.suspiciousCount}</div>
        </div>
      </div>

      {analytics.uniqueDevices.length > 0 && (
         <div style={{ marginBottom: '2rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
           <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Currently Connected Devices</h3>
           <ul style={{ listStyleType: 'none', padding: 0 }}>
             {analytics.uniqueDevices.map((device, idx) => (
               <li key={idx} style={{ padding: '0.75rem', borderBottom: idx !== analytics.uniqueDevices.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                 <span>{device}</span>
               </li>
             ))}
           </ul>
         </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>IP Address</th>
              <th>Location</th>
              <th>Device</th>
              <th>Risk Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map(record => (
              <tr key={record.id}>
                <td>{new Date(record.login_time).toLocaleString()}</td>
                <td>{record.ip_address}</td>
                <td>{record.location}</td>
                <td>{record.device}</td>
                <td>{record.risk_score}</td>
                <td>
                  {record.is_suspicious ? (
                    <span className="badge risk-high">Suspicious</span>
                  ) : record.risk_score > 20 ? (
                    <span className="badge risk-low">Warning</span>
                  ) : (
                    <span className="badge safe">Safe</span>
                  )}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No login history recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
