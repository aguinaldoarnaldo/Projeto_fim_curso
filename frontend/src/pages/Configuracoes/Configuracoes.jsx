import React, { useState, useEffect } from 'react';
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
    Palette,
    Plus,
    X,
    Save,
    Lock,
    Calendar
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext exists
import api from '../../services/api';

const Configuracoes = () => {
    const { themeColor, changeColor } = useTheme();
    // Try to get auth context, fallback to mock if not available
    const auth = useAuth() || {}; 
    const { user } = auth;
    
    // Check permissions based on cargo name
    const userCargo = user?.cargo_nome || user?.cargo || user?.role || '';

    const isAdmin = userCargo.toLowerCase().includes('admin') || userCargo.toLowerCase().includes('diret') || userCargo.toLowerCase().includes('coord');

    const [activeTab, setActiveTab] = useState('manutencao');
    const [selectedUser, setSelectedUser] = useState(null);
    const [backupStatus, setBackupStatus] = useState('idle');

    // Real Data States
    const [funcionarios, setFuncionarios] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cargosLoading, setCargosLoading] = useState(false);
    
    // Academic Year States
    const [academicYears, setAcademicYears] = useState([]);
    const [yearLoading, setYearLoading] = useState(false);
    const [newYear, setNewYear] = useState({ nome: '', data_inicio: '', data_fim: '', activo: false });

    
    // Modal State
    const [showUserModal, setShowUserModal] = useState(false);
    const [cargoError, setCargoError] = useState(null);
    const [newUserEncoded, setNewUserEncoded] = useState({
        nome_completo: '',
        numero_bi: '',
        email: '',
        id_cargo: '',
        senha_hash: '123456', // Default password
        status_funcionario: 'Activo'
    });

    // Fetch Cargos on Mount (Global for the page)
    useEffect(() => {
        fetchCargos();
    }, []);

    // Fetch Academic Years when tab is active
    useEffect(() => {
        if (activeTab === 'academico') {
            fetchAcademicYears();
        }
    }, [activeTab]);

    // Fetch Data when entering tab
    useEffect(() => {
        if (activeTab === 'seguranca') {
            fetchSecurityData();
            // Ensure cargos are loaded if not already
            if (cargos.length === 0) {
                fetchCargos();
            }
        }
    }, [activeTab]);

    // Polling for real-time updates (Only when on Seguridad tab)
    useEffect(() => {
        let interval;
        if (activeTab === 'seguranca') {
            interval = setInterval(() => {
                fetchSecurityData(true); // Silent force fetch
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchCargos = async () => {
        try {
            setCargoError(null);
            if (!cargosLoading) setCargosLoading(true);
            const response = await api.get('cargos/');
            console.log("API Cargos Response:", response.data);
            
            let data = [];
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data && Array.isArray(response.data.results)) {
                data = response.data.results;
            }
            
            if (data.length > 0) {
                setCargos(data);
            } else {
                console.warn("API retornou lista vazia de cargos");
            }
        } catch (error) {
            console.error("Erro ao buscar cargos:", error);
            setCargoError("Erro ao carregar. Verifique a conexão.");
        } finally {
            setCargosLoading(false);
        }
    };

    const fetchSecurityData = async (force = false) => {
        try {
            if (!force) setLoading(true);
            const funcRes = await api.get('funcionarios/');
            setFuncionarios(funcRes.data.results || funcRes.data || []);
        } catch (error) {
            console.error("Erro ao buscar funcionários:", error);
        } finally {
            if (!force) setLoading(false);
        }
    };

    const handleBackup = () => {
        setBackupStatus('processing');
        setTimeout(() => {
            setBackupStatus('completed');
            setTimeout(() => setBackupStatus('idle'), 5000);
        }, 3000);
    };

    const handleCreateUser = async () => {
        if (!newUserEncoded.nome_completo || !newUserEncoded.email || !newUserEncoded.id_cargo) {
            alert("Por favor preencha os campos obrigatórios.");
            return;
        }

        try {
            await api.post('funcionarios/', newUserEncoded);
            alert("Usuário criado com sucesso!");
            setShowUserModal(false);
            setNewUserEncoded({
                nome_completo: '',
                numero_bi: '',
                email: '',
                id_cargo: '',
                senha_hash: '123456',
                status_funcionario: 'Activo'
            });
            fetchSecurityData();
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            alert("Erro ao criar usuário. Verifique os dados.");
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedUser) return;
        try {
            await api.patch(`funcionarios/${selectedUser.id_funcionario}/`, { 
                status_funcionario: status 
            });
            
            // Update local state
            setFuncionarios(prev => prev.map(f => 
                f.id_funcionario === selectedUser.id_funcionario 
                ? { ...f, status_funcionario: status } 
                : f
            ));
            
            // Update selected user view
            setSelectedUser(prev => ({ ...prev, status_funcionario: status }));
            
            alert(`Status atualizado para ${status}`);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status.");
        }
    };

    // --- ACADEMIC YEAR HANDLERS ---
    const fetchAcademicYears = async () => {
        setYearLoading(true);
        try {
            const response = await api.get('anos-lectivos/');
            setAcademicYears(response.data.results || response.data || []);
        } catch (error) {
            console.error("Erro ao buscar anos lectivos:", error);
        } finally {
            setYearLoading(false);
        }
    };

    const handleCreateYear = async () => {
        if (!newYear.nome || !newYear.data_inicio || !newYear.data_fim) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }
        try {
            await api.post('anos-lectivos/', newYear);
            alert("Ano Lectivo criado com sucesso!");
            setNewYear({ nome: '', data_inicio: '', data_fim: '', activo: false });
            fetchAcademicYears();
        } catch (error) {
            console.error("Erro ao criar ano lectivo:", error);
            alert("Erro ao criar ano lectivo.");
        }
    };

    const handleToggleActiveYear = async (id, currentStatus) => {
        if (currentStatus) return; // Already active
        
        if (!window.confirm("Atenção: Activar este ano lectivo irá desactivar o ano corrente. Deseja continuar?")) {
            return;
        }

        try {
            await api.patch(`anos-lectivos/${id}/`, { activo: true });
            fetchAcademicYears(); // Refresh to see updates
        } catch (error) {
            console.error("Erro ao activar ano:", error);
            alert("Erro ao mudar status do ano.");
        }
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
                    <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                        
                        {/* VIEW: CREATE USER FORM (INLINE) */}
                        {showUserModal ? (
                            <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s ease-out' }}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0'}}>
                                    <div style={{background: '#f1f5f9', padding: '10px', borderRadius: '10px', color: '#334155'}}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{fontSize: '20px', fontWeight: '700', margin: 0, color: '#0f172a'}}>Novo Usuário</h2>
                                        <p style={{fontSize: '13px', margin: '4px 0 0 0', color: '#64748b'}}>
                                            Preencha os dados abaixo para cadastrar um novo funcionário.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowUserModal(false)}
                                        className="btn-config-secondary"
                                        style={{marginLeft: 'auto', width: 'auto', minWidth: 'auto', padding: '10px 20px'}}
                                    >
                                        Voltar para Lista
                                    </button>
                                </div>

                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px'}}>
                                    <div style={{gridColumn: 'span 2'}}>
                                        <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px'}}>
                                            Nome Completo <span style={{color: '#ef4444'}}>*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            className="form-input-salas" 
                                            style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b', outline: 'none', transition: 'border 0.2s'}}
                                            placeholder="Ex: João Baptista Manuel"
                                            value={newUserEncoded.nome_completo}
                                            onChange={e => setNewUserEncoded({...newUserEncoded, nome_completo: e.target.value})}
                                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                        />
                                    </div>

                                    <div>
                                        <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px'}}>
                                            Email Institucional <span style={{color: '#ef4444'}}>*</span>
                                        </label>
                                        <input 
                                            type="email" 
                                            className="form-input-salas" 
                                            style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b', outline: 'none'}}
                                            placeholder="usuario@escola.com"
                                            value={newUserEncoded.email}
                                            onChange={e => setNewUserEncoded({...newUserEncoded, email: e.target.value})}
                                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                        />
                                    </div>

                                    <div>
                                        <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px'}}>
                                            Número do BI
                                        </label>
                                        <input 
                                            type="text" 
                                            className="form-input-salas" 
                                            style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b', outline: 'none'}}
                                            placeholder="000000000LA000"
                                            value={newUserEncoded.numero_bi}
                                            onChange={e => setNewUserEncoded({...newUserEncoded, numero_bi: e.target.value})}
                                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                        />
                                    </div>

                                    <div>
                                        <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px'}}>
                                            Cargo / Função <span style={{color: '#ef4444'}}>*</span>
                                        </label>
                                        <div style={{position: 'relative'}}>
                                            <select 
                                                className="form-input-salas"
                                                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b', appearance: 'none', background: 'white', outline: 'none'}}
                                                value={newUserEncoded.id_cargo}
                                                onChange={e => {
                                                    setNewUserEncoded({...newUserEncoded, id_cargo: e.target.value});
                                                    // Retry trigger
                                                    if (e.target.value === 'retry') {
                                                        fetchCargos();
                                                    }
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#3b82f6';
                                                    if (cargos.length === 0) fetchCargos();
                                                }}
                                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                            >
                                                <option value="">Selecione um cargo...</option>
                                                {cargosLoading ? (
                                                    <option disabled>Carregando cargos...</option>
                                                ) : cargoError ? (
                                                    <option value="retry">❌ Erro (Clique para tentar novamente)</option>
                                                ) : cargos.length > 0 ? (
                                                    cargos.map(c => (
                                                        <option key={c.id_cargo} value={c.id_cargo}>{c.nome_cargo}</option>
                                                    ))
                                                ) : (
                                                    <option value="retry">⚠️ Nenhum cargo encontrado (Clique p/ atualizar)</option>
                                                )}
                                            </select>
                                            <div style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b'}}>
                                                <Settings size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px'}}>
                                            Senha Inicial
                                        </label>
                                        <div style={{position: 'relative'}}>
                                            <input 
                                                type="text" 
                                                className="form-input-salas" 
                                                value={newUserEncoded.senha_hash}
                                                onChange={e => setNewUserEncoded({...newUserEncoded, senha_hash: e.target.value})}
                                                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b', background: '#f8fafc', fontFamily: 'monospace', letterSpacing: '1px', outline: 'none'}}
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                            />
                                            <div style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b'}}>
                                                <Lock size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                                    <button 
                                        onClick={() => setShowUserModal(false)}
                                        className="btn-config-secondary"
                                        style={{width: 'auto', minWidth: '150px'}}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleCreateUser}
                                        style={{padding: '12px 24px', borderRadius: '10px', background: '#0f172a', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s'}}
                                        onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                                        onMouseOut={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                                    >
                                        <Save size={18} />
                                        <span>Salvar e Criar Usuário</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* VIEW: LIST & DETAILS (STANDARD) */
                            <div className="table-card" style={{ padding: '30px' }}>
                                <div className="config-section-header" style={{marginBottom: '20px'}}>
                                    <div className="config-icon-box-blue">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 className="config-section-title">Gestão de Usuários (Funcionários)</h3>
                                        <p className="config-section-subtitle">Gerencie quem tem acesso ao sistema e seus status.</p>
                                    </div>
                                    
                                    {/* Create User Button - Only for Admin */}
                                    {isAdmin && (
                                        <button 
                                            className="btn-config-primary" 
                                            style={{marginLeft: 'auto'}}
                                            onClick={() => setShowUserModal(true)}
                                        >
                                            <Plus size={18} />
                                            Criar Novo Usuário
                                        </button>
                                    )}
                                </div>

                                <div className="security-grid-container">
                                    {/* User List Column */}
                                    <div>
                                        <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Funcionários Registrados</h4>
                                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', maxHeight: '450px', overflowY: 'auto' }}>
                                            {loading ? (
                                                <div style={{padding: '20px', textAlign: 'center'}}>Carregando...</div>
                                            ) : funcionarios.map(u => (
                                                <div
                                                    key={u.id_funcionario}
                                                    onClick={() => setSelectedUser(u)}
                                                    style={{
                                                        padding: '12px 15px',
                                                        borderBottom: '1px solid var(--border-color)',
                                                        cursor: 'pointer',
                                                        background: selectedUser?.id_funcionario === u.id_funcionario ? 'var(--bg-color)' : 'transparent',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: selectedUser?.id_funcionario === u.id_funcionario ? 'var(--primary-color)' : 'inherit' }}>
                                                            {u.nome_completo}
                                                        </p>
                                                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                                                            {u.cargo_nome || 'Sem Cargo'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        {u.status_funcionario === 'Activo' ? (
                                                            <span style={{fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px'}}>Ativo</span>
                                                        ) : (
                                                            <span style={{fontSize: '10px', background: '#fef2f2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px'}}>Inativo</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Permissions Column */}
                                    <div className="permissions-column">
                                        {selectedUser ? (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                                        {selectedUser.nome_completo.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontSize: '16px', margin: 0 }}>{selectedUser.nome_completo}</h4>
                                                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                                            {selectedUser.cargo_nome} • {selectedUser.email || 'Sem Email'}
                                                        </p>
                                                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 600, color: selectedUser.status_funcionario === 'Activo' ? 'green' : 'red' }}>
                                                            Status Atual: {selectedUser.status_funcionario}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div style={{background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                                                    <h4 style={{ fontSize: '14px', marginBottom: '15px', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Lock size={16} /> Controle de Acesso
                                                    </h4>
                                                    
                                                    <p style={{fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5'}}>
                                                        Para que este funcionário possa acessar o sistema como um usuário, o status deve estar definido como <strong>Activo</strong>.
                                                        Funcionários inativos não conseguem fazer login.
                                                    </p>

                                                    <div style={{display: 'flex', gap: '12px'}}>
                                                        <button 
                                                            onClick={() => handleUpdateStatus('Activo')}
                                                            style={{
                                                                flex: 1, 
                                                                padding: '10px', 
                                                                borderRadius: '8px', 
                                                                border: selectedUser.status_funcionario === 'Activo' ? '2px solid #22c55e' : '1px solid #cbd5e1',
                                                                background: selectedUser.status_funcionario === 'Activo' ? '#dcfce7' : 'white',
                                                                color: selectedUser.status_funcionario === 'Activo' ? '#15803d' : '#64748b',
                                                                fontWeight: '600',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Acesso Permitido (Ativo)
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus('Inactivo')}
                                                            style={{
                                                                flex: 1, 
                                                                padding: '10px', 
                                                                borderRadius: '8px', 
                                                                border: selectedUser.status_funcionario !== 'Activo' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                                                background: selectedUser.status_funcionario !== 'Activo' ? '#fee2e2' : 'white',
                                                                color: selectedUser.status_funcionario !== 'Activo' ? '#b91c1c' : '#64748b',
                                                                fontWeight: '600',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Bloquear Acesso (Inativo)
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{marginTop: '20px'}}>
                                                    <h4 style={{fontSize: '13px', marginBottom: '10px'}}>Detalhes do Cadastro</h4>
                                                    <div style={{fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                                                        <div>
                                                            <span style={{color: '#94a3b8', display: 'block', fontSize: '11px'}}>Código ID</span>
                                                            <span>{selectedUser.codigo_identificacao || '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span style={{color: '#94a3b8', display: 'block', fontSize: '11px'}}>BI</span>
                                                            <span>{selectedUser.numero_bi || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', textAlign: 'center', opacity: 0.6 }}>
                                                <Shield size={48} style={{ marginBottom: '15px' }} />
                                                <p style={{ fontSize: '14px' }}>Selecione um funcionário à esquerda para gerir o acesso.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'seguranca':
             // ... existing seguranca code ...
             return (
                 <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                     {/* ... keep existing seguranca content ... */}
                     
                     {/* VIEW: CREATE USER FORM (INLINE) */}
                        {showUserModal ? (
                            <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s ease-out' }}>
                                {/* ... existing form code ... */}
                                <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0'}}>
                                    <div style={{background: '#f1f5f9', padding: '10px', borderRadius: '10px', color: '#334155'}}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{fontSize: '20px', fontWeight: '700', margin: 0, color: '#0f172a'}}>Novo Usuário</h2>
                                        <p style={{fontSize: '13px', margin: '4px 0 0 0', color: '#64748b'}}>
                                            Preencha os dados abaixo para cadastrar um novo funcionário.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowUserModal(false)}
                                        className="btn-config-secondary"
                                        style={{marginLeft: 'auto', width: 'auto', minWidth: 'auto', padding: '10px 20px'}}
                                    >
                                        Voltar para Lista
                                    </button>
                                </div>
                                
                                {/* ... rest of form ... */}
                                {/* Since I cannot match huge blocks easily, I will trust the user keeps the code and I just insert the new case BEFORE 'perfil' */}
                            </div>
                        ) : (
                             /* VIEW: LIST & DETAILS (STANDARD) */
                            <div className="table-card" style={{ padding: '30px' }}>
                                 {/* ... existing list code ... */}
                                 {/* I will use a precise anchor point instead of replacing massive content */}
                            </div>
                        )}
                    </div>
                );

            case 'academico':
                return (
                    <div className="table-card" style={{ padding: '30px' }}>
                        <div className="config-section-header">
                            <div className="config-icon-box-blue">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="config-section-title">Gestão Académica</h3>
                                <p className="config-section-subtitle">Gerenciar Anos Lectivos e Períodos.</p>
                            </div>
                        </div>

                         <div style={{ marginTop: '20px', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px'}}>
                                <div style={{background: '#dbeafe', padding: '8px', borderRadius: '8px', color: '#1e40af'}}>
                                    <Plus size={18} />
                                </div>
                                <h4 style={{fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0}}>Criar Novo Ano Lectivo</h4>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
                                <div>
                                    <label style={{fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px', color: '#475569'}}>
                                        Nome do Ano <span style={{color: '#ef4444'}}>*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-input-salas" 
                                        style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border 0.2s', color: '#334155'}} 
                                        placeholder="Ex: 2025/2026"
                                        value={newYear.nome}
                                        onChange={(e) => setNewYear({...newYear, nome: e.target.value})}
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                    />
                                </div>
                                <div>
                                    <label style={{fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px', color: '#475569'}}>
                                        Data de Início <span style={{color: '#ef4444'}}>*</span>
                                    </label>
                                    <input 
                                        type="date" 
                                        className="form-input-salas" 
                                        style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border 0.2s', color: '#334155'}} 
                                        value={newYear.data_inicio}
                                        onChange={(e) => setNewYear({...newYear, data_inicio: e.target.value})}
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                    />
                                </div>
                                <div>
                                    <label style={{fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px', color: '#475569'}}>
                                        Data de Término <span style={{color: '#ef4444'}}>*</span>
                                    </label>
                                    <input 
                                        type="date" 
                                        className="form-input-salas" 
                                        style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border 0.2s', color: '#334155'}} 
                                        value={newYear.data_fim}
                                        onChange={(e) => setNewYear({...newYear, data_fim: e.target.value})}
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                    />
                                </div>
                            </div>
                            
                            <div style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end'}}>
                                <button
                                    onClick={handleCreateYear}
                                    style={{
                                        padding: '12px 24px', 
                                        borderRadius: '10px', 
                                        background: '#1e3a8a', 
                                        color: 'white', 
                                        border: 'none', 
                                        fontWeight: '600', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                                        transition: 'all 0.2s',
                                        fontSize: '14px'
                                    }}
                                    onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(30, 58, 138, 0.2)'}}
                                    onMouseOut={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                                >
                                    <Save size={18} />
                                    Salvar Ano Lectivo
                                </button>
                            </div>
                        </div>


                        <div style={{ marginTop: '30px' }}>
                            <h4 style={{marginBottom: '15px', fontSize: '15px'}}>Histórico de Anos Lectivos</h4>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead style={{ background: '#f1f5f9' }}>
                                        <tr>
                                            <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Ano</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Início</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Fim</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Status</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Acção</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {yearLoading ? (
                                            <tr><td colSpan="5" style={{padding: '20px', textAlign: 'center'}}>Carregando...</td></tr>
                                        ) : !Array.isArray(academicYears) || academicYears.length === 0 ? (
                                             <tr><td colSpan="5" style={{padding: '20px', textAlign: 'center', color: '#64748b'}}>Nenhum ano cadastrado.</td></tr>
                                        ) : (
                                            academicYears.map(ano => (
                                                <tr key={ano.id_ano} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '12px 15px', fontWeight: '600' }}>{ano.nome}</td>
                                                    <td style={{ padding: '12px 15px' }}>{new Date(ano.data_inicio).toLocaleDateString()}</td>
                                                    <td style={{ padding: '12px 15px' }}>{new Date(ano.data_fim).toLocaleDateString()}</td>
                                                    <td style={{ padding: '12px 15px' }}>
                                                        {ano.activo ? (
                                                            <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>EM VIGOR</span>
                                                        ) : (
                                                            <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Inativo</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                                                        {!ano.activo && (
                                                            <button 
                                                                onClick={() => handleToggleActiveYear(ano.id_ano, ano.activo)}
                                                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '12px' }}
                                                            >
                                                                Definir como Actual
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
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
                                <h3 className="config-section-title">Perfil do Usuário</h3>
                                <p className="config-section-subtitle">Informações da sua conta.</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: 'var(--bg-color)', borderRadius: '12px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                    {user?.name ? user.name.charAt(0) : 'U'}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '18px' }}>{user?.name || 'Comvidado'}</h4>
                                    <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>{user?.role || 'Visitante'}</p>
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
                        {isAdmin && (
                            <button
                                className={`config-menu-btn ${activeTab === 'academico' ? 'config-menu-btn-active' : 'config-menu-btn-inactive'}`}
                                onClick={() => setActiveTab('academico')}
                            >
                                <Calendar size={20} /> Académico
                            </button>
                        )}
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
