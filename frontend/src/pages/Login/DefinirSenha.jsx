import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import './Login.css'; // Reusing Login styles for consistency

const DefinirSenha = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    console.log("RENDER DefinirSenha. Token:", token);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setError("Link inválido. Por favor, verifique o link enviado para o seu email.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            await api.post('auth/define-password/', {
                token,
                password
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error("Erro ao definir senha:", err);
            const msg = err.response?.data?.error || "Ocorreu um erro ao definir sua senha. O link pode ter expirado.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="login-page-container">
                <div className="login-main-card">
                    <div className="login-form-wrapper" style={{ width: '100%' }}>
                        <div className="login-form-container" style={{ textAlign: 'center' }}>
                            <div className="success-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#10b981' }}>
                                <CheckCircle size={64} />
                            </div>
                            <h2>Senha Definida com Sucesso!</h2>
                            <p>Sua conta está pronta para uso.</p>
                            <p style={{ marginTop: '1rem' }}>Redirecionando para o login...</p>
                            <button 
                                onClick={() => navigate('/login')}
                                className="btn-submit"
                                style={{ marginTop: '2rem' }}
                            >
                                Ir para o Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page-container">
            <div className="login-main-card">
                 {/* Decorative Side */}
                 <div className="login-decoration">
                    <div className="decoration-content">
                        <div className="brand-badge">
                            <Lock size={24} />
                            <span>Segurança</span>
                        </div>
                        <h1>Defina sua Senha</h1>
                        <p>Crie uma senha forte para proteger sua conta e acessar o sistema.</p>
                    </div>
                     <div className="shape-1"></div>
                     <div className="shape-2"></div>
                </div>

                <div className="login-form-wrapper">
                    <div className="login-form-container">
                        <div className="form-header">
                            <h2>Definir Nova Senha</h2>
                            <p>Preencha os campos abaixo para ativar sua conta.</p>
                        </div>

                        {error && (
                            <div className="error-message" style={{ 
                                color: '#ef4444', 
                                backgroundColor: '#fee2e2', 
                                padding: '0.75rem', 
                                borderRadius: '0.5rem', 
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.9rem'
                            }}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {!token && !error && (
                             <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                                Token não fornecido na URL.
                             </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <label>Nova Senha</label>
                                <div className="input-group">
                                    <Lock className="input-icon" size={20} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className="form-input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={!token}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirmar Senha</label>
                                <div className="input-group">
                                    <Lock className="input-icon" size={20} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className="form-input"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={!token}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading || !token}>
                                <span>{loading ? 'Salvando...' : 'Definir Senha'}</span>
                                {!loading && <ArrowRight size={20} />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DefinirSenha;
