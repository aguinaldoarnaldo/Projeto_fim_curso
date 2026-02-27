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
    BookOpen,
    Archive,
    Activity,
    LogIn,
    Clock,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    RefreshCw,
    Upload
} from 'lucide-react';
import { PERMISSIONS, PERMISSIONS_PT, PERMISSION_GROUPS, ROLES, ROLE_PERMISSIONS } from '../../utils/permissions';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext exists
import api from '../../services/api';
import { parseApiError } from '../../utils/errorParser';


const Configuracoes = () => {
    const { themeColor, changeColor } = useTheme();
    // Try to get auth context, fallback to mock if not available
    const auth = useAuth() || {};
    const { user, refreshUser } = auth;

    // Permissões
    const canViewConfig = auth.hasPermission && auth.hasPermission(PERMISSIONS.VIEW_CONFIGURACOES);
    const canManageUsers = auth.hasPermission && auth.hasPermission(PERMISSIONS.MANAGE_USUARIOS);
    // Acadêmico requires specific Management permission, not just View Config
    const canManageAcademic = auth.hasPermission && auth.hasPermission(PERMISSIONS.MANAGE_CONFIGURACOES);
    // Maintenance requires Backup permission
    const canManageMaintenance = auth.hasPermission && auth.hasPermission(PERMISSIONS.MANAGE_BACKUP);
    const canViewLogs = auth.hasPermission && auth.hasPermission(PERMISSIONS.VIEW_LOGS);
    // Fallback for admin legacy check if needed, but prefer permissions
    const isAdmin = (auth.hasPermission && auth.hasPermission(PERMISSIONS.MANAGE_USUARIOS)) || (user && user.role === 'Admin') || (user?.cargo?.toLowerCase().includes('admin'));

    const [activeTab, setActiveTab] = useState(() => {
        if (canManageMaintenance) return 'manutencao';
        if (canViewConfig) return 'personalizacao';
        if (canManageUsers) return 'seguranca';
        if (canManageAcademic) return 'academico';
        return 'ajuda';
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [backupStatus, setBackupStatus] = useState('idle');
    const [saving, setSaving] = useState(false); // Added for restore operation

    // Real Data States
    const [usuarios, setUsuarios] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cargosLoading, setCargosLoading] = useState(false);

    // Academic Year States
    const [academicYears, setAcademicYears] = useState([]);
    const [yearLoading, setYearLoading] = useState(false);
    const [newYear, setNewYear] = useState({
        nome: '', data_inicio: '', data_fim: '',
        status: 'Planeado', activo: false,
        inicio_inscricoes: '', fim_inscricoes: '',
        inicio_matriculas: '', fim_matriculas: '',
        data_exame_admissao: '', data_teste_diagnostico: '',
        hora_fechamento: '23:59', fecho_automatico_inscricoes: false
    });
    const [isEditingYear, setIsEditingYear] = useState(false);
    const [editingYearId, setEditingYearId] = useState(null);
    const [yearCurrentPage, setYearCurrentPage] = useState(1);
    const [yearTotalPages, setYearTotalPages] = useState(1);
    const [backupsList, setBackupsList] = useState([]);

    // Logs / Auditoria State
    const [logsTab, setLogsTab] = useState('logins'); // 'logins' | 'actividades'
    const [logsResumo, setLogsResumo] = useState(null);
    const [logsData, setLogsData] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsPage, setLogsPage] = useState(1);
    const [logsTotalPages, setLogsTotalPages] = useState(1);
    const [logsTotal, setLogsTotal] = useState(0);
    const [logsFilter, setLogsFilter] = useState({ busca: '', data_inicio: '', data_fim: '', tipo: 'all' });

    // Redirect if permission is lost dynamically
    useEffect(() => {
        if (activeTab === 'manutencao' && !canManageMaintenance) setActiveTab(canViewConfig ? 'personalizacao' : 'ajuda');
        if (activeTab === 'seguranca' && !canManageUsers) setActiveTab('ajuda');
        if (activeTab === 'academico' && !canManageAcademic) setActiveTab('ajuda');
    }, [activeTab, canManageMaintenance, canManageUsers, canManageAcademic, canViewConfig]);


    // Modal State
    const [showUserModal, setShowUserModal] = useState(false);
    const [cargoError, setCargoError] = useState(null);
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [showYearForm, setShowYearForm] = useState(false);

    // Global Config State
    const [config, setConfig] = useState({
        candidaturas_abertas: true,
        mensagem_candidaturas_fechadas: '',
        data_fim_candidatura: '',
        fechamento_automatico: false
    });
    const [configLoading, setConfigLoading] = useState(false);
    const [newUserEncoded, setNewUserEncoded] = useState({
        nome_completo: '',
        email: '',
        senha_hash: '',
        papel: 'Comum',
        is_active: true
    });

    // Permissions Modal State
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [editingPermissions, setEditingPermissions] = useState([]); // List of permission strings
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);
    const [userPhoto, setUserPhoto] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState(null); // Para o modal de detalhes

    // Fetch Cargos on Mount (Global for the page)
    useEffect(() => {
        fetchCargos();
    }, []);

    // Fetch Academic Years when tab is active
    useEffect(() => {
        if (activeTab === 'academico' || activeTab === 'personalizacao') {
            fetchAcademicYears();
            fetchConfig();
        }
        if (activeTab === 'manutencao') {
            fetchBackups();
        }
        if (activeTab === 'logs') {
            fetchLogsResumo();
            fetchLogs(1);
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

    const fetchLogsResumo = async () => {
        try {
            const res = await api.get('auditoria/resumo/');
            setLogsResumo(res.data);
        } catch (e) {
            console.error('Erro ao carregar resumo de logs:', e);
        }
    };

    const fetchLogs = async (page = 1, tipo = logsTab, filtros = logsFilter) => {
        setLogsLoading(true);
        try {
            const endpoint = tipo === 'logins' ? 'auditoria/logins/' : 'auditoria/actividades/';
            const params = new URLSearchParams({ page, page_size: 20 });
            if (filtros.busca) params.append('busca', filtros.busca);
            if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
            if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
            if (filtros.tipo && filtros.tipo !== 'all') params.append('tipo', filtros.tipo);
            const res = await api.get(`${endpoint}?${params}`);
            setLogsData(res.data.results || []);
            setLogsPage(res.data.page || 1);
            setLogsTotalPages(res.data.total_pages || 1);
            setLogsTotal(res.data.count || 0);
        } catch (e) {
            console.error('Erro ao carregar logs:', e);
        } finally {
            setLogsLoading(false);
        }
    };

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
            await api.post('backups/create_backup/', {}, { timeout: 300000 }); // Extender para 5 minutos
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
                responseType: 'blob',
                timeout: 300000 // Extender para 5 minutos para ficheiros grandes
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

    const handleRestoreBackup = async (filename) => {
        console.log("Iniciando restauração do backup:", filename);
        if (!window.confirm("AVISO CRÍTICO: Esta ação irá substituir TODOS os dados atuais do sistema (Base de Dados e Media) pelos dados deste backup. Deseja continuar?")) return;

        try {
            setSaving(true);
            const response = await api.post('backups/restore_backup/', { filename });
            alert("✅ Backup restaurado com sucesso!\n\nPara garantir que todos os dados sejam actualizados correctamente, a página será recarregada. Por favor, termine a sessão e entre novamente após o recarregamento.");
            // Recarregar a página para garantir que os novos dados sejam carregados
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error("Erro ao restaurar backup:", error);
            alert(error.response?.data?.error || "Erro ao restaurar backup");
        } finally {
            setSaving(false);
        }
    };

    const handleUploadRestoreBackup = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!window.confirm("AVISO CRÍTICO: Está prestes a restaurar o sistema a partir de um ficheiro externo. Isso irá apagar TODOS os dados actuais. Tem a certeza?")) {
             e.target.value = ''; // Limpar input
             return;
        }

        try {
            setSaving(true);
            setBackupStatus('processing');
            
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('backups/upload_and_restore_backup/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 600000 // 10 minutos para uploads grandes
            });

            alert("✅ Sistema restaurado com sucesso a partir do ficheiro!\n\nAVISO: É obrigatório terminar a sessão e entrar novamente (Logout/Login) para aplicar as novas permissões e dados de acesso restaurados.");
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error("Erro no upload de restauração:", error);
            alert(error.response?.data?.error || "Falha ao carregar ou restaurar o ficheiro.");
        } finally {
            setSaving(false);
            setBackupStatus('idle');
            e.target.value = '';
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
            formData.append('is_active', newUserEncoded.is_active);
            
            // Novos usuários agora começam com acesso ao painel principal por padrão
            formData.append('permissoes', JSON.stringify([PERMISSIONS.VIEW_DASHBOARD]));
            
            if (newUserEncoded.senha_hash) {
                formData.append('senha_hash', newUserEncoded.senha_hash);
            }
            
            if (userPhoto) {
                formData.append('img_path', userPhoto);
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
                is_active: true
            });
            setUserPhoto(null);
            setIsEditingUser(false);
            fetchSecurityData(true); // Refresh list
            
            // Se o usuário editado for o usuário logado, atualize a sessão em tempo real
            if (isEditingUser && selectedUser && user && selectedUser.id_usuario === user.id) {
                if (refreshUser) refreshUser();
            }
        } catch (error) {
            const msg = parseApiError(error, "Erro ao processar a solicitação.");
            alert(msg);
        }
    };
    
    // Preparar edição
    const handleEditSelectedUser = () => {
        if (!selectedUser) return;
        setNewUserEncoded({
            nome_completo: selectedUser.nome_completo,
            email: selectedUser.email || '',
            papel: selectedUser.papel || 'Comum',
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
            const msg = parseApiError(error, "Erro ao atualizar status.");
            alert(msg);
        }
    };

    const handleManagePermissions = () => {
        if (!selectedUser) return;
        
        let currentPerms = [];
        
        // Carregar lista de permissões se existir (mesmo se vazia [])
        if (selectedUser.permissoes && Array.isArray(selectedUser.permissoes)) {
            currentPerms = [...selectedUser.permissoes];
        } else if (selectedUser.permissoes_adicionais && Array.isArray(selectedUser.permissoes_adicionais)) {
            currentPerms = [...selectedUser.permissoes_adicionais];
        } else {
            // Caso raro onde o campo não existe (nenhuma permissão concedida)
            currentPerms = [];
        }
        
        setEditingPermissions(currentPerms);
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

    const applyRolePreset = (roleKey) => {
        if (ROLE_PERMISSIONS[roleKey]) {
            setEditingPermissions([...ROLE_PERMISSIONS[roleKey]]);
        }
    };

    const toggleAllPermissions = (selectAll = true) => {
        if (selectAll) {
            setEditingPermissions(Object.values(PERMISSIONS));
        } else {
            setEditingPermissions([]);
        }
    };

    const toggleGroupPermissions = (groupPerms) => {
        const allSelected = groupPerms.every(p => editingPermissions.includes(p));
        if (allSelected) {
            // Deselect all in group
            setEditingPermissions(prev => prev.filter(p => !groupPerms.includes(p)));
        } else {
            // Select all in group (keeping others)
            setEditingPermissions(prev => {
                const uniqueNew = groupPerms.filter(p => !prev.includes(p));
                return [...prev, ...uniqueNew];
            });
        }
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
            
            // Se o usuário editado for o usuário logado, atualize a sessão em tempo real
            if (user && selectedUser.id_usuario === user.id) {
                if (refreshUser) refreshUser();
            }
            
            setShowPermissionsModal(false);
        } catch (error) {
            console.error("Erro ao salvar permissões:", error);
            const msg = parseApiError(error, "Erro ao salvar permissões.");
            alert(msg);
        } finally {
            setIsSavingPermissions(false);
        }
    };

    const showTransitionStats = (stats) => {
        if (!stats) return;
        
        let message = "";
        
        if (stats.closed) {
            message += `O ano letivo ${stats.closed.nome} foi ENCERRADO.\n`;
            message += `• ${stats.closed.turmas} turmas concluídas\n`;
            message += `• ${stats.closed.matriculas} matrículas concluídas\n`;
            message += `• ${stats.closed.alunos} alunos movidos para 'Concluido'\n\n`;
        }
        
        if (stats.reopened) {
            message += `O ano letivo ${stats.reopened.nome} foi REABERTO.\n`;
            message += `• ${stats.reopened.turmas} turmas reactivadas\n`;
            message += `• ${stats.reopened.matriculas} matrículas reactivadas\n`;
            message += `• ${stats.reopened.alunos} alunos movidos de volta para 'Activo'`;
        }
        
        if (message) {
            alert(message);
        }
    };

    // --- ACADEMIC YEAR HANDLERS ---
    const fetchAcademicYears = async (page = 1) => {
        setYearLoading(true);
        try {
            const response = await api.get(`anos-lectivos/?page=${page}`);
            setAcademicYears(response.data.results || response.data || []);
            
            // Update pagination info
            if (response.data.count) {
                const total = Math.ceil(response.data.count / 6); 
                setYearTotalPages(total);
                setYearCurrentPage(page);
            }
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
            const msg = parseApiError(error, "Erro ao salvar configurações.");
            alert(msg);
        }
    };

    const handleSaveBranding = async () => {
        try {
            const formData = new FormData();
            formData.append('nome_escola', config.nome_escola);
            if (logoFile) {
                formData.append('logo', logoFile);
            }
            
            await api.patch('config/update_config/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Identidade visual atualizada com sucesso! A página será recarregada para aplicar as mudanças.");
            window.location.reload(); 
        } catch (error) {
            console.error("Erro ao salvar branding:", error);
            const msg = parseApiError(error, "Erro ao salvar alterações.");
            alert(msg);
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
                const response = await api.patch(`anos-lectivos/${editingYearId}/`, newYear);
                if (response.data.stats) {
                    showTransitionStats(response.data.stats);
                } else {
                    alert("Ano Lectivo atualizado com sucesso!");
                }
                setIsEditingYear(false);
                setEditingYearId(null);
            } else {
                // Create
                await api.post('anos-lectivos/', newYear);
                alert("Ano Lectivo criado com sucesso!");
            }
            setNewYear({ 
                nome: '', data_inicio: '', data_fim: '', status: 'Planeado', activo: false,
                inicio_inscricoes: '', fim_inscricoes: '',
                inicio_matriculas: '', fim_matriculas: '',
                data_exame_admissao: '', data_teste_diagnostico: ''
            });
            setShowYearForm(false);
            fetchAcademicYears();
        } catch (error) {
            console.error("Erro ao salvar ano lectivo:", error);
            const msg = parseApiError(error, "Erro ao salvar ano lectivo.");
            alert(msg);
        }
    };

    const handleEditYear = (year) => {
        setNewYear({
            nome: year.nome,
            data_inicio: year.data_inicio,
            data_fim: year.data_fim,
            status: year.status || (year.activo ? 'Activo' : 'Encerrado'),
            activo: year.activo,
            inicio_inscricoes: year.inicio_inscricoes || '',
            fim_inscricoes: year.fim_inscricoes || '',
            inicio_matriculas: year.inicio_matriculas || '',
            fim_matriculas: year.fim_matriculas || '',
            data_exame_admissao: year.data_exame_admissao || '',
            data_teste_diagnostico: year.data_teste_diagnostico || '',
            hora_fechamento: year.hora_fechamento || '23:59',
            fecho_automatico_inscricoes: year.fecho_automatico_inscricoes || false
        });
        setIsEditingYear(true);
        setEditingYearId(year.id_ano);
        setShowYearForm(true);
    };

    const handleCancelEditYear = () => {
        setNewYear({ 
            nome: '', data_inicio: '', data_fim: '', status: 'Planeado', activo: false,
            inicio_inscricoes: '', fim_inscricoes: '',
            inicio_matriculas: '', fim_matriculas: '',
            data_exame_admissao: '', data_teste_diagnostico: '',
            hora_fechamento: '23:59', fecho_automatico_inscricoes: false
        });
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
            const response = await api.patch(`anos-lectivos/${id}/`, { activo: true });
            fetchAcademicYears(); // Refresh to see updates
            
            if (response.data.stats) {
                showTransitionStats(response.data.stats);
            } else {
                alert("Ano lectivo reaberto com sucesso!");
            }
        } catch (error) {
            console.error("Erro ao activar ano:", error);
            const msg = parseApiError(error, "Erro ao mudar status do ano.");
            alert(msg);
        }
    };

    const handleCloseYear = async (id) => {
        if (!window.confirm("Deseja realmente encerrar este ano lectivo? Isso impedirá novas matrículas e alterações nos dados académicos deste período.")) {
            return;
        }

        try {
            const response = await api.post(`anos-lectivos/${id}/encerrar/`);
            if (response.data.stats) {
                showTransitionStats(response.data.stats);
            } else {
                alert(`Ano Lectivo encerrado com sucesso.`);
            }
            fetchAcademicYears();
        } catch (error) {
            console.error("Erro ao encerrar ano:", error);
            const msg = parseApiError(error, "Erro ao encerrar ano lectivo.");
            alert(msg);
        }
    };

    const renderLogDetailsModal = () => {
        if (!selectedLog) return null;

        const isActividade = !!selectedLog.actor;
        const dadosNovos = selectedLog.dados_novos;
        const dadosAnteriores = selectedLog.dados_anteriores;

        // Função para traduzir chaves técnicas para nomes amigáveis
        const translateKey = (key) => {
            const translations = {
                'id_turma': 'Turma',
                'id_curso': 'Curso',
                'id_sala': 'Sala',
                'id_classe': 'Classe',
                'id_aluno': 'Aluno',
                'nome_completo': 'Nome Completo',
                'status_aluno': 'Estado do Aluno',
                'status': 'Estado',
                'id_ano': 'Ano Lectivo',
                'numero_bi': 'Número de BI',
                'data_nascimento': 'Data de Nascimento',
                'genero': 'Género',
                'nacionalidade': 'Nacionalidade',
                'naturalidade': 'Naturalidade',
                'email': 'E-mail',
                'telefone': 'Telefone',
                'codigo': 'Código',
                'nome': 'Nome',
                'num_sala': 'Nº Sala',
                'capacidade': 'Capacidade',
                'periodo': 'Período',
                'tipo': 'Tipo',
                'valor': 'Valor',
                'data': 'Data',
                'ativo': 'Ativo',
                'observacao': 'Observação',
                'id_matricula': 'ID Matrícula',
                'id_usuario': 'ID Utilizador',
                'id_funcionario': 'ID Funcionário',
                'id_encarregado': 'ID Encarregado',
                'salario_base': 'Salário Base',
                'subsidio': 'Subsídio',
                'bonus': 'Bónus',
                'morada': 'Morada',
                'bairro_residencia': 'Bairro',
                'municipio_residencia': 'Município',
                'provincia_residencia': 'Província',
                'numero_casa': 'Nº Casa'
            };
            return translations[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        };

        const renderChanges = () => {
            const allKeys = new Set([...Object.keys(dadosNovos || {}), ...Object.keys(dadosAnteriores || {})]);
            const rows = [];
            
            allKeys.forEach(key => {
                // Ignorar campos puramente técnicos que confundem o utilizador
                if (['id', 'criado_em', 'actualizado_em', 'password', 'senha_hash', 'id_usuario', 'id_funcionario'].includes(key)) return;
                
                const oldVal = dadosAnteriores?.[key];
                const newVal = dadosNovos?.[key];
                
                // Se o valor não mudou, não precisamos mostrar (para evitar ruído)
                if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;
                
                rows.push({ key, oldVal, newVal });
            });

            if (rows.length === 0 && selectedLog.tipo_accao.toLowerCase().includes('actualizou')) {
                return (
                    <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Nenhuma alteração de valores detectada nos campos principais.</p>
                    </div>
                );
            }

            return (
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#475569', fontWeight: 800, width: '25%' }}>Informação</th>
                                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#be123c', fontWeight: 800, background: 'rgba(254, 226, 226, 0.4)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ChevronLeft size={14} /> Antes (Como estava)
                                    </div>
                                </th>
                                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#15803d', fontWeight: 800, background: 'rgba(220, 252, 231, 0.4)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Depois (Como ficou) <ChevronRightIcon size={14} />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={row.key} style={{ borderBottom: idx === rows.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b', background: '#fcfcfc' }}>
                                        {translateKey(row.key)}
                                    </td>
                                    <td style={{ padding: '14px 20px', color: '#be123c', background: 'rgba(254, 226, 226, 0.15)', fontStyle: row.oldVal === null ? 'italic' : 'normal' }}>
                                        {row.oldVal === null || row.oldVal === undefined ? (
                                            <span style={{ opacity: 0.5 }}>— (Vazio)</span>
                                        ) : (
                                            <span style={{ fontWeight: 500 }}>{String(row.oldVal)}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 20px', color: '#15803d', background: 'rgba(220, 252, 231, 0.15)', fontWeight: 700 }}>
                                        {row.newVal === null || row.newVal === undefined ? (
                                            <span style={{ opacity: 0.5, fontStyle: 'italic', fontWeight: 400 }}>— (Removido)</span>
                                        ) : (
                                            String(row.newVal)
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        };

        return (
            <div className="modal-overlay" style={{ zIndex: 3000 }}>
                <div className="modal-content" style={{ maxWidth: '850px', width: '95%', padding: '0', overflow: 'hidden', borderRadius: '24px' }}>
                    <div style={{ padding: '24px 30px', background: 'linear-gradient(to right, #f8fafc, #eff6ff)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: '#1e293b', fontSize: '20px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <Activity size={20} color="var(--primary-color)" />
                            </div>
                            Explorador de Registo Histórico
                        </h3>
                        <button onClick={() => setSelectedLog(null)} style={{ border: 'none', background: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ padding: '30px', maxHeight: '75vh', overflowY: 'auto', background: '#fcfcfc' }}>
                        {/* Header Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.05em' }}>Responsável</p>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <User size={16} color="#3b82f6" /> {isActividade ? selectedLog.actor : selectedLog.utilizador}
                                </p>
                            </div>
                            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.05em' }}>Data e Hora</p>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} color="#3b82f6" /> {selectedLog.data_hora || selectedLog.entrada}
                                </p>
                            </div>
                            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.05em' }}>ID do Registo</p>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#64748b', margin: 0, fontFamily: 'monospace' }}>#LOG-{selectedLog.id}</p>
                            </div>
                        </div>

                        {!isActividade ? (
                            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <LogIn size={18} /> Detalhes da Sessão de Login
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Terminal / Endereço IP</p>
                                        <p style={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e293b', fontSize: '16px', margin: 0 }}>{selectedLog.ip}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Saída (Logout)</p>
                                        <p style={{ fontWeight: 700, color: selectedLog.sessao_activa ? '#059669' : '#1e293b', fontSize: '16px', margin: 0 }}>
                                            {selectedLog.sessao_activa ? 'Sessão ainda ativa' : selectedLog.saida}
                                        </p>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Agente de Navegação (Browser)</p>
                                        <p style={{ fontSize: '14px', background: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#475569' }}>{selectedLog.dispositivo}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px', background: '#f1f5f9', padding: '20px', borderRadius: '18px' }}>
                                    <div style={{ width: '48px', height: '48px', background: 'var(--primary-color)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, marginBottom: '4px', letterSpacing: '0.05em' }}>Tipo de Operação</p>
                                        <p style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{selectedLog.tipo_accao}</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <FileText size={18} color="#64748b" />
                                        <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Resumo das Alterações</h4>
                                    </div>
                                    {renderChanges()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '20px 30px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Este registo é permanente e não pode ser alterado.</span>
                        <button onClick={() => setSelectedLog(null)} className="btn-premium" style={{ border: 'none', background: '#1e293b', color: 'white', padding: '10px 24px', borderRadius: '12px', fontWeight: 600 }}>
                            Concluído
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'manutencao':
                if (!canViewConfig) return <div style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>Acesso Restrito</div>;
                return (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <div className="section-title-v2">
                            <div className="icon-circle" style={{ background: 'var(--primary-light-bg)', color: 'var(--primary-color)' }}>
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
                                <div className="info-badge" style={{ color: backupsList.length > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
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
                            <label className="btn-premium btn-secondary-premium" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Upload size={18} />
                                <span>Restaurar do ficheiro</span>
                                <input 
                                    type="file" 
                                    accept=".zip" 
                                    style={{ display: 'none' }}
                                    onChange={handleUploadRestoreBackup}
                                    disabled={saving}
                                />
                            </label>
                        </div>

                        {backupStatus === 'completed' && (
                            <div className="info-card-v2 alert-success" style={{ animation: 'fadeIn 0.3s', background: 'var(--success-light)', borderColor: 'var(--success)', color: 'var(--success-dark)' }}>
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
                                                    onClick={() => handleRestoreBackup(b.filename)}
                                                    className="btn-icon-action" 
                                                    title="Restaurar Este Backup"
                                                    style={{ background: '#f0fdf4', color: '#16a34a', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteBackup(b.filename)}
                                                    className="btn-icon-action" 
                                                    title="Eliminar"
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
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
                            <div className="icon-circle" style={{ background: 'var(--primary-light-bg)', color: 'var(--primary-color)' }}>
                                <Palette size={24} />
                            </div>
                            <div>
                                <h2>Branding e Personalização</h2>
                                <p>Adapte a identidade visual da plataforma à sua instituição.</p>
                            </div>
                        </div>

                         <div className="config-group-v2">
                            <label>Nome da Instituição (Escola)</label>
                            <input 
                                type="text" 
                                className="input-v2"
                                value={config.nome_escola || ''}
                                onChange={e => setConfig({...config, nome_escola: e.target.value})}
                                placeholder="Ex: Instituto Politécnico de Luanda"
                            />
                            <p style={{fontSize: '12px', color: '#64748b', marginTop: '6px'}}>Este nome aparecerá na tela de login, sidebar e documentos gerados.</p>
                        </div>

                        <div className="config-group-v2">
                            <label>Logotipo da Instituição</label>
                            <div style={{display: 'flex', gap: '24px', alignItems: 'center'}}>
                                <div style={{
                                    width: '80px', height: '80px', 
                                    background: 'var(--bg-light)', border: '1px dashed var(--border-color)', 
                                    borderRadius: '12px', display: 'flex', 
                                    alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {(logoFile || config.logo) ? (
                                        <img 
                                            src={logoFile ? URL.createObjectURL(logoFile) : config.logo} 
                                            alt="Preview" 
                                            style={{width: '100%', height: '100%', objectFit: 'contain'}}
                                        />
                                    ) : (
                                        <span style={{fontSize: '10px', color: '#94a3b8'}}>Sem Logo</span>
                                    )}
                                </div>
                                <div style={{flex: 1}}>
                                    <input 
                                        type="file" 
                                        className="input-v2"
                                        onChange={e => setLogoFile(e.target.files[0])}
                                        accept="image/*"
                                        style={{padding: '10px'}}
                                    />
                                    <p style={{fontSize: '12px', color: '#64748b', marginTop: '6px'}}>
                                        Recomendado: PNG ou JPG com fundo transparente (min. 200x200px).
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '30px' }}>
                             <button onClick={handleSaveBranding} className="btn-premium btn-primary-premium">
                                <Save size={18} /> Salvar Identidade
                            </button>
                        </div>

                        <h3 style={{fontSize: '18px', color: 'var(--text-color)', marginBottom: '20px'}}>Tema do Sistema</h3>

                        <div className="config-group-v2">
                            <label>Cor Principal</label>
                            <div className="color-options-v2">
                                <div 
                                    className={`color-card-v2 ${themeColor === 'blue' ? 'active' : ''}`}
                                    onClick={() => changeColor('blue')}
                                >
                                    <div className="color-dot" style={{ background: '#1e40af' }}></div>
                                    <span style={{ fontWeight: 600 }}>Azul Oceano (Padrão)</span>
                                </div>
                                <div 
                                    className={`color-card-v2 ${themeColor === 'green' ? 'active' : ''}`}
                                    onClick={() => changeColor('green')}
                                >
                                    <div className="color-dot" style={{ background: '#059669' }}></div>
                                    <span style={{ fontWeight: 600 }}>Verde Natureza</span>
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
                                    <div className="icon-circle" style={{ background: 'var(--primary-light-bg)', color: 'var(--primary-color)' }}>
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
                                    {loading && usuarios.length === 0 ? (
                                        <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#64748b'}}>
                                            <div className="spinner"></div>
                                            <p style={{marginTop: '10px'}}>Carregando usuários...</p>
                                        </div>
                                    ) : filteredUsuarios.length > 0 ? (
                                        filteredUsuarios.map(u => (
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
                                                        color: u.is_active ? 'var(--success)' : 'var(--danger)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.is_active ? 'var(--success)' : 'var(--danger)' }}></div>
                                                        {u.is_active ? 'ATIVO' : 'INATIVO'}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); handleEditSelectedUser(); }} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}>
                                                            <Edit size={14} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); handleManagePermissions(); }} style={{ background: 'var(--primary-light-bg)', border: '1px solid var(--config-accent)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--primary-color)' }}>
                                                            <ShieldCheck size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0'}}>
                                            <p style={{color: '#64748b', fontWeight: 600}}>Nenhum usuário encontrado.</p>
                                            <p style={{fontSize: '12px', color: '#94a3b8'}}>Tente ajustar sua pesquisa ou adicione um novo usuário.</p>
                                        </div>
                                    )}
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
                                        <h3>Gestão de Acessos Individuais</h3>
                                        <p>Ative o que {selectedUser?.nome_completo} pode acessar. Use os atalhos para preenchimento rápido.</p>
                                    </div>

                                    {/* MÉTODOS RÁPIDOS DE ATRIBUIÇÃO */}
                                    <div className="permission-presets-section" style={{
                                        padding: '15px',
                                        background: '#f8fafc',
                                        borderRadius: '12px',
                                        marginBottom: '20px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <span style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b', display:'block', marginBottom: '10px'}}>
                                            ATRIBUIÇÃO RÁPIDA (PRESETS):
                                        </span>
                                        <div className="presets-grid" style={{display:'flex', gap: '8px', flexWrap:'wrap'}}>
                                            <button onClick={() => applyRolePreset('ADMIN')} className="btn-preset admin" style={{padding:'6px 12px', borderRadius:'20px', fontSize:'11px', border:'1px solid #94a3b8', background:'white', cursor:'pointer'}}>Admin Total</button>
                                            <button onClick={() => applyRolePreset('SECRETARIA')} className="btn-preset" style={{padding:'6px 12px', borderRadius:'20px', fontSize:'11px', border:'1px solid #94a3b8', background:'white', cursor:'pointer'}}>Secretaria</button>
                                            <button onClick={() => applyRolePreset('PROFESSOR')} className="btn-preset" style={{padding:'6px 12px', borderRadius:'20px', fontSize:'11px', border:'1px solid #94a3b8', background:'white', cursor:'pointer'}}>Professor</button>
                                            <button onClick={() => applyRolePreset('ALUNO')} className="btn-preset" style={{padding:'6px 12px', borderRadius:'20px', fontSize:'11px', border:'1px solid #94a3b8', background:'white', cursor:'pointer'}}>Aluno (Consulta)</button>
                                            <div style={{width:'1px', height: '20px', background: '#cbd5e1', margin: '0 5px'}}></div>
                                            <button onClick={() => toggleAllPermissions(true)} className="btn-preset" style={{padding:'6px 12px', borderRadius:'20px', fontSize:'11px', border:'1px solid #2563eb', color:'#2563eb', background:'white', cursor:'pointer'}}>Selecionar Tudo</button>
                                            <button onClick={() => toggleAllPermissions(false)} className="btn-preset" style={{padding:'6px 12px', borderRadius:'20px', fontSize:'11px', border:'1px solid #dc2626', color:'#dc2626', background:'white', cursor:'pointer'}}>Limpar Tudo</button>
                                        </div>
                                    </div>
                                    
                                    <div className="permissions-scroll-container">
                                        {PERMISSION_GROUPS.map((group) => {
                                            const allGroupSelected = group.permissions.every(p => editingPermissions.includes(p));
                                            return (
                                                <div key={group.name} className="permission-group">
                                                    <div className="group-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f1f5f9', paddingBottom:'8px', marginBottom:'15px'}}>
                                                        <h4 className="group-title" style={{margin:0}}>{group.name}</h4>
                                                        <button 
                                                            onClick={() => toggleGroupPermissions(group.permissions)}
                                                            className="btn-group-toggle"
                                                            style={{
                                                                fontSize: '11px',
                                                                color: '#3b82f6',
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            {allGroupSelected ? 'Desmarcar Grupo' : 'Marcar Grupo'}
                                                        </button>
                                                    </div>
                                                    <div className="permission-items-grid">
                                                    {group.permissions.map((perm) => {
                                                        const isSelected = editingPermissions.includes(perm);
                                                        return (
                                                            <div 
                                                                key={perm} 
                                                                onClick={() => togglePermission(perm)}
                                                                className={`permission-item-card toggle-style ${isSelected ? 'active' : ''}`}
                                                                style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '12px 16px',
                                                                    border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                                    background: isSelected ? '#eff6ff' : 'white',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '8px',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <div className="perm-text-content">
                                                                    <span className="perm-label" style={{fontWeight: '600', display:'block', color:'#334155'}}>
                                                                        {PERMISSIONS_PT[perm] || perm}
                                                                    </span>
                                                                    <span className="perm-code" style={{fontSize:'10px', color:'#94a3b8'}}>
                                                                        {perm}
                                                                    </span>
                                                                </div>
                                                                
                                                                {/* TOGGLE SWITCH VISUAL */}
                                                                <div style={{
                                                                    width: '40px',
                                                                    height: '22px',
                                                                    background: isSelected ? '#2563eb' : '#cbd5e1',
                                                                    borderRadius: '20px',
                                                                    position: 'relative',
                                                                    transition: 'background 0.3s'
                                                                }}>
                                                                    <div style={{
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        background: 'white',
                                                                        borderRadius: '50%',
                                                                        position: 'absolute',
                                                                        top: '2px',
                                                                        left: isSelected ? '20px' : '2px',
                                                                        transition: 'left 0.3s',
                                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                                    }}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                <div className="icon-circle" style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)' }}>
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
                                        setNewYear({ 
                                            nome: '', data_inicio: '', data_fim: '', 
                                            status: 'Planeado', activo: false,
                                            inicio_inscricoes: '', fim_inscricoes: '',
                                            inicio_matriculas: '', fim_matriculas: '',
                                            data_exame_admissao: '', data_teste_diagnostico: '',
                                            hora_fechamento: '23:59', fecho_automatico_inscricoes: false
                                        });
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
                                background: 'var(--primary-light-bg)',
                                border: '1px solid var(--config-accent)',
                                padding: '28px'
                            }}>
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <div
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            background: 'linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 12px var(--primary-shadow)'
                                        }}
                                    >
                                        <Calendar size={22} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0c4a6e' }}>
                                            {isEditingYear ? 'Editar Ano Lectivo' : 'Novo Ano Lectivo'}
                                        </h3>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--primary-color)' }}>
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
                                    border: '1px solid var(--primary-light-bg)'
                                }}>
                                    <div className="config-group-v2">
                                        <label style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px',
                                            fontWeight: '600',
                                            color: 'var(--primary-color)',
                                            marginBottom: '8px',
                                            fontSize: '14px'
                                        }}>
                                            <span style={{ 
                                                width: '20px', 
                                                height: '20px', 
                                                background: 'var(--primary-light-bg)', 
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                color: 'var(--primary-color)'
                                            }}>1</span>
                                            Nome do Ano Lectivo
                                        </label>
                                        <input 
                                            type="text" 
                                            className="input-v2"
                                            style={{ 
                                                border: '2px solid var(--primary-light-bg)',
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
                                            color: 'var(--primary-color)',
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

                                    {/* NOVAS DATAS DE AGENDAMENTO (INSCRIÇÕES) */}
                                    <div className="config-group-v2" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                                        <h4 style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '4px', height: '14px', background: 'var(--primary-color)', borderRadius: '2px' }}></div>
                                            Cronograma de Inscrições e Matrículas
                                        </h4>
                                    </div>

                                    <div className="config-group-v2">
                                        <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>Início das Inscrições</label>
                                        <input 
                                            type="date" 
                                            className="input-v2"
                                            value={newYear.inicio_inscricoes}
                                            onChange={(e) => setNewYear({...newYear, inicio_inscricoes: e.target.value})}
                                        />
                                    </div>
                                    <div className="config-group-v2">
                                        <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>Fim das Inscrições</label>
                                        <input 
                                            type="date" 
                                            className="input-v2"
                                            value={newYear.fim_inscricoes}
                                            onChange={(e) => setNewYear({...newYear, fim_inscricoes: e.target.value})}
                                        />
                                    </div>
                                    <div className="config-group-v2" style={{ opacity: 0, pointerEvents: 'none' }}>
                                        {/* Spacer to keep 3 col grid consistent */}
                                    </div>

                                    <div className="config-group-v2">
                                        <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>Início das Matrículas</label>
                                        <input 
                                            type="date" 
                                            className="input-v2"
                                            value={newYear.inicio_matriculas}
                                            onChange={(e) => setNewYear({...newYear, inicio_matriculas: e.target.value})}
                                        />
                                    </div>
                                    <div className="config-group-v2">
                                        <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>Fim das Matrículas</label>
                                        <input 
                                            type="date" 
                                            className="input-v2"
                                            value={newYear.fim_matriculas}
                                            onChange={(e) => setNewYear({...newYear, fim_matriculas: e.target.value})}
                                        />
                                    </div>
                                    <div className="config-group-v2" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                                        <h4 style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '4px', height: '14px', background: 'var(--primary-color)', borderRadius: '2px' }}></div>
                                            Exames e Testes
                                        </h4>
                                    </div>

                                    <div className="config-group-v2">
                                        <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>Exame de Admissão</label>
                                        <input 
                                            type="date" 
                                            className="input-v2"
                                            value={newYear.data_exame_admissao}
                                            onChange={(e) => setNewYear({...newYear, data_exame_admissao: e.target.value})}
                                        />
                                    </div>
                                    <div className="config-group-v2">
                                        <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>Teste de Diagnóstico</label>
                                        <input 
                                            type="date" 
                                            className="input-v2"
                                            value={newYear.data_teste_diagnostico}
                                            onChange={(e) => setNewYear({...newYear, data_teste_diagnostico: e.target.value})}
                                        />
                                    </div>
                                    <div className="config-group-v2" style={{ opacity: 0, pointerEvents: 'none' }}>
                                        {/* Spacer */}
                                    </div>

                                    <div className="config-group-v2" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                                        <h4 style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '4px', height: '14px', background: 'var(--warning-color, #f59e0b)', borderRadius: '2px' }}></div>
                                            Horários e Automatismos
                                        </h4>
                                    </div>

                                    <div className="config-group-v2">
                                        <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>Hora de Fechamento</label>
                                        <input 
                                            type="time" 
                                            className="input-v2"
                                            value={newYear.hora_fechamento}
                                            onChange={(e) => setNewYear({...newYear, hora_fechamento: e.target.value})}
                                        />
                                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Hora que as inscrições encerram no dia limite</span>
                                    </div>

                                    <div className="config-group-v2" style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px', fontSize: '14px', display: 'block' }}>
                                            Encerramento Automático
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <label className="switch-premium">
                                                <input 
                                                    type="checkbox" 
                                                    checked={newYear.fecho_automatico_inscricoes}
                                                    onChange={(e) => setNewYear({...newYear, fecho_automatico_inscricoes: e.target.checked})}
                                                />
                                                <span className="slider-premium round"></span>
                                            </label>
                                            <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                                Encerrar inscrições online automaticamente ao atingir o prazo
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'flex-end', 
                                    gap: '12px', 
                                    marginTop: '20px',
                                    paddingTop: '20px',
                                    borderTop: '1px solid var(--primary-light-bg)'
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
                                            background: 'linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%)',
                                            color: 'white',
                                            border: 'none',
                                            boxShadow: '0 4px 12px var(--primary-shadow)'
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
                                                    background: 
                                                        year.status === 'Activo' ? '#dcfce7' : 
                                                        year.status === 'Planeado' ? '#eff6ff' : 
                                                        year.status === 'Suspenso' ? '#fff7ed' : '#fee2e2',
                                                    color: 
                                                        year.status === 'Activo' ? '#15803d' : 
                                                        year.status === 'Planeado' ? '#2563eb' : 
                                                        year.status === 'Suspenso' ? '#c2410c' : '#ef4444',
                                                    fontWeight: '700'
                                                }}>
                                                    {year.status?.toUpperCase() || (year.activo ? 'ACTIVO' : 'ENCERRADO')}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {year.status !== 'Activo' ? (
                                                        <button 
                                                            onClick={() => handleToggleActiveYear(year.id_ano, year.activo)}
                                                            className="btn-premium btn-secondary-premium"
                                                            style={{ 
                                                                padding: '6px 12px', 
                                                                fontSize: '12px', 
                                                                opacity: isAdmin ? 1 : 0.5, 
                                                                cursor: isAdmin ? 'pointer' : 'not-allowed',
                                                                background: year.status === 'Planeado' ? 'var(--primary-color)' : '',
                                                                color: year.status === 'Planeado' ? 'white' : ''
                                                            }}
                                                            title={isAdmin ? (year.status === 'Planeado' ? "Abrir Ano Lectivo" : "Reabrir Ano Lectivo") : "Apenas Administradores podem realizar esta acção"}
                                                            disabled={!isAdmin}
                                                        >
                                                            {year.status === 'Planeado' ? 'Abrir' : 
                                                             year.status === 'Suspenso' ? 'Activar' : 'Reabrir'}
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleCloseYear(year.id_ano)}
                                                            className="btn-premium"
                                                            style={{ 
                                                                padding: '6px 12px', 
                                                                fontSize: '12px', 
                                                                background: '#fef2f2', 
                                                                color: '#ef4444', 
                                                                border: '1px solid #fee2e2',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <Archive size={14} /> Encerrar
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

                        {/* Paginação para Anos Lectivos */}
                        {yearTotalPages > 1 && (
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                gap: '15px', 
                                marginTop: '20px',
                                background: 'white',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <button 
                                    onClick={() => fetchAcademicYears(yearCurrentPage - 1)}
                                    disabled={yearCurrentPage === 1}
                                    style={{
                                        background: yearCurrentPage === 1 ? '#f8fafc' : 'white',
                                        border: '1px solid #e2e8f0',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        cursor: yearCurrentPage === 1 ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: yearCurrentPage === 1 ? '#94a3b8' : '#1e293b'
                                    }}
                                >
                                    Anterior
                                </button>
                                
                                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary-color)' }}>
                                    Página {yearCurrentPage} de {yearTotalPages}
                                </span>

                                <button 
                                    onClick={() => fetchAcademicYears(yearCurrentPage + 1)}
                                    disabled={yearCurrentPage === yearTotalPages}
                                    style={{
                                        background: yearCurrentPage === yearTotalPages ? '#f8fafc' : 'white',
                                        border: '1px solid #e2e8f0',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        cursor: yearCurrentPage === yearTotalPages ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: yearCurrentPage === yearTotalPages ? '#94a3b8' : '#1e293b'
                                    }}
                                >
                                    Próximo
                                </button>
                            </div>
                        )}

                        <div className="section-title-v2" style={{ marginTop: '48px', marginBottom: '24px' }}>
                            <div className="icon-circle" style={{ background: 'var(--primary-light-bg)', color: 'var(--primary-color)' }}>
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
                                <div style={{ display: 'flex', gap: '12px' }}>
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
                            </div>

                            {/* Redundant date fields removed - now managed in Academic Year schedule */}
                            
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
                                        border: '2px solid var(--warning-color, #fde047)',
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
                                            background: 'linear-gradient(135deg, var(--warning-color, #f59e0b) 0%, var(--warning-dark, #d97706) 100%)',
                                            color: 'white',
                                            border: 'none',
                                            boxShadow: '0 4px 12px var(--warning-shadow, rgba(245, 158, 11, 0.3))'
                                        }}
                                    >
                                        <Save size={18} /> Salvar Mensagem
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'ajuda':
                return (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <div className="section-title-v2">
                            <div className="icon-circle" style={{ background: 'var(--primary-light-bg)', color: 'var(--primary-color)' }}>
                                <HelpCircle size={24} />
                            </div>
                            <div>
                                <h2>Centro de Ajuda e Suporte</h2>
                                <p>Encontre respostas para suas dúvidas e suporte técnico.</p>
                            </div>
                        </div>

                        <div className="help-grid-v2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
                            <div className="info-card-v2">
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Documentação do Sistema</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                                    Aceda ao manual completo do utilizador para aprender a gerir alunos, turmas, matrículas e relatórios financeiros.
                                </p>
                                <button className="btn-premium btn-secondary-premium" style={{ marginTop: '12px', width: '100%' }}>
                                    <FileText size={18} /> Ver Manual PDF
                                </button>
                            </div>

                            <div className="info-card-v2">
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Suporte Técnico</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                                    Enfrentando problemas técnicos ou erros inesperados? Nossa equipa está pronta para ajudar.
                                </p>
                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--primary-color)' }}>
                                        <Bell size={16} /> suporte@escola.ao
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--primary-color)' }}>
                                        <Info size={16} /> +244 9XX XXX XXX
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="info-card-v2" style={{ marginTop: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Perguntas Frequentes (FAQ)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <details style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                                    <summary style={{ fontWeight: 600, fontSize: '14px' }}>Como redefinir a senha de um usuário?</summary>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Vá em Segurança, edite o usuário e preencha o campo "Definir Senha".</p>
                                </details>
                                <details style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                                    <summary style={{ fontWeight: 600, fontSize: '14px' }}>Como encerrar o ano lectivo?</summary>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Na aba Académico, clique no botão "Encerrar" ao lado do ano lectivo activo. Isso bloqueará novas matrículas para esse período.</p>
                                </details>
                                <details style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                                    <summary style={{ fontWeight: 600, fontSize: '14px' }}>Como configurar as vagas por curso?</summary>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Aceda ao menu principal 'Vagas por Curso'. Escolha o ano lectivo e defina o número total de vagas para cada curso oferecido pela instituição.</p>
                                </details>
                                <details style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                                    <summary style={{ fontWeight: 600, fontSize: '14px' }}>Onde encontro a lista de candidatos reprovados na lista de espera?</summary>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Vá ao menu 'Lista de Espera'. Lá pode adicionar candidatos que não entraram na primeira fase mas que podem ser chamados posteriormente.</p>
                                </details>
                                <details style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                                    <summary style={{ fontWeight: 600, fontSize: '14px' }}>Como exportar a ficha de matrícula em PDF?</summary>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Na lista de Matrículas, use o botão de acções e selecione "Imprimir Ficha". O sistema gerará o documento pronto para assinatura.</p>
                                </details>
                                <details style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                                    <summary style={{ fontWeight: 600, fontSize: '14px' }}>O que acontece ao suspender o portal de candidaturas?</summary>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>O público externo não poderá enviar novas inscrições. Eles verão apenas a mensagem personalizada definida na aba 'Académico'.</p>
                                </details>
                            </div>
                        </div>
                    </div>
                );
            case 'logs':
                return (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <div className="section-title-v2">
                            <div className="icon-circle" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                <Activity size={24} />
                            </div>
                            <div>
                                <h2>Logs de Auditoria</h2>
                                <p>Registo completo de sessões e acções realizadas no sistema.</p>
                            </div>
                        </div>

                        {/* Resumo Cards */}
                        {logsResumo && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                                {[
                                    { label: 'Acções Hoje', value: logsResumo.accoes_hoje, icon: <Activity size={18}/>, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                                    { label: 'Logins Hoje', value: logsResumo.logins_hoje, icon: <LogIn size={18}/>, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                                    { label: 'Sessões Activas', value: logsResumo.sessoes_activas, icon: <Clock size={18}/>, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                                ].map((c, i) => (
                                    <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{c.label}</p>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>{c.value ?? '—'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sub-tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
                            {[{ key: 'logins', label: 'Sessões de Login', icon: <LogIn size={16}/> }, { key: 'actividades', label: 'Acções do Sistema', icon: <Activity size={16}/> }].map(t => (
                                <button key={t.key} onClick={() => { setLogsTab(t.key); setLogsPage(1); fetchLogs(1, t.key); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                                        background: logsTab === t.key ? 'white' : 'transparent',
                                        color: logsTab === t.key ? '#3b82f6' : '#64748b',
                                        borderBottom: logsTab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
                                        marginBottom: '-2px'
                                    }}>{t.icon}{t.label}</button>
                            ))}
                        </div>

                        {/* Filtros */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input placeholder="Pesquisar..." value={logsFilter.busca}
                                    onChange={e => setLogsFilter(f => ({...f, busca: e.target.value}))}
                                    style={{ width: '100%', paddingLeft: '38px', padding: '10px 12px 10px 38px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                            </div>
                            <input type="date" value={logsFilter.data_inicio} onChange={e => setLogsFilter(f => ({...f, data_inicio: e.target.value}))}
                                style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#475569' }} />
                            <input type="date" value={logsFilter.data_fim} onChange={e => setLogsFilter(f => ({...f, data_fim: e.target.value}))}
                                style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#475569' }} />
                            <button onClick={() => fetchLogs(1, logsTab, logsFilter)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                                <Search size={15}/> Filtrar
                            </button>
                            <button onClick={() => { const f = { busca: '', data_inicio: '', data_fim: '', tipo: 'all' }; setLogsFilter(f); fetchLogs(1, logsTab, f); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                                <RefreshCw size={15}/> Limpar
                            </button>
                        </div>

                        {/* Tabela */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            {logsLoading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                                    <p style={{ margin: 0 }}>A carregar registos...</p>
                                </div>
                            ) : logsData.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    <Activity size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                                    <p style={{ margin: 0, fontWeight: 500 }}>Nenhum registo encontrado.</p>
                                </div>
                            ) : logsTab === 'logins' ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            {['Utilizador', 'Tipo', 'IP', 'Entrada', 'Saída', 'Duração', 'Estado'].map(h => (
                                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logsData.map((row, i) => (
                                            <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{row.utilizador}</td>
                                                <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#eff6ff', color: '#2563eb' }}>{row.tipo_utilizador}</span></td>
                                                <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace' }}>{row.ip}</td>
                                                <td style={{ padding: '12px 16px', color: '#475569' }}>{row.entrada}</td>
                                                <td style={{ padding: '12px 16px', color: '#475569' }}>{row.saida}</td>
                                                <td style={{ padding: '12px 16px', color: '#64748b' }}>{row.duracao}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: row.sessao_activa ? 'rgba(16,185,129,0.1)' : '#f1f5f9', color: row.sessao_activa ? '#059669' : '#94a3b8' }}>
                                                        {row.sessao_activa ? '● Activo' : 'Encerrado'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            {['Data/Hora', 'Utilizador', 'Acção'].map(h => (
                                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logsData.map((row, i) => {
                                            const isCreate = row.tipo_accao.toLowerCase().includes('criou');
                                            const isDelete = row.tipo_accao.toLowerCase().includes('eliminou');
                                            const isUpdate = row.tipo_accao.toLowerCase().includes('actualizou');
                                            
                                            let badgeColor = '#64748b';
                                            let badgeBg = '#f1f5f9';
                                            if (isCreate) { badgeColor = '#059669'; badgeBg = '#ecfdf5'; }
                                            if (isDelete) { badgeColor = '#dc2626'; badgeBg = '#fef2f2'; }
                                            if (isUpdate) { badgeColor = '#2563eb'; badgeBg = '#eff6ff'; }

                                            return (
                                                <tr key={row.id} 
                                                    onClick={() => setSelectedLog(row)}
                                                    style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa', cursor: 'pointer', transition: 'background 0.2s' }}
                                                    className="log-row-hover"
                                                >
                                                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '12px' }}>{row.data_hora}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{row.actor}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: badgeBg, color: badgeColor, border: `1px solid ${badgeBg}` }}>
                                                                {row.tipo_accao}
                                                            </span>
                                                            <button style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '11px', fontWeight: 700 }}>Detalhes</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Paginação */}
                        {logsTotalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 4px' }}>
                                <span style={{ fontSize: '13px', color: '#64748b' }}>Total: {logsTotal} registos</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button disabled={logsPage <= 1} onClick={() => { setLogsPage(p => p-1); fetchLogs(logsPage-1, logsTab); }}
                                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: logsPage <= 1 ? '#f8fafc' : 'white', cursor: logsPage <= 1 ? 'not-allowed' : 'pointer', color: '#64748b' }}>
                                        <ChevronLeft size={16}/>
                                    </button>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Pág. {logsPage} de {logsTotalPages}</span>
                                    <button disabled={logsPage >= logsTotalPages} onClick={() => { setLogsPage(p => p+1); fetchLogs(logsPage+1, logsTab); }}
                                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: logsPage >= logsTotalPages ? '#f8fafc' : 'white', cursor: logsPage >= logsTotalPages ? 'not-allowed' : 'pointer', color: '#64748b' }}>
                                        <ChevronRightIcon size={16}/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="config-page">
            {renderLogDetailsModal()}
            <header className="config-header-v2">
                <h1>Configurações do Sistema</h1>
                <p>Gerencie as preferências, segurança e manutenção da plataforma escolar.</p>
            </header>

            <div className="config-layout-v2">
                {/* Sidebar V2 */}
                <aside className="config-sidebar-v2">
                    {canManageMaintenance && (
                        <button
                            className={`config-nav-item ${activeTab === 'manutencao' ? 'active' : ''}`}
                            onClick={() => setActiveTab("manutencao")}
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
                            className={activeTab === "seguranca" ? "config-nav-item active" : "config-nav-item"}
                            onClick={() => setActiveTab("seguranca")}
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
                        className={`config-nav-item ${activeTab === 'ajuda' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ajuda')}
                    >
                        <HelpCircle size={20} /> Ajuda
                    </button>
                    {canViewLogs && (
                        <button
                            className={`config-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('logs')}
                        >
                            <Activity size={20} /> Logs
                        </button>
                    )}
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
