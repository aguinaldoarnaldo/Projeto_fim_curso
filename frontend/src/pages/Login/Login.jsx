import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '24px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', 
        width: '100%', 
        maxWidth: '400px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: '#dbeafe', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px',
            color: '#2563eb'
          }}>
            <LogIn size={32} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Bem-vindo de volta</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>SGMatrícula - Sistema de Gestão Escolar</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
              <input 
                type="email" 
                placeholder="admin@escola.ao"
                required
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 40px', 
                  borderRadius: '12px', 
                  border: '1px solid #e5e7eb', 
                  outline: 'none',
                  fontSize: '15px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Palavra-passe</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                required
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 40px', 
                  borderRadius: '12px', 
                  border: '1px solid #e5e7eb', 
                  outline: 'none',
                  fontSize: '15px'
                }}
              />
            </div>
          </div>

          <button 
            type="submit"
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: 600, 
              fontSize: '16px', 
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Entrar no Sistema
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="#" style={{ color: '#2563eb', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>Esqueceu a senha?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;