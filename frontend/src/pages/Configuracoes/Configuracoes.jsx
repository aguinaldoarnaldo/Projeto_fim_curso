import React, { useState } from 'react';
import {
    Settings,
    Database,
    Download,
    Shield,
    User,
    Bell,
    Info,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';

const Configuracoes = () => {
    const [backupStatus, setBackupStatus] = useState('idle'); // idle, processing, completed

    const handleBackup = () => {
        setBackupStatus('processing');
        // Simulate backup process
        setTimeout(() => {
            setBackupStatus('completed');
            setTimeout(() => setBackupStatus('idle'), 5000);
        }, 3000);
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Configurações do Sistema</h1>
                <p>Gerencie as preferências e manutenção do sistema de gestão escolar.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                {/* Side Menu */}
                <div className="table-card" style={{ height: 'fit-content', padding: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', background: '#eff6ff', border: 'none', borderRadius: '8px', color: '#1e3a8a', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                            <Database size={20} /> Manutenção e Backup
                        </button>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', background: 'none', border: 'none', borderRadius: '8px', color: '#4b5563', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
                            <Shield size={20} /> Segurança e Acesso
                        </button>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', background: 'none', border: 'none', borderRadius: '8px', color: '#4b5563', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
                            <User size={20} /> Perfil do Administrador
                        </button>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', background: 'none', border: 'none', borderRadius: '8px', color: '#4b5563', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
                            <Bell size={20} /> Notificações
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Backup Section */}
                    <div className="table-card" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ background: '#eff6ff', color: '#1e3a8a', padding: '12px', borderRadius: '12px' }}>
                                <Database size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Segurança de Dados e Backup</h3>
                                <p style={{ color: '#6b7280', fontSize: '14px' }}>Exporte todos os dados do sistema para segurança.</p>
                            </div>
                        </div>

                        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '15px' }}>Último Backup Realizado</p>
                                    <p style={{ color: '#6b7280', fontSize: '13px' }}>24 de Dezembro de 2024 às 15:30</p>
                                </div>
                                <div style={{ background: '#d1fae5', color: '#065f46', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                                    Integridade OK
                                </div>
                            </div>
                            <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                                O backup inclui todos os registros de alunos, matrículas, notas, turmas e documentos digitais armazenados no servidor.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button
                                onClick={handleBackup}
                                disabled={backupStatus === 'processing'}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    background: '#1e3a8a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    cursor: backupStatus === 'processing' ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    opacity: backupStatus === 'processing' ? 0.7 : 1
                                }}
                            >
                                {backupStatus === 'processing' ? (
                                    <>A processar...</>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Gerar Backup Completo
                                    </>
                                )}
                            </button>
                            <button style={{ flex: 1, padding: '14px 20px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                                Restaurar de ficheiro
                            </button>
                        </div>

                        {backupStatus === 'completed' && (
                            <div style={{ marginTop: '20px', padding: '15px', background: '#d1fae5', color: '#065f46', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                                <CheckCircle size={18} />
                                Backup concluído com sucesso e pronto para download!
                            </div>
                        )}
                    </div>

                    {/* System Info */}
                    <div className="table-card" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ background: '#f3f4f6', color: '#374151', padding: '10px', borderRadius: '10px' }}>
                                <Info size={20} />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Sobre o Sistema</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280', fontSize: '14px' }}>Versão do Software</span>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>v2.4.0 (Stable)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280', fontSize: '14px' }}>Licença</span>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>Institucional - Ilimitada</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                                <span style={{ color: '#6b7280', fontSize: '14px' }}>Espaço em Disco (Anexos)</span>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>14.2 GB / 50 GB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Configuracoes;
