import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Background Decorative Elements */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '400px',
                height: '400px',
                background: 'rgba(37, 99, 235, 0.05)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                zIndex: 0
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-5%',
                width: '300px',
                height: '300px',
                background: 'rgba(239, 68, 68, 0.05)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                zIndex: 0
            }}></div>

            <div style={{
                textAlign: 'center',
                maxWidth: '600px',
                padding: '40px',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                borderRadius: '32px',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                zIndex: 1,
                animation: 'slideUp 0.6s ease-out'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '30px'
                }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        background: '#fef2f2',
                        borderRadius: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ef4444',
                        boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2)'
                    }}>
                        <AlertCircle size={56} />
                    </div>
                </div>

                <h1 style={{
                    fontSize: '120px',
                    fontWeight: '900',
                    margin: '0',
                    lineHeight: '1',
                    background: 'linear-gradient(to right, #1e293b, #475569)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-5px'
                }}>
                    404
                </h1>
                
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginTop: '20px',
                    marginBottom: '10px'
                }}>
                    Página Não Encontrada
                </h2>
                
                <p style={{
                    color: '#64748b',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    marginBottom: '40px'
                }}>
                    Ops! O destino que procura parece ter desaparecido ou nunca existiu. 
                    Verifique se o endereço está correto ou volte para a base inicial.
                </p>

                <div style={{
                    display: 'flex',
                    gap: '16px',
                    justifyContent: 'center'
                }}>
                    <button 
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '14px 24px',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#475569',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <ArrowLeft size={18} /> Voltar atrás
                    </button>

                    <button 
                        onClick={() => navigate('/dashboard')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '14px 24px',
                            borderRadius: '16px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(37, 99, 235, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.3)';
                        }}
                    >
                        <Home size={18} /> Ir para Início
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default NotFound;
