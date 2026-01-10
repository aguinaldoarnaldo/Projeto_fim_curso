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
    AlertTriangle,
    Palette
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Configuracoes = () => {
    const { themeColor, changeColor } = useTheme();
    const [activeTab, setActiveTab] = useState('manutencao');
    const [selectedUser, setSelectedUser] = useState(null);
    const [backupStatus, setBackupStatus] = useState('idle'); // idle, processing, completed

    const users = [
        { id: 1, name: 'Ana Paula', role: 'Secretária', email: 'ana.paula@escola.com' },
        { id: 2, name: 'Carlos Santos', role: 'Professor', email: 'carlos.santos@escola.com' },
        { id: 3, name: 'Maria José', role: 'Financeiro', email: 'maria.jose@escola.com' },
        { id: 4, name: 'João Manuel', role: 'Secretário', email: 'joao.manuel@escola.com' },
        { id: 5, name: 'Isabel Silva', role: 'Coordenadora', email: 'isabel.silva@escola.com' },
    ];

    const handleBackup = () => {
        setBackupStatus('processing');
        // Simulate backup process
        setTimeout(() => {
            setBackupStatus('completed');
            setTimeout(() => setBackupStatus('idle'), 5000);
        }, 3000);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'manutencao':
                return (
                    <>
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

                        <div className="table-card" style={{ padding: '30px', marginTop: '20px' }}>
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
                    </>
                );
            case 'personalizacao':
                return (
                    <div className="table-card" style={{ padding: '30px' }}>
                        <div className="config-section-header">
                            <div className="config-icon-box-blue">
                                <Palette size={24} />
                            </div>
                            <div>
                                <h3 className="config-section-title">Personalização Visual</h3>
                                <p className="config-section-subtitle">Escolha a cor principal que melhor combina com a instituição.</p>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-color)' }}>
                                Cor do Sistema
                            </label>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    onClick={() => changeColor('blue')}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        border: themeColor === 'blue' ? '2px solid #1e3a8a' : '1px solid var(--border-color)',
                                        background: themeColor === 'blue' ? '#eff6ff' : 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontWeight: '600',
                                        color: '#1e3a8a'
                                    }}
                                >
                                    <div style={{ width: '16px', height: '16px', background: '#1e3a8a', borderRadius: '4px' }}></div>
                                    Azul Oceano
                                </button>
                                <button
                                    onClick={() => changeColor('green')}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        border: themeColor === 'green' ? '2px solid #059669' : '1px solid var(--border-color)',
                                        background: themeColor === 'green' ? '#ecfdf5' : 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontWeight: '600',
                                        color: '#059669'
                                    }}
                                >
                                    <div style={{ width: '16px', height: '16px', background: '#059669', borderRadius: '4px' }}></div>
                                    Verde Premium
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'seguranca':
                return (
                    <div className="table-card" style={{ padding: '30px' }}>
                        <div className="config-section-header">
                            <div className="config-icon-box-blue">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="config-section-title">Segurança e Controlo de Acesso</h3>
                                <p className="config-section-subtitle">Selecione um usuário para gerir suas permissões individuais.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '25px', marginTop: '10px' }}>
                            {/* User List Column */}
                            <div>
                                <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Usuários do Sistema</h4>
                                <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
                                    {users.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => setSelectedUser(u)}
                                            style={{
                                                padding: '12px 15px',
                                                borderBottom: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                background: selectedUser?.id === u.id ? 'var(--bg-color)' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: selectedUser?.id === u.id ? 'var(--primary-color)' : 'inherit' }}>{u.name}</p>
                                            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>{u.role}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Permissions Column */}
                            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '25px' }}>
                                {selectedUser ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                                                {selectedUser.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '16px', margin: 0 }}>{selectedUser.name}</h4>
                                                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{selectedUser.role} • {selectedUser.email}</p>
                                            </div>
                                        </div>

                                        <h4 style={{ fontSize: '14px', marginBottom: '15px', color: 'var(--text-color)' }}>Definir Permissões de Acesso</h4>
                                        <div className="permissions-grid">
                                            {[
                                                { id: 'al', label: 'Gerir Alunos', desc: 'Cadastrar e editar dados' },
                                                { id: 'mt', label: 'Efectuar Matrículas', desc: 'Realizar novas inscrições' },
                                                { id: 'nt', label: 'Lançar Notas', desc: 'Inserir avaliações' },
                                                { id: 'rl', label: 'Relatórios', desc: 'Ver estatísticas' },
                                                { id: 'fn', label: 'Financeiro', desc: 'Gestão de pagamentos' }
                                            ].map(perm => (
                                                <div key={perm.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '12px 15px',
                                                    background: 'var(--bg-color)',
                                                    borderRadius: '10px',
                                                    marginBottom: '10px'
                                                }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>{perm.label}</p>
                                                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>{perm.desc}</p>
                                                    </div>
                                                    <div className="permission-toggle">
                                                        <input type="checkbox" id={`perm-${perm.id}-${selectedUser.id}`} defaultChecked={perm.id !== 'fn'} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="btn-config-primary" style={{ marginTop: '15px', width: '100%', padding: '12px' }}>
                                            Atualizar Acessos de {selectedUser.name.split(' ')[0]}
                                        </button>
                                    </>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', textAlign: 'center', opacity: 0.6 }}>
                                        <Shield size={48} style={{ marginBottom: '15px' }} />
                                        <p style={{ fontSize: '14px' }}>Selecione um usuário à esquerda para gerir o nível de acesso ao sistema.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'perfil':
                return (
                    <div className="table-card" style={{ padding: '30px' }}>
                        <div className="config-section-header">
                            <div className="config-icon-box-blue">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="config-section-title">Perfil do Administrador</h3>
                                <p className="config-section-subtitle">Gerencie suas informações de conta e preferências.</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: 'var(--bg-color)', borderRadius: '12px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                    AA
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '18px' }}>Aguinaldo Arnaldo</h4>
                                    <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Administrador Geral</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'notificacoes':
                return (
                    <div className="table-card" style={{ padding: '30px' }}>
                        <div className="config-section-header">
                            <div className="config-icon-box-blue">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h3 className="config-section-title">Notificações e Alertas</h3>
                                <p className="config-section-subtitle">Configure como você recebe alertas sobre eventos do sistema.</p>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ fontSize: '16px', marginBottom: '15px' }}>Preferências de Alerta</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    'Notificar sobre novas matrículas',
                                    'Alertar sobre pagamentos em atraso',
                                    'Relatórios semanais automáticos',
                                    'Lembretes de manutenção do sistema'
                                ].map((pref, index) => (
                                    <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px' }}>
                                        <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                                        <span style={{ fontSize: '14px', color: 'var(--text-color)' }}>{pref}</span>
                                    </label>
                                ))}
                            </div>

                            <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid var(--border-color)' }} />

                            <h4 style={{ fontSize: '16px', marginBottom: '15px' }}>Alertas Recentes</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ padding: '15px', borderLeft: '4px solid #3b82f6', background: '#eff6ff', borderRadius: '0 8px 8px 0' }}>
                                    <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#1e3a8a' }}>Nova Matrícula Realizada</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#1e40af' }}>O aluno João Silva foi matriculado com sucesso no 10º Ano.</p>
                                    <span style={{ fontSize: '11px', color: '#60a5fa', marginTop: '8px', display: 'block' }}>Há 5 minutos</span>
                                </div>
                                <div style={{ padding: '15px', borderLeft: '4px solid #f59e0b', background: '#fffbeb', borderRadius: '0 8px 8px 0' }}>
                                    <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#92400e' }}>Aviso de Backup Próximo</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#b45309' }}>O sistema recomenda realizar um backup completo hoje.</p>
                                    <span style={{ fontSize: '11px', color: '#f59e0b', marginTop: '8px', display: 'block' }}>Há 2 horas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
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
                        <button
                            className={`config-menu-btn ${activeTab === 'manutencao' ? 'config-menu-btn-active' : 'config-menu-btn-inactive'}`}
                            onClick={() => setActiveTab('manutencao')}
                        >
                            <Database size={20} /> Manutenção e Backup
                        </button>
                        <button
                            className={`config-menu-btn ${activeTab === 'personalizacao' ? 'config-menu-btn-active' : 'config-menu-btn-inactive'}`}
                            onClick={() => setActiveTab('personalizacao')}
                        >
                            <Palette size={20} /> Personalização
                        </button>
                        <button
                            className={`config-menu-btn ${activeTab === 'seguranca' ? 'config-menu-btn-active' : 'config-menu-btn-inactive'}`}
                            onClick={() => setActiveTab('seguranca')}
                        >
                            <Shield size={20} /> Segurança e Acesso
                        </button>
                        <button
                            className={`config-menu-btn ${activeTab === 'perfil' ? 'config-menu-btn-active' : 'config-menu-btn-inactive'}`}
                            onClick={() => setActiveTab('perfil')}
                        >
                            <User size={20} /> Perfil do Administrador
                        </button>
                        <button
                            className={`config-menu-btn ${activeTab === 'notificacoes' ? 'config-menu-btn-active' : 'config-menu-btn-inactive'}`}
                            onClick={() => setActiveTab('notificacoes')}
                        >
                            <Bell size={20} /> Notificações
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="config-content-column">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Configuracoes;
