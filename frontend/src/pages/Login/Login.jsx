import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <LogIn size={32} />
          </div>
          <h1 className="login-title">Bem-vindo de volta</h1>
          <p className="login-subtitle">SGMatrícula - Sistema de Gestão Escolar</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="label-style">Email</label>
            <div className="input-container">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                placeholder="admin@escola.ao"
                required
                className="login-input"
              />
            </div>
          </div>

          <div className="form-group-last">
            <label className="label-style">Palavra-passe</label>
            <div className="input-container">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                required
                className="login-input"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-login-submit"
          >
            Entrar no Sistema
          </button>
        </form>

        <div className="forgot-password-container">
          <a href="#" className="forgot-password-link">Esqueceu a senha?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;