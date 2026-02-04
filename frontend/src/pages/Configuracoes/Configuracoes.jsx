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
    Edit,
    Calendar,
    CheckSquare,
    Square,
    Search,
    UserPlus,
    Trash2,
    ShieldCheck,
    HelpCircle,
    FileText,
    BookOpen
} from 'lucide-react';
import { PERMISSIONS, PERMISSIONS_PT, PERMISSION_GROUPS } from '../../utils/permissions';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext exists
import api from '../../services/api';

const Configuracoes = () => {
    const { themeColor, changeColor } = useTheme();
    // Try to get auth context, fallback to mock if not available
    const auth = useAuth() || {}; 
    const { user } = auth;
    
    // Permissões
    const canViewConfig = auth.hasPermission && auth.hasPermission(PERMISSIONS.VIEW_CONFIGURACOES);
    const canManageUsers = auth.hasPermission && auth.hasPermission(PERMISSIONS.MANAGE_USUARIOS);
    const canManageAcademic = auth.hasPermission && (auth.hasPermission(PERMISSIONS.MANAGE_TURMAS) || auth.hasPermission(PERMISSIONS.VIEW_CONFIGURACOES));
    // Fallback for admin legacy check if needed, but prefer permissions
    const isAdmin = auth.hasPermission && auth.hasPermission(PERMISSIONS.MANAGE_USUARIOS);

    const [activeTab, setActiveTab] = useState('manutencao');
    const [selectedUser, setSelectedUser] = useState(null);
    const [backupStatus, setBackupStatus] = useState('idle');

    // Real Data States
    const [usuarios, setUsuarios] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cargosLoading, setCargosLoading] = useState(false);
    
    // Academic Year States
    const [academicYears, setAcademicYears] = useState([]);
    const [yearLoading, setYearLoading] = useState(false);
    const [newYear, setNewYear] = useState({ nome: '', data_inicio: '', data_fim: '', activo: false });
    const [isEditingYear, setIsEditingYear] = useState(false);
    const [editingYearId, setEditingYearId] = useState(null);
    const [backupsList, setBackupsList] = useState([]);

    
    // Modal State
    const [showUserModal, setShowUserModal] = useState(false);
    const [cargoError, setCargoError] = useState(null);
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [showYearForm, setShowYearForm] = useState(false);
    
    // Global Config State
    const [config, setConfig] = useState({
        candidaturas_abertas: true,
        mensagem_candidaturas_fechadas: ''
    });
    const [configLoading, setConfigLoading] = useState(false);
    const [newUserEncoded, setNewUserEncoded] = useState({
        nome_completo: '',
        email: '',
        senha_hash: '', 
        papel: 'Comum',
        cargo: '',
        is_active: true
    });
    
    // Permissions Modal State
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [editingPermissions, setEditingPermissions] = useState([]); // List of permission strings
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);
    const [userPhoto, setUserPhoto] = useState(null);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    // Fetch Cargos on Mount (Global for the page)
    useEffect(() => {
        fetchCargos();
    }, []);

    // Fetch Academic Years when tab is active
    useEffect(() => {
        if (activeTab === 'academico') {
            fetchAcademicYears();
            fetchConfig();
        }
        if (activeTab === 'manutencao') {
            fetchBackups();
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
            const userRes = await api.get('usuarios/');
            setUsuarios(userRes.data.results || userRes.data || []);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        } finally {
            if (!force) setLoading(false);
        }
    };

    const fetchBackups = async () => {
        try {
            const response = await api.get('backups/list_backups/');
            setBackupsList(response.data || []);
        } catch (error) {
            console.error("Erro ao buscar backups:", error);
        }
    };

    const handleBackup = async () => {
        setBackupStatus('processing');
        try {
            await api.post('backups/create_backup/');
            setBackupStatus('completed');
            fetchBackups();
            setTimeout(() => setBackupStatus('idle'), 5000);
        } catch (error) {
            console.error("Erro ao gerar backup:", error);
            alert("Erro ao gerar backup. Verifique se o pg_dump está instalado no servidor.");
            setBackupStatus('idle');
        }
    };

    const handleDownloadBackup = async (filename) => {
        try {
            const response = await api.get(`backups/download_backup/?filename=${filename}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Erro ao baixar backup:", error);
            alert("Erro ao baixar ficheiro.");
        }
    };

    const handleDeleteBackup = async (filename) => {
        if (!window.confirm(`Deseja realmente eliminar o backup ${filename}?`)) return;
        try {
            await api.delete(`backups/delete_backup/?filename=${filename}`);
            fetchBackups();
        } catch (error) {
            console.error("Erro ao eliminar backup:", error);
            alert("Erro ao eliminar ficheiro.");
        }
    };

    const handleCreateUser = async () => {
        if (!newUserEncoded.nome_completo || !newUserEncoded.email) {
            alert("Por favor preencha os campos obrigatórios (Nome e Email).");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('nome_completo', newUserEncoded.nome_completo);
            formData.append('email', newUserEncoded.email);
            formData.append('papel', newUserEncoded.papel);
            formData.append('cargo', newUserEncoded.cargo);
            formData.append('is_active', newUserEncoded.is_active);
            
            if (newUserEncoded.senha_hash) {
                formData.append('senha_hash', newUserEncoded.senha_hash);
            }
            
            if (userPhoto) {
                formData.append('foto', userPhoto);
            }

            if (isEditingUser && selectedUser) {
                // Update Logic
                 await api.patch(`usuarios/${selectedUser.id_usuario}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Dados do usuário atualizados com sucesso!");
            } else {
                // Create Logic
                await api.post('usuarios/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Usuário criado com sucesso!");
            }

            setShowUserModal(false);
            setNewUserEncoded({
                nome_completo: '',
                email: '',
                senha_hash: '',
                papel: 'Comum',
                cargo: '',
                is_active: true
            });
            setUserPhoto(null);
            setIsEditingUser(false);
            fetchSecurityData(true); // Refresh list
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            const msg = error.response?.data?.detail || JSON.stringify(error.response?.data) || "Erro ao processar.";
            alert(`Erro: ${msg}`);
        }
    };
    
    // Preparar edição
    const handleEditSelectedUser = () => {
        if (!selectedUser) return;
        setNewUserEncoded({
            nome_completo: selectedUser.nome_completo,
            email: selectedUser.email || '',
            papel: selectedUser.papel || 'Comum',
            cargo: selectedUser.cargo || '', // Get cargo from profile response
            senha_hash: '',
            is_active: selectedUser.is_active
        });
        setIsEditingUser(true);
        setShowUserModal(true);
    };

    const handleUpdateStatus = async (isActive) => {
        if (!selectedUser) return;
        try {
            await api.patch(`usuarios/${selectedUser.id_usuario}/`, { 
                is_active: isActive 
            });
            
            // Update local state
            setUsuarios(prev => prev.map(u => 
                u.id_usuario === selectedUser.id_usuario 
                ? { ...u, is_active: isActive } 
                : u
            ));
            
            // Update selected user view
            setSelectedUser(prev => ({ ...prev, is_active: isActive }));
            
            alert(`Status atualizado para ${isActive ? 'Activo' : 'Inactivo'}`);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status.");
        }
    };

    const handleManagePermissions = () => {
        if (!selectedUser) return;
        setEditingPermissions(selectedUser.permissoes || []);
        setShowPermissionsModal(true);
    };

    const togglePermission = (perm) => {
        setEditingPermissions(prev => {
            if (prev.includes(perm)) {
                return prev.filter(p => p !== perm);
            } else {
                return [...prev, perm];
            }
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedUser) return;
        setIsSavingPermissions(true);
        const permsToSend = editingPermissions.length > 0 ? editingPermissions : ['NO_ACCESS'];
        try {
            await api.patch(`usuarios/${selectedUser.id_usuario}/`, {
                permissoes: permsToSend
            });
            
            // Update local state
            setUsuarios(prev => prev.map(u => 
                u.id_usuario === selectedUser.id_usuario 
                ? { ...u, permissoes: editingPermissions } 
                : u
            ));
            setSelectedUser(prev => ({ ...prev, permissoes: editingPermissions }));
            
            alert("Permissões atualizadas com sucesso!");
            fetchSecurityData(true); // Force refresh from backend
            setShowPermissionsModal(false);
        } catch (error) {
            console.error("Erro ao salvar permissões:", error);
            alert("Erro ao salvar permissões.");
        } finally {
            setIsSavingPermissions(false);
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

    const fetchConfig = async () => {
        setConfigLoading(true);
        try {
            const response = await api.get('config/');
            if (response.data) {
                setConfig(response.data);
            }
        } catch (error) {
            console.error("Erro ao buscar configurações:", error);
        } finally {
            setConfigLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            await api.patch('config/update_config/', config);
            alert("Configurações atualizadas com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar config:", error);
            alert("Erro ao salvar configurações.");
        }
    };

    const handleTogglePortal = async () => {
        // Se estiver aberto, signfica que vai fechar -> Pedir confirmação
        if (config.candidaturas_abertas) {
            const confirm = window.confirm("Tem certeza que deseja suspender as candidaturas? Isso impedirá novas inscrições online.");
            if (!confirm) return;
        }

        const novoStatus = !config.candidaturas_abertas;
        
        try {
            // Atualiza estado local
            setConfig(prev => ({ ...prev, candidaturas_abertas: novoStatus }));
            
            // Salva no backend
            await api.patch('config/update_config/', { 
                ...config, 
                candidaturas_abertas: novoStatus 
            });
            
            // Feedback opcional (apenas se estiver abrindo, ou genérico)
            // alert(`Portal ${novoStatus ? 'aberto' : 'suspenso'} com sucesso.`);
        } catch (error) {
            console.error("Erro ao alterar status do portal:", error);
            alert("Erro ao comunicar com o servidor. As alterações podem não ter sido salvas.");
            // Reverte em caso de erro
            setConfig(prev => ({ ...prev, candidaturas_abertas: !novoStatus }));
        }
    };

    const handleCreateYear = async () => {
        if (!newYear.nome || !newYear.data_inicio || !newYear.data_fim) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }
        try {
            if (isEditingYear) {
                // Update
                await api.patch(`anos-lectivos/${editingYearId}/`, newYear);
                alert("Ano Lectivo atualizado com sucesso!");
                setIsEditingYear(false);
                setEditingYearId(null);
            } else {
                // Create
                await api.post('anos-lectivos/', newYear);
                alert("Ano Lectivo criado com sucesso!");
            }
            setNewYear({ nome: '', data_inicio: '', data_fim: '', activo: false });
            setShowYearForm(false);
            fetchAcademicYears();
        } catch (error) {
            console.error("Erro ao salvar ano lectivo:", error);
            alert("Erro ao salvar ano lectivo.");
        }
    };

    const handleEditYear = (year) => {
        setNewYear({
            nome: year.nome,
            data_inicio: year.data_inicio,
            data_fim: year.data_fim,
            activo: year.activo
        });
        setIsEditingYear(true);
        setEditingYearId(year.id_ano);
        setShowYearForm(true);
    };

    const handleCancelEditYear = () => {
        setNewYear({ nome: '', data_inicio: '', data_fim: '', activo: false });
        setIsEditingYear(false);
        setEditingYearId(null);
        setShowYearForm(false);
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
                if (!canViewConfig) return <div style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>Acesso Restrito</div>;
                return (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <div className="section-title-v2">
                            <div className="icon-circle" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                <Database size={24} />
                            </div>
                            <div>
                                <h2>Manutenção e Backups</h2>
                                <p>Gerencie a integridade dos dados e exportações do sistema.</p>
                            </div>
                        </div>

                        <div className="info-card-v2">
                            <div className="info-card-header">
                                <div>
                                    <p className="info-label">Último Backup Realizado</p>
                                    <p className="info-value">
                                        {backupsList.length > 0 ? backupsList[0].created_at : 'Nenhum backup encontrado'}
                                    </p>
                                </div>
                                <div className="info-badge" style={{ color: backupsList.length > 0 ? '#059669' : '#64748b' }}>
                                    {backupsList.length > 0 ? 'Integridade OK' : 'Sem registos'}
                                </div>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: '0' }}>
                                O backup inclui todos os registros de base de dados e ficheiros media (fotos e documentos).
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
                            <button
                                onClick={handleBackup}
                                disabled={backupStatus === 'processing'}
                                className="btn-premium btn-primary-premium"
                            >
                                {backupStatus === 'processing' ? 'Gerando...' : (
                                    <>
                                        <Download size={18} /> Gerar Backup Completo
                                    </>
                                )}
                            </button>
                            <button className="btn-premium btn-secondary-premium">
                                Restaurar do ficheiro
                            </button>
                        </div>

                        {backupStatus === 'completed' && (
                            <div className="info-card-v2 alert-success" style={{ animation: 'fadeIn 0.3s', background: '#ecfdf5', borderColor: '#34d399', color: '#064e3b' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CheckCircle size={20} />
                                    <span>Backup criado com sucesso e adicionado à lista abaixo!</span>
                                </div>
                            </div>
                        )}

                        <div className="backups-list-container" style={{ marginTop: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>Histórico de Backups</h3>
                            {backupsList.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                                    Nenhum ficheiro de backup disponível.
                                </div>
                            ) : (
                                <div className="backups-grid" style={{ display: 'grid', gap: '12px' }}>
                                    {backupsList.map((b) => (
                                        <div key={b.filename} className="backup-item-v2" style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            padding: '16px 20px',
                                            background: 'white',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ background: '#f1f5f9', p: '10px', borderRadius: '8px', color: '#64748b' }}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{b.filename}</p>
                                                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{b.created_at} • {b.size}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    onClick={() => handleDownloadBackup(b.filename)}
                                                    className="btn-icon-action" 
                                                    title="Descarregar"
                                                    style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteBackup(b.filename)}
                                                    className="btn-icon-action" 
                                                    title="Eliminar"
                                                    style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="section-title-v2" style={{ marginTop: '40px', marginBottom: '24px' }}>
                            <div className="icon-circle" style={{ background: '#f8fafc', color: '#64748b' }}>
                                <Info size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', margin: 0 }}>Sobre o Sistema</h3>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="info-card-v2" style={{ marginBottom: 0 }}>
                                <p className="info-label">Versão do Software</p>
                                <p className="info-value">v2.4.0 (Stable)</p>
                            </div>
                            <div className="info-card-v2" style={{ marginBottom: 0 }}>
                                <p className="info-label">Licença</p>
                                <p className="info-value">Institucional - Ilimitada</p>
                            </div>
                        </div>
                    </div>
                );
            case 'personalizacao':
                if (!canViewConfig) return <div style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>Acesso Restrito</div>;
                return (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <div className="section-title-v2">
                            <div className="icon-circle" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                                <Palette size={24} />
                            </div>
                            <div>
                                <h2>Branding e Cores</h2>
                                <p>Personalize a identidade visual da sua plataforma.</p>
                            </div>
                        </div>

                        <div className="config-group-v2">
                            <label>Cor Principal do Sistema</label>
                            <div className="color-options-v2">
                                <div 
                                    className={`color-card-v2 ${themeColor === 'blue' ? 'active' : ''}`}
                                    onClick={() => changeColor('blue')}
                                >
                                    <div className="color-dot" style={{ background: '#1e40af' }}></div>
                                    <span style={{ fontWeight: 600 }}>Azul Oceano</span>
                                </div>
                                <div 
                                    className={`color-card-v2 ${themeColor === 'green' ? 'active' : ''}`}
                                    onClick={() => changeColor('green')}
                                >
                                    <div className="color-dot" style={{ background: '#059669' }}></div>
                                    <span style={{ fontWeight: 600 }}>Verde Premium</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'seguranca':
                if (!canManageUsers) return <div style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>Acesso Restrito</div>;

                const filteredUsuarios = usuarios.filter(u => 
                    u.nome_completo?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    u.cargo_nome?.toLowerCase().includes(userSearchTerm.toLowerCase())
                );

                return (
                    <div className="security-redesign">
                        {showUserModal ? (
                            <div className="config-form-v2" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                                <div className="section-title-v2">
                                    <div className="icon-circle" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                        {isEditingUser ? <Edit size={24} /> : <UserPlus size={24} />}
                                    </div>
                                    <div>
                                        <h2>{isEditingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}</h2>
                                        <p>Preencha as informações básicas de acesso.</p>
                                    </div>
                                </div>

                                <div className="form-grid-2col">
                                    <div className="config-group-v2">
                                        <label>Nome Completo</label>
                                        <input 
                                            type="text" 
                                            className="input-v2"
                                            value={newUserEncoded.nome_completo}
                                            onChange={e => setNewUserEncoded({...newUserEncoded, nome_completo: e.target.value})}
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>
                                    <div className="config-group-v2">
                                        <label>Email Institucional</label>
                                        <input 
                                            type="email" 
                                            className="input-v2"
                                            value={newUserEncoded.email}
                                            onChange={e => setNewUserEncoded({...newUserEncoded, email: e.target.value})}
                                            placeholder="email@escola.com"
                                        />
                                    </div>

                                    <div className="config-group-v2">
                                        <label>Grupo Administrativo (Papel)</label>
                                        <div className="role-selector-container">
                                            <button 
                                                type="button"
                                                onClick={() => setNewUserEncoded({...newUserEncoded, papel: 'Admin'})}
                                                className={`role-selector-btn ${newUserEncoded.papel === 'Admin' ? 'active' : ''}`}
                                            >
                                                <ShieldCheck size={18} /> Administrador
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setNewUserEncoded({...newUserEncoded, papel: 'Comum'})}
                                                className={`role-selector-btn ${newUserEncoded.papel === 'Comum' ? 'active' : ''}`}
                                            >
                                                <User size={18} /> Comum
                                            </button>
                                        </div>
                                    </div>

                                    <div className="config-group-v2">
                                        <label>Cargo / Função</label>
                                        <select 
                                            className="input-v2"
                                            value={newUserEncoded.cargo}
                                            onChange={e => setNewUserEncoded({...newUserEncoded, cargo: e.target.value})}
                                        >
                                            <option value="">Selecione um cargo...</option>
                                            {cargos.map(c => (
                                                <option key={c.id_cargo} value={c.id_cargo}>{c.nome_cargo}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="config-group-v2">
                                        <label>Definir Senha {isEditingUser && <span style={{fontWeight: 400, color: '#94a3b8'}}>(Opcional)</span>}</label>
                                        <div style={{position: 'relative'}}>
                                            <input 
                                                type="password" 
                                                className="input-v2"
                                                value={newUserEncoded.senha_hash}
                                                onChange={e => setNewUserEncoded({...newUserEncoded, senha_hash: e.target.value})}
                                                placeholder={isEditingUser ? "Deixe vazio para manter atual" : "Mínimo 8 caracteres"}
                                            />
                                            <Lock size={18} style={{position: 'absolute', right: '18px', top: '16px', color: '#94a3b8'}} />
                                        </div>
                                    </div>

                                    <div className="config-group-v2">
                                        <label>Foto de Perfil</label>
                                        <input 
                                            type="file" 
                                            className="input-v2"
                                            onChange={e => setUserPhoto(e.target.files[0])}
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                    <button onClick={() => setShowUserModal(false)} className="btn-premium" style={{ background: '#f1f5f9', color: '#475569' }}>
                                        Cancelar
                                    </button>
                                    <button onClick={handleCreateUser} className="btn-premium btn-primary-premium">
                                        <Save size={18} /> {isEditingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div className="section-title-v2">
                                        <div className="icon-circle" style={{ background: '#fef2f2', color: '#ef4444' }}>
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <h2>Segurança e Usuários</h2>
                                            <p>Controle quem pode acessar a plataforma administrativa.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setIsEditingUser(false); setShowUserModal(true); }} className="btn-premium btn-primary-premium">
                                        <UserPlus size={18} /> Novo Usuário
                                    </button>
                                </div>

                                <div className="search-bar-config">
                                    <Search size={20} color="#94a3b8" />
                                    <input 
                                        type="text" 
                                        placeholder="Pesquisar por nome, email ou cargo..." 
                                        value={userSearchTerm}
                                        onChange={e => setUserSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="user-grid-v2">
                                    {filteredUsuarios.map(u => (
                                        <div 
                                            key={u.id_usuario} 
                                            className={`user-card-v2 ${selectedUser?.id_usuario === u.id_usuario ? 'selected' : ''}`}
                                            onClick={() => setSelectedUser(u)}
                                        >
                                            <div className="user-card-header">
                                                <div className="user-avatar-v2">
                                                    {u.img_path ? <img src={u.img_path} alt="" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} /> : u.nome_completo.charAt(0)}
                                                </div>
                                                <div className="user-info-v2">
                                                    <h4>{u.nome_completo}</h4>
                                                    <p>{u.cargo_nome || u.papel}</p>
                                                </div>
                                            </div>
                                            <div className="user-card-footer">
                                                <span style={{ 
                                                    fontSize: '11px', 
                                                    fontWeight: 700, 
                                                    color: u.is_active ? '#10b981' : '#ef4444',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.is_active ? '#10b981' : '#ef4444' }}></div>
                                                    {u.is_active ? 'ATIVO' : 'INATIVO'}
                                                </span>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); handleEditSelectedUser(); }} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}>
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); handleManagePermissions(); }} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#1e40af' }}>
                                                        <ShieldCheck size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedUser && (
                                    <div style={{ marginTop: '40px', padding: '30px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', animation: 'fadeIn 0.4s' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Gestão de Acesso: {selectedUser.nome_completo}</h3>
                                                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Altere o status de login ou permissões granulares deste usuário.</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <button 
                                                    onClick={() => handleUpdateStatus(!selectedUser.is_active)}
                                                    className="btn-premium"
                                                    style={{ 
                                                        background: selectedUser.is_active ? '#fee2e2' : '#dcfce7', 
                                                        color: selectedUser.is_active ? '#b91c1c' : '#15803d',
                                                        fontSize: '13px',
                                                        padding: '10px 20px'
                                                    }}
                                                >
                                                    {selectedUser.is_active ? 'Bloquear Acesso' : 'Permitir Acesso'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {/* PERMISSIONS MODAL */}
                        {/* PERMISSIONS MODAL */}
                        {showPermissionsModal && (
                            <div className="sidebar-modal-overlay">
                                <div className="sidebar-modal-card permission-modal-card">
                                    <div className="modal-header-center">
                                        <div className="modal-icon-badge">
                                            <ShieldCheck size={28} />
                                        </div>
                                        <h3>Permissões de {selectedUser?.nome_completo}</h3>
                                        <p>Selecione as permissões adicionais para este usuário. Estas permissões somam-se às do cargo.</p>
                                    </div>
                                    
                                    <div className="permissions-scroll-container">
                                        {PERMISSION_GROUPS.map((group) => (
                                            <div key={group.name} className="permission-group-block">
                                                <div className="permission-group-header">
                                                    <div className="group-title-row">
                                                        <div className="group-indicator"></div>
                                                        <h4>{group.name}</h4>
                                                    </div>
                                                    <div className="group-actions">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const allInGroup = group.permissions;
                                                                setEditingPermissions(prev => [...new Set([...prev, ...allInGroup])]);
                                                            }}
                                                            className="link-btn-blue"
                                                        >
                                                            Selecionar Tudo
                                                        </button>
                                                        <div className="separator-dot"></div>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const allInGroup = group.permissions;
                                                                setEditingPermissions(prev => prev.filter(p => !allInGroup.includes(p)));
                                                            }}
                                                            className="link-btn-red"
                                                        >
                                                            Limpar
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="permission-items-grid">
                                                    {group.permissions.map((perm) => {
                                                        const isSelected = editingPermissions.includes(perm);
                                                        return (
                                                            <div 
                                                                key={perm} 
                                                                onClick={() => togglePermission(perm)}
                                                                className={`permission-item-card ${isSelected ? 'active' : ''}`}
                                                            >
                                                                <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                                                                    {isSelected && <CheckSquare size={16} />}
                                                                </div>
                                                                <div className="perm-text-content">
                                                                    <span className="perm-label">
                                                                        {PERMISSIONS_PT[perm] || perm}
                                                                    </span>
                                                                    <span className="perm-code">
                                                                        {perm}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="sidebar-modal-actions">
                                        <button className="btn-modal-cancel" onClick={() => setShowPermissionsModal(false)}>
                                            Cancelar
                                        </button>
                                        <button 
                                            className="btn-premium btn-primary-premium type-large" 
                                            onClick={handleSavePermissions}
                                            disabled={isSavingPermissions}
                                        >
                                            {isSavingPermissions ? 'Salvar Permissões' : 'Salvar Permissões'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );


            case 'academico':
                if (!canManageAcademic) return <div style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>Acesso Restrito</div>;
                return (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div className="section-title-v2">
                                <div className="icon-circle" style={{ background: '#fff7ed', color: '#ea580c' }}>
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h2>Gestão Académica</h2>
                                    <p>Gerencie Anos Lectivos e períodos escolares.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    if (showYearForm) handleCancelEditYear();
                                    else {
                                        setNewYear({ nome: '', data_inicio: '', data_fim: '', activo: false });
                                        setIsEditingYear(false);
                                        setShowYearForm(true);
                                    }
                                }}
                                className={`btn-premium ${showYearForm ? 'btn-secondary-premium' : 'btn-primary-premium'}`}
                            >
                                {showYearForm ? <X size={18} /> : <Plus size={18} />}
                                {showYearForm ? 'Fechar Form' : 'Novo Ano Lectivo'}
                            </button>
                        </div>

                        {showYearForm && (
                            <div className="info-card-v2" style={{ 
                                animation: 'slideUpFade 0.4s ease-out',
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                border: '1px solid #7dd3fc',
                                padding: '28px'
                            }}>
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                                    }}>
                                        <Calendar size={22} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0c4a6e' }}>
                                            {isEditingYear ? 'Editar Ano Lectivo' : 'Novo Ano Lectivo'}
                                        </h3>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#0369a1' }}>
                                            Preencha as informações do período académico
                                        </p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '1.5fr 1fr 1fr', 
                                    gap: '20px',
                                    background: 'white',
                                    padding: '24px',
                                    borderRadius: '16px',
                                    border: '1px solid #bae6fd'
                                }}>
                                    <div className="config-group-v2">
                                        <label style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px',
                                            fontWeight: '600',
                                            color: '#0c4a6e',
                                            marginBottom: '8px',
                                            fontSize: '14px'
                                        }}>
                                            <span style={{ 
                                                width: '20px', 
                                                height: '20px', 
                                                background: '#e0f2fe', 
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                color: '#0284c7'
                                            }}>1</span>
                                            Nome do Ano Lectivo
                                        </label>
                                        <input 
                                            type="text" 
                                            className="input-v2"
                                            style={{ 
                                                border: '2px solid #bae6fd',
                                                borderRadius: '12px',
                                                padding: '14px 16px',
                                                fontSize: '16px',
                                                fontWeight: '600'
                                            }}
                                            placeholder="Ex: 2025/2026"
                                            value={newYear.nome}
                                            onChange={(e) => setNewYear({...newYear, nome: e.target.value})}
                                        />
                                    </div>
                                    <div className="config-group-v2">
                                        <label style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px',
                                            fontWeight: '600',
                                            color: '#0c4a6e',
                                            marginBottom: '8px',
                                            fontSize: '14px'
                                        }}>
                                            <span style={{ 
                                                width: '20px', 
                                                height: '20px', 
                                                background: '#dcfce7', 
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                color: '#16a34a'
                                            }}>2</span>
                                            Data de Início
                                        </label>
                                        <input 
                                            type="date" 
                                            className="input-v2"
                                            style={{ 
                                                border: '2px solid #bbf7d0',
                                                borderRadius: '12px',
                                                padding: '14px 16px',
                                                fontSize: '15px'
                                            }}
                                            value={newYear.data_inicio}
                                            onChange={(e) => setNewYear({...newYear, data_inicio: e.target.value})}
                                        />
                                    </div>
                                    <div className="config-group-v2">
                                        <label style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px',
                                            fontWeight: '600',
                                            color: '#0c4a6e',
                                            marginBottom: '8px',
                                            fontSize: '14px'
                                        }}>
                                            <span style={{ 
                                                width: '20px', 
                                                height: '20px', 
                                                background: '#fef3c7', 
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                color: '#d97706'
                                            }}>3</span>
                                            Data de Término
                                        </label>
                                        <input 
                                            type="date" 
                                            className="input-v2"
                                            style={{ 
                                                border: '2px solid #fde68a',
                                                borderRadius: '12px',
                                                padding: '14px 16px',
                                                fontSize: '15px'
                                            }}
                                            value={newYear.data_fim}
                                            onChange={(e) => setNewYear({...newYear, data_fim: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'flex-end', 
                                    gap: '12px', 
                                    marginTop: '20px',
                                    paddingTop: '20px',
                                    borderTop: '1px solid #bae6fd'
                                }}>
                                    <button 
                                        onClick={handleCancelEditYear} 
                                        className="btn-premium"
                                        style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0' }}
                                    >
                                        <X size={18} /> Cancelar
                                    </button>
                                    <button 
                                        onClick={handleCreateYear} 
                                        className="btn-premium"
                                        style={{
                                            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                                            color: 'white',
                                            border: 'none',
                                            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                                        }}
                                    >
                                        <Save size={18} /> {isEditingYear ? 'Atualizar Dados' : 'Criar Ano Lectivo'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="table-container-v2">
                            <table className="table-v2">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Início</th>
                                        <th>Fim</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {yearLoading ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Carregando...</td></tr>
                                    ) : academicYears.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Nenhum ano cadastrado.</td></tr>
                                    ) : academicYears.map(year => (
                                        <tr key={year.id_ano}>
                                            <td style={{ fontWeight: 600 }}>{year.nome}</td>
                                            <td>{new Date(year.data_inicio).toLocaleDateString()}</td>
                                            <td>{new Date(year.data_fim).toLocaleDateString()}</td>
                                            <td>
                                                <span className="info-badge" style={{ 
                                                    background: year.activo ? '#dcfce7' : '#f1f5f9',
                                                    color: year.activo ? '#15803d' : '#64748b'
                                                }}>
                                                    {year.activo ? 'ACTIVO' : 'INACTIVO'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {!year.activo && (
                                                        <button 
                                                            onClick={() => handleToggleActiveYear(year.id_ano, year.activo)}
                                                            className="btn-premium btn-secondary-premium"
                                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                                        >
                                                            Ativar
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleEditYear(year)}
                                                        className="btn-premium btn-secondary-premium"
                                                        style={{ padding: '6px' }}
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="section-title-v2" style={{ marginTop: '48px', marginBottom: '24px' }}>
                            <div className="icon-circle" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                                <Lock size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', margin: 0 }}>Candidaturas Online</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>Controle a disponibilidade do portal externo.</p>
                            </div>
                        </div>

                        <div className="info-card-v2">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <p className="info-value" style={{ 
                                        color: config.candidaturas_abertas ? '#15803d' : '#dc2626',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span style={{ 
                                            width: '10px', 
                                            height: '10px', 
                                            borderRadius: '50%', 
                                            background: config.candidaturas_abertas ? '#22c55e' : '#ef4444',
                                            display: 'inline-block'
                                        }}></span>
                                        {config.candidaturas_abertas ? 'Portal Ativo' : 'Portal Suspenso'}
                                    </p>
                                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                                        {config.candidaturas_abertas 
                                            ? 'O público pode enviar novas candidaturas.' 
                                            : 'O portal está exibindo a mensagem de encerramento abaixo.'}
                                    </p>
                                </div>
                                <button 
                                    onClick={handleTogglePortal}
                                    className="btn-premium"
                                    style={{
                                        background: config.candidaturas_abertas ? '#fee2e2' : '#dcfce7',
                                        color: config.candidaturas_abertas ? '#b91c1c' : '#15803d',
                                        fontWeight: '600'
                                    }}
                                >
                                    {config.candidaturas_abertas ? 'Suspender Portal' : 'Abrir Candidaturas'}
                                </button>
                            </div>
                            
                            {/* Mensagem de Encerramento - Design Premium */}
                            <div style={{ 
                                background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', 
                                padding: '24px', 
                                borderRadius: '20px', 
                                border: '1px solid #fde047',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Decorative Icon */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '-10px',
                                    width: '80px',
                                    height: '80px',
                                    background: 'rgba(253, 224, 71, 0.3)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Bell size={28} color="#ca8a04" style={{ opacity: 0.5 }} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        background: '#fef08a',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <AlertTriangle size={18} color="#a16207" />
                                    </div>
                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            fontWeight: '700', 
                                            color: '#92400e',
                                            fontSize: '15px',
                                            margin: 0
                                        }}>
                                            Mensagem de Encerramento
                                        </label>
                                        <span style={{ fontSize: '12px', color: '#a16207' }}>
                                            Texto exibido quando o portal está suspenso
                                        </span>
                                    </div>
                                </div>

                                <textarea 
                                    className="input-v2"
                                    style={{ 
                                        minHeight: '120px', 
                                        width: '100%', 
                                        resize: 'none',
                                        border: '2px solid #fde047',
                                        background: 'white',
                                        borderRadius: '14px',
                                        padding: '16px',
                                        fontSize: '15px',
                                        lineHeight: '1.6',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
                                        transition: 'border-color 0.2s, box-shadow 0.2s'
                                    }}
                                    value={config.mensagem_candidaturas_fechadas}
                                    onChange={(e) => setConfig({...config, mensagem_candidaturas_fechadas: e.target.value})}
                                    placeholder="Ex: As candidaturas para o próximo ano letivo ainda não estão disponíveis. Acompanhe as nossas redes sociais para mais informações."
                                />

                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    marginTop: '16px' 
                                }}>
                                    <span style={{ fontSize: '12px', color: '#a16207', fontStyle: 'italic' }}>
                                        💡 Dica: Inclua instruções sobre quando as candidaturas serão reabertas.
                                    </span>
                                    <button 
                                        onClick={handleSaveConfig} 
                                        className="btn-premium"
                                        style={{
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                            color: 'white',
                                            border: 'none',
                                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                                        }}
                                    >
                                        <Save size={18} /> Salvar Mensagem
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'perfil':
                return (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <div className="section-title-v2">
                            <div className="icon-circle" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                <User size={24} />
                            </div>
                            <div>
                                <h2>Perfil do Usuário</h2>
                                <p>Gerencie suas informações pessoais e credenciais.</p>
                            </div>
                        </div>

                        <div className="info-card-v2" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '32px' }}>
                            <div style={{ 
                                width: '100px', 
                                height: '100px', 
                                borderRadius: '50%', 
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: 'white', 
                                fontSize: '36px', 
                                fontWeight: '700',
                                boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)'
                            }}>
                                {user?.name ? user.name.charAt(0) : 'U'}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '24px', margin: 0, color: '#1e293b' }}>{user?.name || 'Utilizador'}</h3>
                                <p style={{ fontSize: '16px', color: '#64748b', margin: '4px 0 0 0' }}>{user?.role || 'Acesso Padrão'}</p>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                    <span className="info-badge" style={{ background: '#dcfce7', color: '#15803d' }}>Conta Ativa</span>
                                    <span className="info-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>ID: #00{user?.id || '1'}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                            <div className="info-card-v2">
                                <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>Segurança da Conta</h4>
                                <button className="btn-premium btn-secondary-premium" style={{ width: '100%' }}>Alterar Senha de Acesso</button>
                            </div>
                            <div className="info-card-v2">
                                <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>Sessão Atual</h4>
                                <p style={{ fontSize: '14px', color: '#64748b' }}>Logado em: {new Date().toLocaleDateString()}</p>
                                <button className="btn-premium btn-secondary-premium" style={{ width: '100%', marginTop: '8px', color: '#ef4444' }}>Encerrar Sessão</button>
                            </div>
                        </div>
                    </div>
                );
            case 'notificacoes':
                return (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <div className="section-title-v2">
                            <div className="icon-circle" style={{ background: '#fff1f2', color: '#e11d48' }}>
                                <Bell size={24} />
                            </div>
                            <div>
                                <h2>Notificações e Alertas</h2>
                                <p>Personalize como e quando deseja ser notificado.</p>
                            </div>
                        </div>

                        <div className="info-card-v2">
                            <h4 style={{ marginBottom: '20px' }}>Preferências de Notificações</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    { label: 'Novas Matrículas', desc: 'Receba avisos quando um aluno for matriculado.' },
                                    { label: 'Pagamentos Pendentes', desc: 'Alertas sobre mensalidades em atraso.' },
                                    { label: 'Relatórios de Manutenção', desc: 'Status diário da integridade do banco de dados.' },
                                    { label: 'Logs de Segurança', desc: 'Avisos sobre tentativas de login suspeitas.' }
                                ].map((item, index) => (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{item.label}</p>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{item.desc}</p>
                                        </div>
                                        <div style={{ width: '40px', height: '22px', background: index < 2 ? '#22c55e' : '#cbd5e1', borderRadius: '20px', position: 'relative' }}>
                                            <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: index < 2 ? '21px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button className="btn-premium btn-primary-premium">Salvar Preferências</button>
                            </div>
                        </div>
                    </div>
                );
            case 'ajuda':
                return (
                    <div className="animate-fade-in">
                        <div className="section-title-v2">
                            <Info size={24} className="text-primary-accent" />
                            <div>
                                <h2>Ajuda & Suporte</h2>
                                <p>Recursos para auxiliar no uso da plataforma.</p>
                            </div>
                        </div>

                        <div className="config-grid-v2">
                            {/* Manuais Section */}
                            <div className="info-card-v2" style={{ gridColumn: 'span 2' }}>
                                <div className="card-header-v2">
                                    <BookOpen size={20} className="text-secondary" />
                                    <h3>Manuais do Utilizador</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                        <p style={{ color: '#475569', marginBottom: '16px', lineHeight: '1.6' }}>
                                            Baixe o manual completo do utilizador para aprender a usar todas as funcionalidades do sistema, desde o cadastro de alunos até a emissão de relatórios financeiros.
                                        </p>
                                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px', color: '#64748b' }}>
                                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><CheckCircle size={16} color="#22c55e" /> Guia passo-a-passo ilustrado</li>
                                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><CheckCircle size={16} color="#22c55e" /> Dicas de segurança e boas práticas</li>
                                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} color="#22c55e" /> Solução de problemas comuns</li>
                                        </ul>
                                    </div>
                                    <div className="manual-download-card">
                                        <div className="pdf-icon-placeholder">
                                            <FileText size={32} color="white" />
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>PDF</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Manual do Administrador</h4>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Versão 2.1 • Atualizado em Jan 2026</p>
                                        </div>
                                        <button className="btn-download-manual">
                                            <Download size={18} />
                                            Download (2MB)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Contact/Support Section */}
                            <div className="info-card-v2">
                                <div className="card-header-v2">
                                    <HelpCircle size={20} className="text-warning" />
                                    <h3>Precisa de Ajuda Técnica?</h3>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '12px', lineHeight: '1.5' }}>
                                    Se encontrar algum erro ou tiver dificuldades técnicas, entre em contato com a equipe de TI.
                                </p>
                                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#475569' }}><strong>Email:</strong> suporte@escola.ao</p>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}><strong>Ramal:</strong> 1234 (TI)</p>
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
        <div className="config-page">
            <header className="config-header-v2">
                <h1>Configurações do Sistema</h1>
                <p>Gerencie as preferências, segurança e manutenção da plataforma escolar.</p>
            </header>

            <div className="config-layout-v2">
                {/* Sidebar V2 */}
                <aside className="config-sidebar-v2">
                    {canViewConfig && (
                        <button
                            className={`config-nav-item ${activeTab === 'manutencao' ? 'active' : ''}`}
                            onClick={() => setActiveTab('manutencao')}
                        >
                            <Database size={20} /> Manutenção
                        </button>
                    )}
                    {canViewConfig && (
                        <button
                            className={`config-nav-item ${activeTab === 'personalizacao' ? 'active' : ''}`}
                            onClick={() => setActiveTab('personalizacao')}
                        >
                            <Palette size={20} /> Personalização
                        </button>
                    )}
                    {canManageUsers && (
                        <button
                            className={`config-nav-item ${activeTab === 'seguranca' ? 'active' : ''}`}
                            onClick={() => setActiveTab('seguranca')}
                        >
                            <Shield size={20} /> Segurança
                        </button>
                    )}
                    {canManageAcademic && (
                        <button
                            className={`config-nav-item ${activeTab === 'academico' ? 'active' : ''}`}
                            onClick={() => setActiveTab('academico')}
                        >
                            <Calendar size={20} /> Académico
                        </button>
                    )}
                    <button
                        className={`config-nav-item ${activeTab === 'perfil' ? 'active' : ''}`}
                        onClick={() => setActiveTab('perfil')}
                    >
                        <User size={20} /> Perfil
                    </button>
                    <button
                        className={`config-nav-item ${activeTab === 'notificacoes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notificacoes')}
                    >
                        <Bell size={20} /> Notificações
                    </button>
                    <button
                        className={`config-nav-item ${activeTab === 'ajuda' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ajuda')}
                    >
                        <HelpCircle size={20} /> Ajuda
                    </button>
                </aside>

                {/* Main Content Area V2 */}
                <main className="config-main-v2">
                    <div className="config-card-v2">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Configuracoes;
