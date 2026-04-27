import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Alunos.css';
import './AlunosTableResponsive.css';

import {
    Search,
    Plus,
    Filter,
    MoreVertical,
    X,
    User,
    BookOpen,
    Home,
    Clock,
    Calendar,
    Phone,
    Mail,
    MapPin,
    ClipboardList,
    ChevronRight,
    ShieldCheck,
    GraduationCap,
    Eye,
    Edit,
    ChevronDown,
    ArrowUp,
    ArrowDown,
    CheckCircle,
    AlertCircle,
    UserX,
    UserCheck,
    RefreshCw,
    Users,
    Activity,
    ArrowRightLeft,
    ArrowUpRight,
    Database,
    Upload
} from 'lucide-react';

import Pagination from '../../components/Common/Pagination';
import FilterModal from '../../components/Common/FilterModal';
import api from '../../services/api';
import { parseApiError } from '../../utils/errorParser';

import { useDataCache } from '../../hooks/useDataCache';
import { useCache } from '../../context/CacheContext';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';

const Alunos = () => {
    const navigate = useNavigate();
    const { clearCache } = useCache();
    const { hasPermission } = usePermission();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [showStatusSubmenu, setShowStatusSubmenu] = useState(false); // Valid state for submenu
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [menuStudent, setMenuStudent] = useState(null);
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(0);
    const filterButtonRef = useRef(null);
    // Estado do modal de edição de dados pessoais
    const [showEditModal, setShowEditModal] = useState(false);
    const [editPersonalData, setEditPersonalData] = useState(null);
    const [isSavingPersonal, setIsSavingPersonal] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        bi: '',
        genero: '',
        data_nascimento: '',
        nacionalidade: 'Angolana',
        naturalidade: '',
        deficiencia: 'Não',
        email: '',
        telefone: '',
        provincia: '',
        municipio: '',
        bairro: '',
        numero_casa: '',
        foto: null,
        enc_nome: '',
        enc_bi: '',
        enc_telefone: '',
        enc_email: '',
        enc_profissao: '',
        enc_parentesco: 'Pai',
        id_curso: '',
        id_classe: '',
        id_sala: '',
        id_periodo: '',
        id_turma: '',
        status: 'Ativo'
    });
    const [fotoPreview, setFotoPreview] = useState(null);
    const tableRef = useRef(null);
    const dropdownRef = useRef(null); // Ref for the dropdown menu

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(23);

    const statusMenuTimeoutRef = useRef(null);

    const handleStatusEnter = () => {
        if (statusMenuTimeoutRef.current) {
            clearTimeout(statusMenuTimeoutRef.current);
        }
        setShowStatusSubmenu(true);
    };

    const handleStatusLeave = () => {
        statusMenuTimeoutRef.current = setTimeout(() => {
            setShowStatusSubmenu(false);
        }, 300); // 300ms grace period to allow mouse movement
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // If menu is open AND click is OUTSIDE the dropdown container
            if (activeMenuId && 
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target)) {
                
                setActiveMenuId(null);
                setMenuStudent(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeMenuId]);

    // Close menu on scroll to prevent floating menu - ENABLED for better UX
    useEffect(() => {
        const handleScroll = () => {
             if (activeMenuId) {
                 setActiveMenuId(null);
                 setMenuStudent(null);
                 setShowStatusSubmenu(false);
             }
        };
        // Listen on capturing phase to catch scrolls in nested containers
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [activeMenuId]);



    // Filters State
    const [filters, setFilters] = useState({
        ano: '',
        sala: '',
        curso: '',
        turma: '',
        classe: ''
    });

    // State for filter options
    const [anosDisponiveis, setAnosDisponiveis] = useState([]);
    const [classesDisponiveis, setClassesDisponiveis] = useState([]);
    const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
    const [salasDisponiveis, setSalasDisponiveis] = useState([]);
    const [turmasDisponiveis, setTurmasDisponiveis] = useState([]);

    // Fetch filter options
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [anosRes, classesRes, cursosRes, salasRes, turmasRes] = await Promise.all([
                    api.get('anos-lectivos/?all=true'),
                    api.get('classes/'),
                    api.get('cursos/'),
                    api.get('salas/'),
                    api.get('turmas/?page_size=5000')
                ]);

                if (anosRes.data?.results || Array.isArray(anosRes.data)) 
                    setAnosDisponiveis(anosRes.data?.results || anosRes.data);
                
                if (classesRes.data?.results || Array.isArray(classesRes.data)) 
                    setClassesDisponiveis(classesRes.data?.results || classesRes.data);

                if (cursosRes.data?.results || Array.isArray(cursosRes.data)) 
                    setCursosDisponiveis(cursosRes.data?.results || cursosRes.data);

                if (salasRes.data?.results || Array.isArray(salasRes.data)) 
                    setSalasDisponiveis(salasRes.data?.results || salasRes.data);

                if (turmasRes.data?.results || Array.isArray(turmasRes.data)) {
                    const allTurmas = turmasRes.data?.results || turmasRes.data;
                    // Mostrar TODAS as turmas nos filtros (incluindo anos anteriores)
                    setTurmasDisponiveis(allTurmas);
                }

            } catch (err) {
                console.error("Erro ao buscar opções de filtros:", err);
            }
        };
        fetchFilterOptions();
    }, []);

    // Centralized mapping for API -> Frontend format
    const mapStudentFromApi = (student) => {
        // Se o backend enviar numero_matricula, usamos como prioridade para determinar se está matriculado
        const isMatriculado = !!student.numero_matricula;
        
        return {
            id: student.id_aluno,
            matricula: student.numero_matricula,
            real_id: (student.matriculas_detalhes && student.matriculas_detalhes.length > 0) ? student.matriculas_detalhes[0].id_matricula : null,
            nome: student.nome_completo,
            foto: student.img_path,
            anoLectivo: isMatriculado ? (student.ano_lectivo || 'N/A') : 'Não Matriculado',
            anoLectivoAtivo: student.ano_lectivo_ativo,
            classe: isMatriculado ? (student.classe_nivel ? `${student.classe_nivel}\u00aa Classe` : 'N/A') : '---',
            curso: isMatriculado ? (student.curso_nome || 'N/A') : '---',
            sala: isMatriculado ? (student.sala_numero ? `Sala ${student.sala_numero}` : 'N/A') : '---',
            turno: isMatriculado ? (student.periodo_nome || 'N/A') : '---',
            turma: isMatriculado ? (student.turma_codigo || 'N/A') : '---',
            status: student.status_aluno === 'Activo' ? 'Ativo' : student.status_aluno,
            sugeridoTipo: null,
            dataMatricula: student.criado_em ? new Date(student.criado_em).toLocaleDateString() : 'N/A',
            genero: student.genero || 'N/A',
            dataCadastro: student.criado_em ? new Date(student.criado_em).toLocaleDateString() : 'N/A',
            detalhes: {
                nascimento: student.data_nascimento || 'N/A',
                encarregado: student.encarregado_principal || (student.encarregados && student.encarregados.length > 0 ? student.encarregados[0] : null),
                telefone: student.telefone || 'N/A',
                email: student.email,
                endereco: `${student.municipio_residencia || ''}, ${student.provincia_residencia || ''}`,
                bi: student.numero_bi,
                nacionalidade: student.nacionalidade || 'Angolana',
                naturalidade: student.naturalidade || 'N/A',
                deficiencia: student.deficiencia || 'Não',
                bairro: student.bairro_residencia || 'N/A',
                numeroCasa: student.numero_casa || 'N/A',
                provincia: student.provincia_residencia || 'N/A',
                municipio: student.municipio_residencia || 'N/A',
                obs: '',
                historico: student.historico_escolar || [],
                historicoMatriculas: student.matriculas_detalhes || []
            }
        };
    };

    // Data Fetcher
    const fetchStudentsData = async () => {
        try {
            const response = await api.get('alunos/?page_size=5000');
            const data = response?.data;
            const results = data.results || (Array.isArray(data) ? data : []);
            
            return results.map(mapStudentFromApi);
        } catch (error) {
            console.error("Erro ao carregar alunos:", error);
            throw error;
        }
    };

    const { 
        data: students = [], 
        loading, 
        error,
        refresh,
        update: updateStudent
    } = useDataCache('alunos', fetchStudentsData);

    // Polling Inteligente para atualizações em tempo real (Silent Refresh)
    useEffect(() => {
        const syncIfVisible = () => {
            if (!document.hidden) {
                refresh(true); 
            }
        };

        const interval = setInterval(syncIfVisible, 30000); // 30 segundos para tempo real (Smart Cache)
        
        window.addEventListener('focus', syncIfVisible);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', syncIfVisible);
        };
    }, [refresh]);


    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ ano: '', sala: '', curso: '', turma: '', classe: '' });
        setCurrentPage(1);
    };

    const handleUpdateStatus = async (studentId, newStatus) => {
        if (!studentId) {
            console.error("ID do aluno inválido");
            return;
        }

        console.log(`Atualizando status do aluno ${studentId} para ${newStatus}`);
        
        // Optimistic update
        updateStudent(studentId, { status: newStatus });
        setActiveMenuId(null);
        setMenuStudent(null);
        setShowStatusSubmenu(false);

        try {
            // Call API
            const response = await api.patch(`alunos/${studentId}/update_status/`, { status_aluno: newStatus });
                     if (response.status === 200 || response.status === 204) {
                 console.log("Status atualizado com sucesso no backend:", response.data);
                 
                 const updatedStatus = response.data?.status_aluno || newStatus;
                 
                 // Sync with open modal if it's the same student
                 if (selectedStudent && selectedStudent.id === studentId) {
                     setSelectedStudent(prev => ({
                         ...prev,
                         status: updatedStatus
                     }));
                 }

                 // Mantém a tabela rápida! Atualiza apenas o registo no cache frontend sem ir buscar tudo à BD.
                 updateStudent(studentId, { status: updatedStatus });
                 
                 // Notificação de sucesso simplificada
                 alert(`Estado do aluno alterado para '${updatedStatus}' com sucesso!`);
                 
            } else {
                 throw new Error(`Resposta inesperada: ${response.status}`);
            }
        } catch (err) {
            console.error("Erro ao atualizar estado do aluno:", err);
            // Revert optimistic update gracefully without freezing the table
            const cacheBackup = JSON.parse(localStorage.getItem('alunos_v2') || '[]');
            const oldStatus = cacheBackup.find(a => a.id === studentId)?.status;
            if(oldStatus) updateStudent(studentId, { status: oldStatus }); 
            // Mostra o erro do backend se houver (para vermos se algo de facto falhou)
            alert("Não foi possível atualizar o estado. Motivo: " + (err.response?.data?.error || "Desconhecido."));
        }
    };

    const handleEdit = (student) => {
        // Abre modal de edição de dados pessoais directamente
        setEditPersonalData({
            id: student.id,
            nome_completo: student.nome,
            genero: student.genero,
            data_nascimento: student.detalhes.nascimento !== 'N/A' ? student.detalhes.nascimento : '',
            numero_bi: student.detalhes.bi || '',
            nacionalidade: student.detalhes.nacionalidade || 'Angolana',
            naturalidade: student.detalhes.naturalidade !== 'N/A' ? student.detalhes.naturalidade : '',
            deficiencia: student.detalhes.deficiencia || 'Não',
            email: student.detalhes.email || '',
            telefone: student.detalhes.telefone !== 'N/A' ? student.detalhes.telefone : '',
            provincia: student.detalhes.provincia !== 'N/A' ? student.detalhes.provincia : '',
            municipio: student.detalhes.municipio !== 'N/A' ? student.detalhes.municipio : '',
            bairro: student.detalhes.bairro !== 'N/A' ? student.detalhes.bairro : '',
            numero_casa: student.detalhes.numeroCasa !== 'N/A' ? student.detalhes.numeroCasa : '',
            foto: student.foto,
            // Dados do Encarregado (Suporta formatos de lista e detalhe unificados)
            encarregado_id: student.detalhes.encarregado?.id_encarregado || student.detalhes.encarregado?.id || null,
            encarregado_nome: student.detalhes.encarregado?.nome_completo || student.detalhes.encarregado?.nome || '',
            encarregado_telefone: student.detalhes.encarregado?.telefone || '',
            encarregado_email: student.detalhes.encarregado?.email || '',
            encarregado_bi: student.detalhes.encarregado?.numero_bi || '',
            encarregado_profissao: student.detalhes.encarregado?.profissao || '',
            encarregado_parentesco: student.detalhes.encarregado?.grau_parentesco || student.detalhes.encarregado?.parentesco || ''
        });
        setShowEditModal(true);
    };

    const handleSavePersonalData = async () => {
        if (!editPersonalData) return;
        setIsSavingPersonal(true);
        try {
            const payload = {
                nome_completo: editPersonalData.nome_completo,
                genero: editPersonalData.genero,
                data_nascimento: editPersonalData.data_nascimento || null,
                numero_bi: editPersonalData.numero_bi,
                nacionalidade: editPersonalData.nacionalidade,
                naturalidade: editPersonalData.naturalidade,
                deficiencia: editPersonalData.deficiencia,
                email: editPersonalData.email,
                telefone: editPersonalData.telefone,
                provincia_residencia: editPersonalData.provincia,
                municipio_residencia: editPersonalData.municipio,
                bairro_residencia: editPersonalData.bairro,
                numero_casa: editPersonalData.numero_casa,
                // Encarregado
                encarregado_data: {
                    id: editPersonalData.encarregado_id,
                    nome: editPersonalData.encarregado_nome,
                    telefone: editPersonalData.encarregado_telefone,
                    email: editPersonalData.encarregado_email,
                    numero_bi: editPersonalData.encarregado_bi,
                    profissao: editPersonalData.encarregado_profissao,
                    parentesco: editPersonalData.encarregado_parentesco
                }
            };
            
            const res = await api.patch(`alunos/${editPersonalData.id}/update_dados_pessoais/`, payload);
            
            if (res.status === 200) {
                // Mapear os dados atualizados vindos do backend
                const updatedStudent = mapStudentFromApi(res.data);
                
                // Actualizar o cache local imediatamente com o objecto completo
                updateStudent(updatedStudent.id, updatedStudent);
                
                // Actualizar selectedStudent se for o mesmo aluno
                if (selectedStudent && selectedStudent.id === updatedStudent.id) {
                    setSelectedStudent(updatedStudent);
                }
                
                setShowEditModal(false);
                setEditPersonalData(null);
                alert(`Dados pessoais de ${updatedStudent.nome} actualizados com sucesso!`);
                
                clearCache('alunos'); // Trigger reactive update via Smart Cache
            }
        } catch (err) {
            console.error('Erro ao salvar dados pessoais:', err);
            alert('Não foi possível salvar. Motivo: ' + (err.response?.data?.detail || err.response?.data?.numero_bi?.[0] || JSON.stringify(err.response?.data || 'Erro desconhecido')));
        } finally {
            setIsSavingPersonal(false);
        }
    };

    const handleAdd = () => {
        setModalMode('add');
        setSelectedStudentId(null);
        setFotoPreview(null);
        setFormData({
            nome: '',
            bi: '',
            genero: '',
            data_nascimento: '',
            nacionalidade: 'Angolana',
            naturalidade: '',
            deficiencia: 'Não',
            email: '',
            telefone: '',
            provincia: '',
            municipio: '',
            bairro: '',
            numero_casa: '',
            foto: null,
            enc_nome: '',
            enc_bi: '',
            enc_telefone: '',
            enc_email: '',
            enc_profissao: '',
            enc_parentesco: 'Pai',
            id_curso: '',
            id_classe: '',
            id_sala: '',
            id_periodo: '',
            id_turma: '',
            status: 'Ativo'
        });
        setShowModal(true);
    };

    const handleGuardianBiBlur = async () => {
        if (formData.enc_bi && formData.enc_bi.length > 5) {
            try {
                // Procurar encarregado pelo BI
                const res = await api.get(`encarregados/?search=${formData.enc_bi}`);
                const encs = res.data.results || res.data;
                const found = encs.find(e => e.numero_bi === formData.enc_bi);
                
                if (found) {
                    setFormData(prev => ({
                        ...prev,
                        enc_nome: found.nome_completo || found.nome || prev.enc_nome,
                        enc_telefone: found.telefone?.[0] || found.telefone || prev.enc_telefone,
                        enc_email: found.email || prev.enc_email,
                        enc_profissao: found.profissao || prev.enc_profissao
                    }));
                }
            } catch (err) {
                console.log("Encarregado não encontrado ou erro na busca:", err);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (!formData.nome || !formData.bi) {
                alert("Nome e BI são obrigatórios.");
                return;
            }

            // Use FormData to support photo upload
            const fd = new FormData();
            fd.append('nome_completo', formData.nome);
            fd.append('numero_bi', formData.bi);
            if (formData.genero) fd.append('genero', formData.genero);
            if (formData.data_nascimento) fd.append('data_nascimento', formData.data_nascimento);
            fd.append('nacionalidade', formData.nacionalidade || 'Angolana');
            if (formData.naturalidade) fd.append('naturalidade', formData.naturalidade);
            fd.append('deficiencia', formData.deficiencia || 'Não');
            if (formData.email) fd.append('email', formData.email);
            if (formData.telefone) fd.append('telefone', formData.telefone);
            if (formData.provincia) fd.append('provincia_residencia', formData.provincia);
            if (formData.municipio) fd.append('municipio_residencia', formData.municipio);
            if (formData.bairro) fd.append('bairro_residencia', formData.bairro);
            if (formData.numero_casa) fd.append('numero_casa', formData.numero_casa);
            fd.append('status_aluno', formData.status || 'Ativo');
            if (formData.foto instanceof File) fd.append('img_path', formData.foto);

            // Enviar dados do encarregado junto com o aluno (o backend trata tudo atomicamente)
            if (formData.enc_nome) {
                fd.append('enc_nome', formData.enc_nome);
                if (formData.enc_bi) fd.append('enc_bi', formData.enc_bi);
                if (formData.enc_telefone) fd.append('enc_telefone', formData.enc_telefone);
                if (formData.enc_email) fd.append('enc_email', formData.enc_email);
                if (formData.enc_profissao) fd.append('enc_profissao', formData.enc_profissao);
                fd.append('enc_parentesco', formData.enc_parentesco || 'Pai');
            }

            if (modalMode === 'add') {
                const res = await api.post('alunos/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

                if (res.data?.encarregado_criado) {
                    alert(`✅ Aluno registrado com sucesso!\n\n👤 Encarregado "${res.data.encarregado_nome}" vinculado automaticamente.`);
                } else {
                    alert("✅ Aluno registrado com sucesso!");
                }
            } else {
                await api.patch(`alunos/${selectedStudentId}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                alert("Dados do aluno atualizados com sucesso!");
            }

            setShowModal(false);
            setFotoPreview(null);
            clearCache('alunos'); // Trigger reactive update via Smart Cache
        } catch (err) {
            console.error("Erro ao salvar aluno:", err);
            const msg = parseApiError(err, "Erro ao salvar aluno.");
            alert(msg);
        }
    };

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStudents = React.useMemo(() => {
        let sortableItems = (students || []).filter(student => {
            const matchesSearch =
                student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(student.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                (student.detalhes?.bi && student.detalhes.bi.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesFilters =
                (filters.ano === '' || student.anoLectivo === filters.ano) &&
                (filters.classe === '' || student.classe === filters.classe) &&
                (filters.curso === '' || student.curso === filters.curso) &&
                (filters.sala === '' || String(student.sala) === filters.sala) &&
                (filters.turma === '' || student.turma === filters.turma);

            return matchesSearch && matchesFilters;
        });

        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                
                // Handle nulls
                if (aValue === null) aValue = '';
                if (bValue === null) bValue = '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [students, searchTerm, filters, sortConfig]);

    const filteredStudents = sortedStudents;

    // Pagination Slicing
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

    const getStatusStyle = (status) => {
        if (!status) return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
        
        const s = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        
        if (s === 'inativo' || s === 'inativa') 
            return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' }; // Vermelho
            
        if (s === 'ativo' || s === 'ativa') 
            return { bg: '#d1fae5', color: '#16a34a', border: '#a7f3d0' }; // Verde
        
        if (s.includes('conclui')) 
            return { bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe' }; // Azul
            
        if (s.includes('transferid')) 
            return { bg: '#ffedd5', color: '#ea580c', border: '#fed7aa' }; // Laranja
            
        if (s.includes('desistente')) 
            return { bg: '#f3f4f6', color: '#64748b', border: '#e2e8f0' };

        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    };

    const getTipoMatriculaLabel = (tipo) => {
        const mapping = {
            'Novo': 'Novo Ingresso',
            'Confirmacao': 'Confirmação',
            'Transferencia': 'Transferência',
            'Repetente': 'Repetente',
            'Reenquadramento': 'Reenquadramento'
        };
        return mapping[tipo] || tipo;
    };

    // Filter Configurations
    const filterConfigs = useMemo(() => [
        { 
            key: 'ano', 
            label: 'Ano Lectivo', 
            icon: Calendar,
            options: anosDisponiveis.map(a => ({ value: a.nome, label: a.nome }))
        },
        { 
            key: 'classe', 
            label: 'Classe', 
            icon: BookOpen,
            options: classesDisponiveis.map(c => ({ value: c.nome_classe, label: c.nome_classe }))
        },
        { 
            key: 'curso', 
            label: 'Curso', 
            icon: BookOpen,
            options: cursosDisponiveis.map(c => ({ value: c.nome_curso, label: c.nome_curso }))
        },
        { 
            key: 'sala', 
            label: 'Sala', 
            icon: MapPin,
            options: salasDisponiveis.map(s => ({ value: `Sala ${s.numero_sala}`, label: `Sala ${s.numero_sala}` }))
        },
        { 
            key: 'turma', 
            label: 'Turma', 
            icon: Users,
            options: (() => {
                // Agrupar turmas por ano lectivo
                const turmasPorAno = {};
                turmasDisponiveis.forEach(t => {
                    const ano = t.ano_lectivo_nome || 'Sem Ano';
                    if (!turmasPorAno[ano]) turmasPorAno[ano] = [];
                    turmasPorAno[ano].push(t);
                });

                const sortedAnos = Object.keys(turmasPorAno).sort((a, b) => b.localeCompare(a));
                const finalOptions = [];
                const activeYearName = anosDisponiveis.find(a => a.activo)?.nome;

                // Primeiro o ano activo se houver
                if (activeYearName && turmasPorAno[activeYearName]) {
                    finalOptions.push({ label: `Ano Ativo: ${activeYearName}`, isHeader: true });
                    turmasPorAno[activeYearName]
                        .sort((a, b) => a.codigo_turma.localeCompare(b.codigo_turma))
                        .forEach(t => {
                            finalOptions.push({ 
                                value: t.codigo_turma, 
                                label: t.codigo_turma,
                                isHighlighted: true 
                            });
                        });
                }

                // Depois os outros anos
                sortedAnos.forEach(ano => {
                    if (ano === activeYearName) return;
                    finalOptions.push({ label: `Ano: ${ano}`, isHeader: true });
                    turmasPorAno[ano]
                        .sort((a, b) => a.codigo_turma.localeCompare(b.codigo_turma))
                        .forEach(t => {
                            finalOptions.push({ value: t.codigo_turma, label: t.codigo_turma });
                        });
                });

                return finalOptions;
            })()
        }
    ], [anosDisponiveis, classesDisponiveis, cursosDisponiveis, salasDisponiveis, turmasDisponiveis]);

    return (
        <div className="page-container alunos-page">
            <header className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1>Gestão de Estudantes</h1>
                        <p>Visualização e administração dos alunos registrados no sistema.</p>
                    </div>
                    <div className="page-header-actions">
                        {hasPermission(PERMISSIONS.CREATE_ALUNO) && (
                            <button
                                onClick={handleAdd}
                                className="btn-primary-action btn-new-student"
                            >
                                <Plus size={20} />
                                Novo Aluno
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="table-card" ref={tableRef}>
                {/* Search and Filters Header */}
                <div className="search-filter-header">
                    <div className="search-input-container">
                        <Search className="search-input-icon" size={20} aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou ID do aluno..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="search-input"
                            aria-label="Pesquisar alunos por nome ou ID"
                        />
                    </div>
                    <button
                        ref={filterButtonRef}
                        onClick={() => setShowFilters(true)}
                        className="btn-alternar-filtros"
                        aria-expanded={showFilters}
                        aria-label="Mostrar filtros"
                    >
                        <Filter size={18} aria-hidden="true" />
                        Filtros
                    </button>
                </div>

                {/* Filter Modal */}
                <FilterModal 
                    triggerRef={filterButtonRef}
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    filterConfigs={filterConfigs}
                    activeFilters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={resetFilters}
                />

                {/* Students Table */}
                {loading ? (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px', color: '#64748b'}}>
                        <div className="loading-spinner" style={{width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spinner 0.8s linear infinite'}}></div>
                        <span style={{fontWeight: 500}}>A carregar alunos...</span>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th 
                                        className={`sticky-col-1 sortable-header ${sortConfig.key === 'nome' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('nome')}
                                        style={{ minWidth: '240px' }}
                                    >
                                        Estudante
                                         <span className="sort-icon">
                                            {sortConfig.key === 'nome' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th 
                                        className={`sortable-header ${sortConfig.key === 'matricula' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('matricula')}
                                    >
                                        Nº Matrícula
                                         <span className="sort-icon">
                                            {sortConfig.key === 'matricula' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th 
                                        className={`sortable-header ${sortConfig.key === 'anoLectivo' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('anoLectivo')}
                                    >
                                        Ano Lectivo
                                         <span className="sort-icon">
                                            {sortConfig.key === 'anoLectivo' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th 
                                        className={`sortable-header ${sortConfig.key === 'classe' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('classe')}
                                    >
                                        Classe
                                         <span className="sort-icon">
                                            {sortConfig.key === 'classe' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th 
                                        className={`sortable-header ${sortConfig.key === 'curso' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('curso')}
                                    >
                                        Curso
                                         <span className="sort-icon">
                                            {sortConfig.key === 'curso' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th 
                                        className={`sortable-header ${sortConfig.key === 'sala' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('sala')}
                                    >
                                        Sala
                                         <span className="sort-icon">
                                            {sortConfig.key === 'sala' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th 
                                        className={`sortable-header ${sortConfig.key === 'turno' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('turno')}
                                    >
                                        Turno
                                         <span className="sort-icon">
                                            {sortConfig.key === 'turno' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th 
                                        className={`sortable-header ${sortConfig.key === 'turma' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('turma')}
                                    >
                                        Turma
                                         <span className="sort-icon">
                                            {sortConfig.key === 'turma' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th 
                                        className={`sortable-header ${sortConfig.key === 'status' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('status')}
                                    >
                                        Estado
                                         <span className="sort-icon">
                                            {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th style={{ textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {error ? (
                                    <tr>
                                        <td colSpan="10" style={{textAlign: 'center', padding: '40px', color: '#ef4444'}}>
                                            {typeof error === 'string' ? error : error?.message || "Erro ao carregar lista de alunos."}
                                        </td>
                                    </tr>
                                ) : currentStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                                            Nenhum aluno encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    currentStudents.map((s) => (
                                        <tr key={s.id} className="clickable-row animate-fade-in">
                                            <td className="sticky-col-1" data-label="Estudante">
                                                <div className="student-info">
                                                    <div className="student-avatar" style={{ 
                                                        width: '40px', 
                                                        height: '40px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        overflow: 'hidden',
                                                        borderRadius: '50%', // Perfectly circular
                                                        background: s.foto ? 'white' : 'var(--primary-light-bg)',
                                                        border: s.foto ? '1px solid #e2e8f0' : 'none'
                                                    }}>
                                                        {s.foto ? (
                                                            <img src={s.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <User size={18} color="var(--primary-color)" />
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                                        <span className="student-name" style={{ fontWeight: 700, color: '#0f172a' }}>{s.nome}</span>
                                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, fontFamily: 'monospace', marginTop: '2px' }}>
                                                            {s.detalhes?.bi || 'BI PENDENTE'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Nº Matrícula" style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color)' }}>
                                                {s.matricula || '---'}
                                            </td>
                                            <td data-label="Ano Lectivo">{s.anoLectivo}</td>
                                            <td data-label="Classe" style={{ fontWeight: 700 }}>{s.classe}</td>
                                            <td data-label="Curso" style={{ color: '#475569' }}>{s.curso}</td>
                                            <td data-label="Sala">{s.sala}</td>
                                            <td data-label="Turno">{s.turno}</td>
                                            <td data-label="Turma">{s.turma || 'N/A'}</td>
                                             <td data-label="Estado">
                                                 <span
                                                     className="student-status-badge"
                                                     style={{
                                                         background: getStatusStyle(s.status).bg,
                                                         color: getStatusStyle(s.status).color,
                                                         border: `1px solid ${getStatusStyle(s.status).border}`
                                                     }}
                                                 >
                                                     {s.status}
                                                 </span>
                                             </td>
                                             <td style={{ 
                                                 textAlign: 'center', 
                                                 position: 'relative',
                                                 zIndex: activeMenuId === s.id ? 100 : 1 
                                             }}>
                                                 <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                     <button 
                                                          className="btn-more-actions" 
                                                          onClick={() => { setSelectedStudent(s); setSelectedHistoryIndex(0); }}
                                                          title="Ver Detalhes"
                                                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}
                                                      >
                                                          <Eye size={20} />
                                                      </button>

                                                     <div className="actions-dropdown-container">
                                                         <button 
                                                             className="btn-more-actions" 
                                                             onClick={(e) => {
                                                                 e.preventDefault();
                                                                 e.stopPropagation();
                                                                 
                                                                 if (activeMenuId === s.id) {
                                                                     setActiveMenuId(null);
                                                                     setMenuStudent(null);
                                                                     setShowStatusSubmenu(false);
                                                                 } else {
                                                                     const rect = e.currentTarget.getBoundingClientRect();
                                                                     setMenuPosition({
                                                                         top: rect.bottom + 5,
                                                                         left: Math.max(10, Math.min(window.innerWidth - 220, rect.right - 210))
                                                                     });
                                                                     setMenuStudent(s);
                                                                     setActiveMenuId(s.id);
                                                                     setShowStatusSubmenu(false);
                                                                 }
                                                             }}
                                                             title="Mais Opções"
                                                             style={{ 
                                                                 display: 'inline-flex', 
                                                                 alignItems: 'center', 
                                                                 justifyContent: 'center',
                                                                 background: activeMenuId === s.id ? '#f1f5f9' : 'transparent',
                                                                 color: activeMenuId === s.id ? 'var(--primary-color)' : '#64748b'
                                                             }}
                                                         >
                                                             <MoreVertical size={20} />
                                                         </button>
                                                     </div>
                                                 </div>
                                             </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination 
                    totalItems={filteredStudents.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Student Detail Central Modal */}
            {selectedStudent && (
                <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
                    <div className="detail-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                setSelectedStudent(null);
                                setSelectedHistoryIndex(0);
                            }}
                            className="btn-close-modal">
                            <X size={24} color="#64748b" />
                        </button>

                        <div className="detail-modal-grid">
                            {/* LEFT SIDEBAR: EMERALD THEME */}
                            <div className="profile-sidebar">
                                <div className="profile-avatar-large" onClick={() => {
                                    if (selectedStudent.foto) {
                                        const win = window.open("", "_blank");
                                        win.document.write(`<img src="${selectedStudent.foto}" style="max-width:100%; height:auto;">`);
                                        win.focus();
                                    }
                                }} title="Clique para ampliar">
                                    {selectedStudent.foto ? (
                                        <img src={selectedStudent.foto} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                    ) : (
                                        <User size={64} />
                                    )}
                                </div>
                                <h2 className="profile-name">{selectedStudent.nome}</h2>
                                <p className="profile-id">Nº Matrícula: {selectedStudent.matricula}</p>
                                
                                <div 
                                    className="profile-status-interactive"
                                    onClick={() => setShowStatusSubmenu(!showStatusSubmenu)}
                                    style={{
                                        background: (() => {
                                            const s = selectedStudent.status.toLowerCase();
                                            if (s === 'ativo' || s === 'activo') return 'rgba(34, 197, 94, 0.2)'; // Green
                                            if (s === 'concluido' || s === 'concluida') return 'rgba(59, 130, 246, 0.2)'; // Blue
                                            if (s === 'desistente') return 'rgba(239, 68, 68, 0.2)'; // Red
                                            return 'rgba(255,255,255,0.2)';
                                        })(),
                                        padding: '8px 16px', 
                                        borderRadius: '8px', 
                                        marginBottom: '32px',
                                        fontWeight: '700',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'all 0.2s ease',
                                        width: '100%'
                                    }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {selectedStudent.status.toUpperCase()}
                                        <ChevronDown size={14} />
                                    </span>
                                    {selectedStudent.detalhes?.historicoMatriculas?.[selectedHistoryIndex]?.tipo === 'Confirmacao' && (
                                        <span style={{ fontSize: '9px', opacity: 0.9, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                            DADOS ATUALIZADOS
                                        </span>
                                    )}

                                    {showStatusSubmenu && (
                                        <div className="status-dropdown-modal" onClick={(e) => e.stopPropagation()}>
                                            {['Ativo', 'Inativo', 'Concluido', 'Transferido'].map(s => (
                                                <button 
                                                    key={s} 
                                                    onClick={() => handleUpdateStatus(selectedStudent.id, s)}
                                                    className={`status-opt ${s.toLowerCase()}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="profile-footer">
                                    {(() => {
                                        const h = selectedStudent.detalhes?.historicoMatriculas?.[selectedHistoryIndex];
                                        if (!h) return (
                                            <>
                                                <div className="profile-footer-item"><Calendar size={18} /><span>Matrícula: {selectedStudent.dataMatricula}</span></div>
                                                <div className="profile-footer-item"><BookOpen size={18} /><span>Classe: {selectedStudent.classe}</span></div>
                                                <div className="profile-footer-item"><Home size={18} /><span>Turma: {selectedStudent.turma}</span></div>
                                            </>
                                        );
                                        return (
                                            <>
                                                <div className="profile-footer-item"><Calendar size={18} /><span>Ano: {h.ano_lectivo_nome}</span></div>
                                                <div className="profile-footer-item"><BookOpen size={18} /><span>Classe: {h.classe_nome}</span></div>
                                                <div className="profile-footer-item"><Home size={18} /><span>Turma: {h.turma_codigo}</span></div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Right Content Area */}
                            <div className="content-area">
                                {/* 1. Dados Pessoais */}
                                <div className="info-section">
                                    <h3 className="section-title" style={{ color: '#b45309' }}>
                                        <User size={20} color="#b45309" /> Dados Pessoais
                                    </h3>
                                    <div className="info-grid-2">
                                        <div style={{ gridColumn: 'span 2' }}><p className="info-label">Nome Completo</p><p className="info-value">{selectedStudent.nome}</p></div>
                                        <div><p className="info-label">Data de Cadastro</p><p className="info-value">{selectedStudent.dataCadastro}</p></div>
                                        <div><p className="info-label">Género</p><p className="info-value">{selectedStudent.genero === 'M' ? 'Masculino' : selectedStudent.genero === 'F' ? 'Feminino' : (selectedStudent.genero || 'N/A')}</p></div>
                                        <div><p className="info-label">Data de Nascimento</p><p className="info-value">{selectedStudent.detalhes.nascimento}</p></div>
                                        <div><p className="info-label">Bilhete de Identidade</p><p className="info-value" style={{ fontFamily: 'monospace' }}>{selectedStudent.detalhes.bi || 'N/A'}</p></div>
                                        <div><p className="info-label">Nacionalidade</p><p className="info-value">{selectedStudent.detalhes.nacionalidade}</p></div>
                                        <div><p className="info-label">Naturalidade</p><p className="info-value">{selectedStudent.detalhes.naturalidade}</p></div>
                                        <div><p className="info-label">Deficiência</p>
                                            <p className="info-value">
                                                <span style={{
                                                    background: selectedStudent.detalhes.deficiencia === 'Sim' ? '#fef2f2' : '#f0fdf4',
                                                    color: selectedStudent.detalhes.deficiencia === 'Sim' ? '#dc2626' : '#16a34a',
                                                    border: `1px solid ${selectedStudent.detalhes.deficiencia === 'Sim' ? '#fecaca' : '#bbf7d0'}`,
                                                    padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                                                }}>{selectedStudent.detalhes.deficiencia}</span>
                                            </p>
                                        </div>
                                        <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                                            <p className="info-label"><MapPin size={12} style={{display:'inline', marginRight:'4px'}} /> Morada Completa</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
                                                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Província</p>
                                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{selectedStudent.detalhes.provincia}</p>
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Município</p>
                                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{selectedStudent.detalhes.municipio}</p>
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Bairro</p>
                                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{selectedStudent.detalhes.bairro}</p>
                                                </div>
                                            </div>
                                            <p style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                                                <span style={{ fontWeight: 600 }}>Nº Casa:</span> {selectedStudent.detalhes.numeroCasa}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                 {/* 2. Dados Académicos & Histórico Interativo */}
                                <div className="info-section">
                                    <h3 className="section-title" style={{ color: '#b45309', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <GraduationCap size={20} color="#b45309" /> Informações Académicas
                                        </span>
                                        {selectedStudent.detalhes.historicoMatriculas && selectedStudent.detalhes.historicoMatriculas.length > 1 && (
                                            <span style={{ fontSize: '11px', background: '#fffbeb', padding: '4px 8px', borderRadius: '20px', border: '1px solid #fcd34d' }}>
                                                Histórico Académico
                                            </span>
                                        )}
                                    </h3>

                                    {/* Seletor de Anos Interativo - Melhorado para mostrar estado */}
                                    {selectedStudent.detalhes.historicoMatriculas && selectedStudent.detalhes.historicoMatriculas.length > 1 && (
                                        <div className="year-history-tabs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
                                            {selectedStudent.detalhes.historicoMatriculas.map((m, idx) => {
                                                const statusStyle = getStatusStyle(m.status);
                                                return (
                                                    <button
                                                        key={m.id_matricula}
                                                        onClick={() => setSelectedHistoryIndex(idx)}
                                                        className={`history-tab-btn ${selectedHistoryIndex === idx ? 'active' : ''}`}
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'flex-start',
                                                            padding: '8px 16px',
                                                            minWidth: '120px',
                                                            position: 'relative',
                                                            borderBottom: selectedHistoryIndex === idx ? `3px solid ${statusStyle.color}` : '3px solid transparent'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Calendar size={12} /> {m.ano_lectivo_nome}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '10px', 
                                                            marginTop: '2px', 
                                                            padding: '1px 6px', 
                                                            borderRadius: '4px',
                                                            background: statusStyle.bg,
                                                            color: statusStyle.color,
                                                            fontWeight: 600,
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {m.status}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                     {(() => {
                                        const h = selectedStudent.detalhes.historicoMatriculas?.[selectedHistoryIndex];
                                        if (!h) return (
                                            <div className="info-grid-2">
                                                <div><p className="info-label">Ano Lectivo</p><p className="info-value">{selectedStudent.anoLectivo}</p></div>
                                                <div><p className="info-label">Curso</p><p className="info-value">{selectedStudent.curso}</p></div>
                                                <div><p className="info-label">Classe</p><p className="info-value">{selectedStudent.classe}</p></div>
                                                <div><p className="info-label">Turno</p><p className="info-value">{selectedStudent.turno}</p></div>
                                            </div>
                                        );

                                        return (
                                            <div className="info-grid-2">
                                                <div><p className="info-label">Ano Lectivo</p><p className="info-value">{h.ano_lectivo_nome}</p></div>
                                                <div><p className="info-label">Curso</p><p className="info-value">{h.curso_nome}</p></div>
                                                <div><p className="info-label">Classe</p><p className="info-value">{h.classe_nome}</p></div>
                                                <div><p className="info-label">Turno</p><p className="info-value">{h.periodo_nome}</p></div>
                                                <div><p className="info-label">Tipo de Matrícula</p><p className="info-value" style={{color: 'var(--primary-color)', fontWeight: 700}}>{getTipoMatriculaLabel(h.tipo)}</p></div>
                                                <div><p className="info-label">{h.tipo === 'Confirmacao' ? 'Data da Confirmação' : 'Data da Matrícula'}</p><p className="info-value">{h.data_matricula ? new Date(h.data_matricula).toLocaleDateString() : (h.criado_em ? new Date(h.criado_em).toLocaleDateString() : 'N/A')}</p></div>
                                                <div><p className="info-label">Estado no Ano</p>
                                                    <span className="student-status-badge" style={{
                                                        background: getStatusStyle(h.status).bg,
                                                        color: getStatusStyle(h.status).color,
                                                        border: `1px solid ${getStatusStyle(h.status).border}`,
                                                        fontSize: '11px',
                                                        padding: '3px 10px'
                                                    }}>
                                                        {h.status}
                                                    </span>
                                                </div>
                                                
                                                <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '16px', borderRadius: '16px', marginTop: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{ background: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: 'var(--primary-color)' }}>
                                                        <Home size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="info-label" style={{ marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SALA & TURMA DE REFERÊNCIA</p>
                                                        <p className="info-value" style={{ fontSize: '18px', fontWeight: 800 }}>Sala {h.sala_numero} • {h.turma_codigo}</p>
                                                    </div>
                                                </div>

                                                {/* Comparison Logic */}
                                                {(() => {
                                                    const prev = selectedStudent.detalhes?.historicoMatriculas?.[selectedHistoryIndex + 1];
                                                    if (!prev) return null;
                                                    
                                                    const hasChanged = h.classe_nome !== prev.classe_nome || h.curso_nome !== prev.curso_nome || h.turma_codigo !== prev.turma_codigo;
                                                    
                                                    return (
                                                        <div style={{ 
                                                            gridColumn: 'span 2', 
                                                            background: hasChanged ? '#f0f9ff' : '#f8fafc', 
                                                            padding: '12px 16px', 
                                                            borderRadius: '12px', 
                                                            border: `1px dashed ${hasChanged ? '#bae6fd' : '#e2e8f0'}`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            fontSize: '12px',
                                                            color: hasChanged ? '#0369a1' : '#64748b',
                                                            marginTop: '8px'
                                                        }}>
                                                            <div style={{ background: hasChanged ? '#e0f2fe' : '#f1f5f9', padding: '6px', borderRadius: '50%' }}>
                                                                {hasChanged ? <ArrowUpRight size={14} /> : <CheckCircle size={14} />}
                                                            </div>
                                                            <span>
                                                                {hasChanged 
                                                                    ? `Progressão detectada: O aluno mudou de ${prev.classe_nome} (${prev.ano_lectivo_nome}) para ${h.classe_nome}.`
                                                                    : `Continuidade: Os dados acadêmicos permanecem consistentes com o ano anterior (${prev.ano_lectivo_nome}).`
                                                                }
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        );
                                    })()}
                                </div>
                                
                                {/* 3. Contactos & Encarregado */}
                                <div className="info-section">
                                    <h3 className="section-title" style={{ color: '#0ea5e9' }}>
                                        <Phone size={20} color="#0ea5e9" /> Contactos & Encarregado
                                    </h3>
                                    <div className="info-grid-2">
                                        <div><p className="info-label">Telefone</p><p className="info-value">{selectedStudent.detalhes.telefone}</p></div>
                                        <div><p className="info-label">Email</p><p className="info-value">{selectedStudent.detalhes.email || 'N/A'}</p></div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <p className="info-label">Encarregado Principal</p>
                                            <p className="info-value" style={{ fontSize: '15px' }}>
                                                {selectedStudent.detalhes?.encarregado && typeof selectedStudent.detalhes.encarregado === 'object'
                                                    ? (selectedStudent.detalhes.encarregado.nome_completo || selectedStudent.detalhes.encarregado.nome || 'N/A')
                                                    : (selectedStudent.detalhes.encarregado || 'N/A')}
                                            </p>
                                        </div>
                                    </div>
                                </div>




                                <div style={{ height: '50px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL EDITAR DADOS PESSOAIS ===== */}
            {showEditModal && editPersonalData && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={(e) => { if (e.target === e.currentTarget) { setShowEditModal(false); setEditPersonalData(null); } }}>
                    <div style={{
                        background: 'white', borderRadius: '20px', width: '100%', maxWidth: '900px',
                        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.25)'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '24px 30px', borderBottom: '1px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                                    <User size={22} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 700 }}>Editar Dados Pessoais</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '13px' }}>{editPersonalData.nome_completo}</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowEditModal(false); setEditPersonalData(null); }}
                                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'white' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '28px 30px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                                {/* Foto */}
                                <div style={{ width: '160px', flexShrink: 0, textAlign: 'center', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ width: '110px', height: '110px', borderRadius: '24px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', margin: '0 auto 12px' }}>
                                        {editPersonalData.foto ? (
                                            <img src={editPersonalData.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ textAlign: 'center' }}><User size={36} color="#cbd5e1" /><p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontWeight: 600 }}>SEM FOTO</p></div>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Foto editável na ficha de matrícula</p>
                                </div>

                                {/* Campos */}
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div style={{ gridColumn: 'span 3' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Nome Completo <span style={{color: '#ef4444'}}>*</span></label>
                                        <input type="text" value={editPersonalData.nome_completo} onChange={e => setEditPersonalData(p => ({ ...p, nome_completo: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} placeholder="Nome completo do aluno" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Género</label>
                                        <select value={editPersonalData.genero} onChange={e => setEditPersonalData(p => ({ ...p, genero: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }}>
                                            <option value="M">Masculino</option><option value="F">Feminino</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Nascimento</label>
                                        <input type="date" value={editPersonalData.data_nascimento} onChange={e => setEditPersonalData(p => ({ ...p, data_nascimento: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Nº Bilhete de Identidade</label>
                                        <input type="text" value={editPersonalData.numero_bi} onChange={e => setEditPersonalData(p => ({ ...p, numero_bi: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }} placeholder="000000000LA000" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Nacionalidade</label>
                                        <input type="text" value={editPersonalData.nacionalidade} onChange={e => setEditPersonalData(p => ({ ...p, nacionalidade: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Naturalidade (Província)</label>
                                        <input type="text" value={editPersonalData.naturalidade} onChange={e => setEditPersonalData(p => ({ ...p, naturalidade: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="Ex: Huíla" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Deficiência?</label>
                                        <select value={editPersonalData.deficiencia} onChange={e => setEditPersonalData(p => ({ ...p, deficiencia: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }}>
                                            <option value="Não">Não</option><option value="Sim">Sim</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Email</label>
                                        <input type="email" value={editPersonalData.email} onChange={e => setEditPersonalData(p => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="exemplo@email.com" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Telefone</label>
                                        <input type="text" value={editPersonalData.telefone} onChange={e => setEditPersonalData(p => ({ ...p, telefone: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="923000000" />
                                    </div>
                                    {/* Divisória morada */}
                                    <div style={{ gridColumn: 'span 3', borderTop: '1px dashed #e2e8f0', paddingTop: '4px' }}>
                                        <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                            <MapPin size={14} /> Morada
                                        </p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Província</label>
                                        <input type="text" value={editPersonalData.provincia} onChange={e => setEditPersonalData(p => ({ ...p, provincia: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="Ex: Huíla" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Município</label>
                                        <input type="text" value={editPersonalData.municipio} onChange={e => setEditPersonalData(p => ({ ...p, municipio: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="Ex: Lubango" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Bairro</label>
                                        <input type="text" value={editPersonalData.bairro} onChange={e => setEditPersonalData(p => ({ ...p, bairro: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Nº de Casa</label>
                                        <input type="text" value={editPersonalData.numero_casa} onChange={e => setEditPersonalData(p => ({ ...p, numero_casa: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                                    </div>

                                    {/* Divisória Encarregado */}
                                    <div style={{ gridColumn: 'span 3', borderTop: '1px dashed #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                                        <p style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                            <ShieldCheck size={14} /> Dados do Encarregado
                                        </p>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Nome do Encarregado</label>
                                        <input type="text" value={editPersonalData.encarregado_nome} onChange={e => setEditPersonalData(p => ({ ...p, encarregado_nome: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="Nome completo do encarregado" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Grau de Parentesco</label>
                                        <select value={editPersonalData.encarregado_parentesco} onChange={e => setEditPersonalData(p => ({ ...p, encarregado_parentesco: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }}>
                                            <option value="">Selecione...</option>
                                            <option value="Pai">Pai</option>
                                            <option value="Mãe">Mãe</option>
                                            <option value="Tutor(a)">Tutor(a)</option>
                                            <option value="Avô">Avô</option>
                                            <option value="Avó">Avó</option>
                                            <option value="Tio(a)">Tio(a)</option>
                                            <option value="Irmão(ã)">Irmão(ã)</option>
                                            <option value="Padrasto / Madrasta">Padrasto / Madrasta</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Telefone do Encarregado</label>
                                        <input type="text" value={editPersonalData.encarregado_telefone} onChange={e => setEditPersonalData(p => ({ ...p, encarregado_telefone: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="9XXXXXXXX" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Email do Encarregado</label>
                                        <input type="email" value={editPersonalData.encarregado_email} onChange={e => setEditPersonalData(p => ({ ...p, encarregado_email: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="email@exemplo.com" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>BI do Encarregado</label>
                                        <input type="text" value={editPersonalData.encarregado_bi} onChange={e => setEditPersonalData(p => ({ ...p, encarregado_bi: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="000000000LA000" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Profissão do Encarregado</label>
                                        <select value={editPersonalData.encarregado_profissao} onChange={e => setEditPersonalData(p => ({ ...p, encarregado_profissao: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }}>
                                            <option value="">Selecione...</option>
                                            <option value="Professor(a)">Professor(a)</option>
                                            <option value="Médico(a)">Médico(a)</option>
                                            <option value="Enfermeiro(a)">Enfermeiro(a)</option>
                                            <option value="Engenheiro(a)">Engenheiro(a)</option>
                                            <option value="Advogado(a)">Advogado(a)</option>
                                            <option value="Agricultor(a)">Agricultor(a)</option>
                                            <option value="Comerciante">Comerciante</option>
                                            <option value="Condutor(a)">Condutor(a)</option>
                                            <option value="Contabilista">Contabilista</option>
                                            <option value="Economista">Economista</option>
                                            <option value="Funcionário(a) Público(a)">Funcionário(a) Público(a)</option>
                                            <option value="Gestor(a)">Gestor(a)</option>
                                            <option value="Jornalista">Jornalista</option>
                                            <option value="Militar">Militar</option>
                                            <option value="Pastor(a)">Pastor(a)</option>
                                            <option value="Policia">Policia</option>
                                            <option value="Técnico(a)">Técnico(a)</option>
                                            <option value="Trabalhador(a) por Conta Própria">Trabalhador(a) por Conta Própria</option>
                                            <option value="Desempregado(a)">Desempregado(a)</option>
                                            <option value="Reformado(a)">Reformado(a)</option>
                                            <option value="Outra">Outra</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '18px 30px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
                            <button onClick={() => { setShowEditModal(false); setEditPersonalData(null); }} disabled={isSavingPersonal}
                                style={{ padding: '10px 24px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                                Cancelar
                            </button>
                            <button onClick={handleSavePersonalData} disabled={isSavingPersonal}
                                style={{ padding: '10px 28px', border: 'none', borderRadius: '10px', background: isSavingPersonal ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: 'white', fontWeight: 700, cursor: isSavingPersonal ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(30,58,138,0.3)' }}>
                                <CheckCircle size={16} />
                                {isSavingPersonal ? 'A guardar...' : 'Guardar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL NOVO ALUNO COMPLETO ===== */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div style={{
                        background: 'white', borderRadius: '20px', width: '100%', maxWidth: '850px',
                        maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s'
                    }}>
                        <div style={{
                            padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            position: 'sticky', top: 0, zIndex: 10
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                                    <User size={22} color="white" />
                                </div>
                                <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 700 }}>Dados Pessoais do Aluno</h2>
                            </div>
                            <button onClick={() => setShowModal(false)}
                                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'white' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <p style={{fontSize: '12px', color: '#64748b', marginBottom: '20px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', borderLeft: '4px solid #10b981'}}>
                                Cadastre os dados pessoais do aluno. A matrícula (turma, curso, etc.) será feita posteriormente.
                            </p>

                            {/* Foto + Campos lado a lado */}
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

                                {/* Coluna Foto */}
                                <div style={{ width: '160px', flexShrink: 0, textAlign: 'center', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ width: '110px', height: '110px', borderRadius: '20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #e2e8f0', margin: '0 auto 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                                        {fotoPreview ? (
                                            <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ textAlign: 'center' }}>
                                                <User size={36} color="#cbd5e1" />
                                                <p style={{ fontSize: '9px', color: '#94a3b8', margin: '4px 0 0', fontWeight: 600 }}>SEM FOTO</p>
                                            </div>
                                        )}
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--primary-color, #4f46e5)', color: 'white', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}>
                                        <Upload size={14} />
                                        {fotoPreview ? 'Trocar' : 'Anexar Foto'}
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setFormData(p => ({ ...p, foto: file }));
                                                setFotoPreview(URL.createObjectURL(file));
                                            }
                                        }} />
                                    </label>
                                    <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>Fundo Branco, 3×4</p>
                                </div>

                                {/* Coluna Campos */}
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                    <div style={{ gridColumn: 'span 3' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Nome Completo <span style={{color: '#ef4444'}}>*</span></label>
                                        <input type="text" value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} placeholder="Nome do Aluno" />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Data de Nascimento <span style={{color: '#ef4444'}}>*</span></label>
                                        <input type="date" value={formData.data_nascimento} onChange={e => setFormData(p => ({ ...p, data_nascimento: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Gênero <span style={{color: '#ef4444'}}>*</span></label>
                                        <select value={formData.genero} onChange={e => setFormData(p => ({ ...p, genero: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }}>
                                            <option value="">Selecione...</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Feminino</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Nº BI <span style={{color: '#ef4444'}}>*</span></label>
                                        <input type="text" value={formData.bi} onChange={e => setFormData(p => ({ ...p, bi: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }} placeholder="000000000LA000" />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Naturalidade</label>
                                        <input type="text" value={formData.naturalidade} onChange={e => setFormData(p => ({ ...p, naturalidade: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="Ex: Luanda" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Nacionalidade</label>
                                        <input type="text" value={formData.nacionalidade} onChange={e => setFormData(p => ({ ...p, nacionalidade: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Deficiência?</label>
                                        <select value={formData.deficiencia} onChange={e => setFormData(p => ({ ...p, deficiencia: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }}>
                                            <option value="Não">Não</option>
                                            <option value="Sim">Sim</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Email <span style={{color: '#ef4444'}}>*</span></label>
                                        <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="exemplo@email.com" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Telefone <span style={{color: '#ef4444'}}>*</span></label>
                                        <input type="text" value={formData.telefone} onChange={e => setFormData(p => ({ ...p, telefone: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="9XXXXXXXX" />
                                    </div>

                                    <div style={{ gridColumn: 'span 3', borderTop: '1px dashed #e2e8f0', margin: '2px 0' }}></div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Província <span style={{color: '#ef4444'}}>*</span></label>
                                        <input type="text" value={formData.provincia} onChange={e => setFormData(p => ({ ...p, provincia: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="Huíla" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Município <span style={{color: '#ef4444'}}>*</span></label>
                                        <input type="text" value={formData.municipio} onChange={e => setFormData(p => ({ ...p, municipio: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="Lubango" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Bairro <span style={{color: '#ef4444'}}>*</span></label>
                                        <input type="text" value={formData.bairro} onChange={e => setFormData(p => ({ ...p, bairro: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} placeholder="Bairro..." />
                                    </div>
                                </div>
                            </div>

                            {/* Secção Encarregado */}
                            <div style={{ marginTop: '24px', padding: '20px', background: '#f0f9ff', borderRadius: '14px', border: '1px solid #bae6fd' }}>
                                <p style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                                    <ShieldCheck size={14} /> Dados do Encarregado de Educação <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '11px', color: '#64748b' }}>(opcional)</span>
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Nome do Encarregado</label>
                                        <input type="text" value={formData.enc_nome} onChange={e => setFormData(p => ({ ...p, enc_nome: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #bae6fd', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }} placeholder="Nome completo" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Grau de Parentesco</label>
                                        <select value={formData.enc_parentesco} onChange={e => setFormData(p => ({ ...p, enc_parentesco: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #bae6fd', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }}>
                                            <option value="Pai">Pai</option>
                                            <option value="Mãe">Mãe</option>
                                            <option value="Tutor">Tutor</option>
                                            <option value="Avô">Avô</option>
                                            <option value="Avó">Avó</option>
                                            <option value="Tio">Tio</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>BI do Encarregado</label>
                                        <input 
                                            type="text" 
                                            value={formData.enc_bi} 
                                            onChange={e => setFormData(p => ({ ...p, enc_bi: e.target.value }))} 
                                            onBlur={handleGuardianBiBlur}
                                            style={{ width: '100%', padding: '10px 14px', border: '1px solid #bae6fd', borderRadius: '10px', fontSize: '14px', fontFamily: 'monospace', outline: 'none', background: 'white' }} 
                                            placeholder="000000000LA000" 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Telefone</label>
                                        <input type="text" value={formData.enc_telefone} onChange={e => setFormData(p => ({ ...p, enc_telefone: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #bae6fd', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }} placeholder="9XXXXXXXX" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Email</label>
                                        <input type="email" value={formData.enc_email} onChange={e => setFormData(p => ({ ...p, enc_email: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #bae6fd', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }} placeholder="email@exemplo.com" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Profissão</label>
                                        <select value={formData.enc_profissao} onChange={e => setFormData(p => ({ ...p, enc_profissao: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #bae6fd', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }}>
                                            <option value="">Selecione...</option>
                                            <option value="Professor(a)">Professor(a)</option>
                                            <option value="Médico(a)">Médico(a)</option>
                                            <option value="Enfermeiro(a)">Enfermeiro(a)</option>
                                            <option value="Engenheiro(a)">Engenheiro(a)</option>
                                            <option value="Advogado(a)">Advogado(a)</option>
                                            <option value="Agricultor(a)">Agricultor(a)</option>
                                            <option value="Comerciante">Comerciante</option>
                                            <option value="Condutor(a)">Condutor(a)</option>
                                            <option value="Contabilista">Contabilista</option>
                                            <option value="Economista">Economista</option>
                                            <option value="Funcionário(a) Público(a)">Funcionário(a) Público(a)</option>
                                            <option value="Gestor(a)">Gestor(a)</option>
                                            <option value="Jornalista">Jornalista</option>
                                            <option value="Militar">Militar</option>
                                            <option value="Pastor(a)">Pastor(a)</option>
                                            <option value="Policia">Policia</option>
                                            <option value="Técnico(a)">Técnico(a)</option>
                                            <option value="Trabalhador(a) por Conta Própria">Trabalhador(a) por Conta Própria</option>
                                            <option value="Desempregado(a)">Desempregado(a)</option>
                                            <option value="Reformado(a)">Reformado(a)</option>
                                            <option value="Outra">Outra</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc', position: 'sticky', bottom: 0 }}>
                            <button onClick={() => setShowModal(false)}
                                style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                                Cancelar
                            </button>
                            <button onClick={handleSave}
                                style={{ padding: '10px 24px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                                <CheckCircle size={16} />
                                Guardar Aluno
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Context Menu Dropdown */}
            {activeMenuId && menuStudent && (
                <>
                    <div 
                        className="dropdown-overlay"
                        onClick={() => { setActiveMenuId(null); setMenuStudent(null); }}
                    />
                    <div 
                        ref={dropdownRef}
                        className="dropdown-menu-actions animate-fade-in"
                        style={{ 
                            top: menuPosition.top, 
                            left: menuPosition.left, 
                        }}
                    >
                        {/* Warning info if closed year */}
                        {(menuStudent.anoLectivoAtivo === false && !!menuStudent.matricula && menuStudent.status !== 'Ativo') && (
                             <div style={{ padding: '8px 12px', fontSize: '11px', color: '#dc2626', background: '#fef2f2', borderBottom: '1px solid #fee2e2' }}>
                                 <AlertCircle size={12} style={{display:'inline', marginRight:'4px'}}/>
                                 Ano Lectivo Encerrado
                             </div>
                        )}

                        {hasPermission(PERMISSIONS.EDIT_ALUNO) && (
                            <button 
                                onClick={() => { handleEdit(menuStudent); setActiveMenuId(null); }}
                                className="dropdown-item-btn"
                                // Edição de dados pessoais é permitida mesmo com Ano Lectivo encerrado.
                                // O backend bloqueia apenas alterações académicas (ex.: mudança de Turma).
                            >
                                <div style={{ color: '#64748b' }}><Edit size={16} /></div>
                                Editar Aluno
                            </button>
                        )}

                        {hasPermission(PERMISSIONS.CREATE_MATRICULA) && (
                            <button 
                                onClick={() => {
                                    // Navega para a página de inscrição passando o aluno ID
                                    // Se já tem matrícula, é Confirmação. Se não, é Novo (Novo Ingresso)
                                    const tipo = menuStudent.matricula ? 'Confirmacao' : 'Novo';
                                    navigate(`/matriculas/nova?aluno_id=${menuStudent.id}&tipo=${tipo}`);
                                    setActiveMenuId(null);
                                }}
                                className="dropdown-item-btn"
                                style={{ color: '#0ea5e9' }}
                            >
                                <div style={{ color: '#0ea5e9' }}><BookOpen size={16} /></div>
                                Matricular
                            </button>
                        )}
                        
                        {hasPermission(PERMISSIONS.EDIT_ALUNO) && (
                            <div 
                                className="submenu-trigger"
                                // Alterar Estado também deve ser permitido (mesmo em ano encerrado).
                                onMouseEnter={handleStatusEnter}
                                onMouseLeave={handleStatusLeave}
                            >
                                <button 
                                    className={`trigger-btn ${showStatusSubmenu ? 'active' : ''}`}
                                >
                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        <RefreshCw size={16} /> Alterar Estado
                                    </div>
                                    <ChevronRight size={16} />
                                </button>

                                {/* Submenu */}
                                {showStatusSubmenu && (
                                    <div 
                                        className="status-submenu animate-fade-in"
                                        onMouseEnter={handleStatusEnter}
                                        onMouseLeave={handleStatusLeave}
                                    >
                                        {[
                                            { value: 'Ativo', label: 'Ativo', icon: CheckCircle, className: 'status-active' },
                                            { value: 'Inativo', label: 'Inativo', icon: Clock, className: 'status-inativo' },
                                            { value: 'Transferido', label: 'Transferido', icon: ArrowRightLeft, className: 'status-transferido' },
                                            { value: 'Concluido', label: 'Concluído', icon: CheckCircle, className: 'status-concluido' }
                                        ].map((item) => (
                                            <button
                                                key={item.value}
                                                onClick={(e) => { 
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleUpdateStatus(menuStudent.id, item.value); 
                                                }}
                                                className={`status-option-btn ${item.className}`}
                                            >
                                                 <item.icon size={16} />
                                                 {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="dropdown-divider" />
                    </div>
                </>
            )}


        </div>
    );
};

export default Alunos;