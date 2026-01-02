import React, { useState } from 'react';
import './Configuracoes.css';

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

            <div className="config-container-grid">
                {/* Side Menu */}
                <div className="table-card config-side-menu">
                    <div className="config-menu-list">
                        <button className="config-menu-btn config-menu-btn-active">
                            <Database size={20} /> Manutenção e Backup
                        </button>
                        <button className="config-menu-btn config-menu-btn-inactive">
                            <Shield size={20} /> Segurança e Acesso
                        </button>
                        <button className="config-menu-btn config-menu-btn-inactive">
                            <User size={20} /> Perfil do Administrador
                        </button>
                        <button className="config-menu-btn config-menu-btn-inactive">
                            <Bell size={20} /> Notificações
                        </button>
                    </div>
                </div>


                {/* Content Area */}
                <div className="config-content-column">
                    {/* Backup Section */}
                    <div className="table-card" style={{ padding: '30px' }}>
                        <div className="config-section-header">
                            <div className="config-icon-box-blue">
                                <Database size={24} />
                            </div>
                            <div>
                                <h3 className="config-section-title">Segurança de Dados e Backup</h3>
                                <p className="config-section-subtitle">Exporte todos os dados do sistema para segurança.</p>
                            </div>
                        </div>

                        <div className="backup-info-card">
                            <div className="backup-info-header">
                                <div>
                                    <p className="backup-info-label">Último Backup Realizado</p>
                                    <p className="backup-info-date">24 de Dezembro de 2024 às 15:30</p>
                                </div>
                                <div className="status-integrity-badge">
                                    Integridade OK
                                </div>
                            </div>
                            <p className="backup-info-description">
                                O backup inclui todos os registros de alunos, matrículas, notas, turmas e documentos digitais armazenados no servidor.
                            </p>
                        </div>


                        <div className="config-actions-row">
                            <button
                                onClick={handleBackup}
                                disabled={backupStatus === 'processing'}
                                className="btn-config-primary"
                                style={{
                                    cursor: backupStatus === 'processing' ? 'not-allowed' : 'pointer',
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
                            <button className="btn-config-secondary">
                                Restaurar de ficheiro
                            </button>
                        </div>


                        {backupStatus === 'completed' && (
                            <div className="backup-success-alert">
                                <CheckCircle size={18} />
                                Backup concluído com sucesso e pronto para download!
                            </div>
                        )}
                    </div>


                    {/* System Info */}
                    <div className="table-card" style={{ padding: '30px' }}>
                        <div className="info-header-small">
                            <div className="info-icon-box-gray">
                                <Info size={20} />
                            </div>
                            <h3 className="info-title-small">Sobre o Sistema</h3>
                        </div>
                        <div className="info-details-list">
                            <div className="info-detail-item">
                                <span className="info-detail-label">Versão do Software</span>
                                <span className="info-detail-value">v2.4.0 (Stable)</span>
                            </div>
                            <div className="info-detail-item">
                                <span className="info-detail-label">Licença</span>
                                <span className="info-detail-value">Institucional - Ilimitada</span>
                            </div>
                            <div className="info-detail-item">
                                <span className="info-detail-label">Espaço em Disco (Anexos)</span>
                                <span className="info-detail-value">14.2 GB / 50 GB</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Configuracoes;
