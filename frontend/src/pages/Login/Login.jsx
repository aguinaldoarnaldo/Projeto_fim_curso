import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      {/* Decorative Left Side */}
      <div className="login-decoration">
        <div className="decoration-content">
          <div className="brand-badge">
            <LogIn size={24} />
            <span>SGMatrícula</span>
          </div>
          <h1>Gestão Escolar Simplificada</h1>
          <p>Plataforma integrada para administração académica, financeira e pedagógica. O futuro da educação começa aqui.</p>
          
          <div className="feature-pills">
            <span>Rápido</span>
            <span>Seguro</span>
            <span>Intuitivo</span>
          </div>
        </div>
        
        {/* Abstract Shapes */}
        <div className="shape-1"></div>
        <div className="shape-2"></div>
      </div>

      {/* Login Form Right Side */}
      <div className="login-form-wrapper">
        <div className="login-form-container">
          <div className="mobile-brand">
            <LogIn size={32} className="text-primary" />
          </div>
          
          <div className="form-header">
            <h2>Bem-vindo de volta!</h2>
            <p>Insira os seus dados para aceder ao sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email Institucional</label>
              <div className="input-group">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  placeholder="exemplo@escola.ao"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label>Palavra-passe</label>
                <a href="#" className="forgot-link">Esqueceu?</a>
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="btn-submit">
              <span>Entrar na Plataforma</span>
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="form-footer">
            <p>Ainda não tem conta? <a href="#">Contacte o Administrador</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;