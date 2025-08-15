import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { checkGoogleConnectionStatus } from '../services/api';

export default function GoogleConnectPage() {  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await checkGoogleConnectionStatus();
        setIsConnected(response.data.isConnected);
      } catch (err) {
        console.error('Failed to check status:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };    if (success === 'true') {
      setIsConnected(true);
      setIsLoading(false);
    } else {
      checkStatus();
    }
  }, [success, navigate]);

  const handleConnect = () => {
    window.location.href = 'http://localhost:4000/api/google/auth';
  };

  const handleDisconnect = () => {
    alert('Disconnect functionality is not yet implemented.');
  };

  const renderContent = () => {
    if (isLoading) {
      return <p>Loading...</p>;
    }

    if (isConnected) {
      return (
        <>
          <p style={{ color: 'green', marginBottom: '20px' }}>You are connected to Google Calendar.</p>          <button
            onClick={handleDisconnect}
            style={{
              width: '100%',              padding: '10px 16px',
              background: 'linear-gradient(90deg, #dc2626, #ef4444)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        </>
      );
    }

    return (
      <>
        <p style={{ color: '#374151', marginBottom: '20px', fontSize: '14px' }}>
          Connect your account to automatically sync meetings with your Google Calendar.
        </p>
        <button
          onClick={handleConnect}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: 'linear-gradient(90deg, #2563eb, #3b82f6)',            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Connect to Google Calendar
        </button>
      </>
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)' }}>
      <div style={{ maxWidth: 480, width: '100%', backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#2563eb', marginBottom: '24px' }}>          Sync with Google Calendar
        </h2>

        {error && (
          <p style={{ color: '#dc2626', background: '#fee2e2', padding: '8px', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
            <strong>Error:</strong> {decodeURIComponent(error)}
          </p>
        )}

        {success === 'true' && !error && (
           <div style={{ color: '#166534', background: '#dcfce7', padding: '8px', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
            Connection successful!          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}