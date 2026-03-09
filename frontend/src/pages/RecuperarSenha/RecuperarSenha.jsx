import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import './RecuperarSenha.css';

const RecuperarSenha = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleRecover = async (e) => {
        e.preventDefault();
        if (loading) return;
        
        setLoading(true);
        setError(null);

        try {
            await api.post('auth/recover-password/', { email });
            setSubmitted(true);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('Nenhuma conta existente com este e-mail.');
            } else {
                setError(err.response?.data?.error || 'Não foi possível processar o seu pedido. Tente novamente ou contacte o administrador.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-main-card" style={{ maxWidth: ' political', width: '500px', height: 'auto', minHeight: '400px', flexDirection: 'column' }}>
                <div className="login-form-wrapper" style={{ padding: '40px' }}>
                    <div className="login-form-container">
                        {!submitted ? (
                            <>
                                <div className="form-header">
                                    <button onClick={() => navigate('/login')} className="back-btn">
                                        <ArrowLeft size={18} /> Voltar ao Login
                                    </button>
                                    <h2 style={{ marginTop: '20px' }}>Recuperar Senha</h2>
                                    <p>Insira o seu e-mail corporativo. Enviaremos um link para redefinir a sua palavra-passe.</p>
                                </div>

                                {error && (
                                    <div className="error-box">
                                        <AlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleRecover} className="login-form">
                                    <div className="form-group">
                                        <label>E-mail de Acesso</label>
                                        <div className="input-group">
                                            <Mail className="input-icon" size={20} />
                                            <input
                                                type="email"
                                                placeholder="exemplo@escola.ao"
                                                required
                                                className="form-input"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-submit" disabled={loading}>
                                        <span>{loading ? 'Enviando...' : 'Enviar Link de Recuperação'}</span>
                                        {!loading && <Send size={20} />}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="success-container" style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ color: '#059669', marginBottom: '20px' }}>
                                    <CheckCircle size={64} style={{ margin: '0 auto' }} />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>E-mail Enviado!</h2>
                                <p style={{ color: '#64748b', marginBottom: '32px' }}>
                                    Verifique a sua caixa de entrada (e a pasta de spam). Enviámos instruções para definir uma nova senha para <strong>{email}</strong>.
                                </p>
                                <button onClick={() => navigate('/login')} className="btn-submit">
                                    <span>Voltar para o Login</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecuperarSenha;
