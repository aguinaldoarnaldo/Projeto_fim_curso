import React, { useState, useEffect, useRef } from 'react';
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
    ArrowUp,
    ArrowDown,
    CheckCircle,
    AlertCircle,
    UserX,
    UserCheck,
    RefreshCw
} from 'lucide-react';

import Pagination from '../../components/Common/Pagination';
import api from '../../services/api';
import { useCache } from '../../context/CacheContext';
import { useDataCache } from '../../hooks/useDataCache';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';

const Alunos = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermission();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [menuStudent, setMenuStudent] = useState(null);
    const [formData, setFormData] = useState({
        nome: '',
        bi: '',
        nif: '',
        id_curso: '',
        id_classe: '',
        id_sala: '',
        id_periodo: '',
        id_turma: '',
        status: 'Activo'
    });
    const tableRef = useRef(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(24);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeMenuId && 
                !event.target.closest('.actions-dropdown-container') && 
                !event.target.closest('.dropdown-menu')) {
                setActiveMenuId(null);
                setMenuStudent(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeMenuId]);

    // Close menu on scroll to prevent it from floating away from the dots
    useEffect(() => {
        const handleScroll = () => {
            if (activeMenuId) {
                setActiveMenuId(null);
                setMenuStudent(null);
            }
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [activeMenuId]);

    // Scroll to top on page change
    useEffect(() => {
        if (tableRef.current) {
            tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const tableWrapper = tableRef.current.querySelector('.table-wrapper');
            if (tableWrapper) tableWrapper.scrollTop = 0;
        }
    }, [currentPage]);

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
                    api.get('anos-lectivos/'),
                    api.get('classes/'),
                    api.get('cursos/'),
                    api.get('salas/'),
                    api.get('turmas/')
                ]);

                if (anosRes.data?.results || Array.isArray(anosRes.data)) 
                    setAnosDisponiveis(anosRes.data?.results || anosRes.data);
                
                if (classesRes.data?.results || Array.isArray(classesRes.data)) 
                    setClassesDisponiveis(classesRes.data?.results || classesRes.data);

                if (cursosRes.data?.results || Array.isArray(cursosRes.data)) 
                    setCursosDisponiveis(cursosRes.data?.results || cursosRes.data);

                if (salasRes.data?.results || Array.isArray(salasRes.data)) 
                    setSalasDisponiveis(salasRes.data?.results || salasRes.data);

                if (turmasRes.data?.results || Array.isArray(turmasRes.data)) 
                    setTurmasDisponiveis(turmasRes.data?.results || turmasRes.data);

            } catch (err) {
                console.error("Erro ao buscar opções de filtros:", err);
            }
        };
        fetchFilterOptions();
    }, []);

    // State for students data moved to Cache Hook
    // const [students, setStudents] = useState([]); // Removed
    // const [loading, setLoading] = useState(true); // Removed
    // const [error, setError] = useState(null);     // Removed

    // Data Fetcher (Encapsulated Pagination Logic)
    // Data Fetcher (Encapsulated Pagination Logic)
    const fetchStudentsData = async () => {
        let allStudents = [];
        let nextUrl = 'alunos/';
        
        try {
            // Loop while there is a next page
            while (nextUrl) {
                const response = await api.get(nextUrl);
                const data = response?.data;
                
                if (!data) break;

                const results = data.results || (Array.isArray(data) ? data : []);
                
                // If results isn't an array, something is wrong, stop loop
                if (!Array.isArray(results)) break;

                allStudents = [...allStudents, ...results];
                nextUrl = data.next; // DRF returns full URL or null
                
                if (allStudents.length > 5000) break; // Safety break
            }
        } catch (err) {
            console.error("Erro durante o carregamento de alunos (paginação):", err);
            // If we managed to get some students, return them instead of breaking everything
            if (allStudents.length === 0) throw err;
        }
        
        return allStudents.map(student => ({
            id: student.id_aluno,
            matricula: student.numero_matricula,
            nome: student.nome_completo,
            foto: student.img_path,
            anoLectivo: student.ano_lectivo || '2024/2025',
            classe: student.classe_nivel ? `${student.classe_nivel}ª Classe` : 'N/A',
            curso: student.curso_nome || 'N/A',
            sala: student.sala_numero ? `Sala ${student.sala_numero}` : 'N/A',
            turno: student.periodo_nome || 'N/A',
            turma: student.turma_codigo,
            status: student.status_aluno,
            sugeridoTipo: student.sugerido_tipo_matricula,
            dataMatricula: student.criado_em ? new Date(student.criado_em).toLocaleDateString() : 'N/A',
            genero: student.genero || 'N/A',
            detalhes: {
                nif: student.numero_bi, 
                nascimento: student.data_nascimento || 'N/A',
                encarregado: student.encarregado_principal || 'N/A',
                telefone: student.telefone || 'N/A',
                email: student.email,
                endereco: `${student.municipio_residencia || ''}, ${student.provincia_residencia || ''}`,
                bi: student.numero_bi,
                obs: '',
                historico: student.historico_escolar || []
            }
        }));
    };

    // USE DATA CACHE HOOK
    const { 
        data: students = [], 
        loading, 
        error,
        refresh,
        update: updateStudent
    } = useDataCache('alunos', fetchStudentsData);

    // Polling for real-time updates (Silent Refresh)
    useEffect(() => {
        const interval = setInterval(() => {
            refresh(true); // silent = true
        }, 120000); // 2 minutes
        return () => clearInterval(interval);
    }, [refresh]);


    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleUpdateStatus = async (studentId, newStatus) => {
        // Instant local update (Real-time feeling)
        updateStudent(studentId, { status: newStatus });
        setActiveMenuId(null);
        setMenuStudent(null);

        try {
            // Background API call
            await api.patch(`alunos/${studentId}/`, { status_aluno: newStatus });
            // refresh() is NOT called to avoid the loading state/flicker
        } catch (err) {
            console.error("Erro ao atualizar estado do aluno:", err);
            alert("Erro ao atualizar estado do aluno. Por favor, tente novamente.");
            // Revert by refreshing from server if error occurs
            refresh();
        }
    };

    const handleEdit = (student) => {
        setModalMode('edit');
        setSelectedStudentId(student.id);
        
        // Find IDs from names/labels or use what's in the student object
        // Since the student object is formatted for display, we might need more data
        // But let's use what we have or just edit basic info first
        setFormData({
            nome: student.nome,
            bi: student.detalhes.bi,
            nif: student.detalhes.nif,
            id_curso: '', // We should ideally have the IDs in the student object
            id_classe: '',
            id_sala: '',
            id_periodo: '',
            id_turma: '',
            status: student.status
        });
        setShowModal(true);
    };

    const handleAdd = () => {
        setModalMode('add');
        setSelectedStudentId(null);
        setFormData({
            nome: '',
            bi: '',
            nif: '',
            id_curso: '',
            id_classe: '',
            id_sala: '',
            id_periodo: '',
            id_turma: '',
            status: 'Activo'
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (!formData.nome || !formData.bi) {
                alert("Nome e BI são obrigatórios.");
                return;
            }

            const payload = {
                nome_completo: formData.nome,
                numero_bi: formData.bi,
                nif: formData.nif,
                status_aluno: formData.status
                // Add more fields as needed
            };

            if (modalMode === 'add') {
                await api.post('alunos/', payload);
                alert("Aluno registrado com sucesso!");
            } else {
                await api.patch(`alunos/${selectedStudentId}/`, payload);
                alert("Dados do aluno atualizados com sucesso!");
            }

            setShowModal(false);
            refresh(true); // Silent refresh
        } catch (err) {
            console.error("Erro ao salvar aluno:", err);
            alert("Erro ao salvar. Verifique os dados.");
        }
    };

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' });

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
        switch (status) {
            case 'Activo': return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
            case 'Suspenso': return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' };
            case 'Concluído': return { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' };
            default: return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
        }
    };

    return (
        <div className="page-container alunos-page">
            <header className="page-header">
                <div className="alunos-header-content">
                    <div>
                        <h1>Gestão de Estudantes</h1>
                        <p>Visualização e administração de todos os alunos registrados.</p>
                    </div>
                    {hasPermission(PERMISSIONS.CREATE_ALUNO) && (
                        <button
                            onClick={handleAdd}
                            className="btn-primary-action"
                        >
                            <Plus size={20} />
                            Novo Aluno
                        </button>
                    )}
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
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-alternar-filtros"
                        aria-expanded={showFilters}
                        aria-label={showFilters ? "Esconder filtros" : "Mostrar filtros"}
                        style={{
                            background: showFilters ? 'var(--primary-color)' : 'var(--card-bg)',
                            color: showFilters ? 'white' : 'var(--text-color)'
                        }}
                    >
                        <Filter size={18} aria-hidden="true" />
                        Filtros
                    </button>
                </div>


                {/* Dynamic Filters */}
                {showFilters && (
                    <div className="painel-filtros">
                        <div className="grade-filtros">
                            <div className="grupo-filtro">
                                <label htmlFor="filtro-ano">Ano Lectivo</label>
                                <select
                                    id="filtro-ano"
                                    name="ano"
                                    value={filters.ano}
                                    onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }}
                                    className="selecao-filtro"
                                >
                                    <option value="">Todos</option>
                                    {anosDisponiveis.map(ano => (
                                        <option key={ano.id_ano || ano.id} value={ano.nome}>{ano.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label>Classe</label>
                                <select name="classe" value={filters.classe} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="selecao-filtro">
                                    <option value="">Todas</option>
                                    {classesDisponiveis.map(classe => (
                                        <option key={classe.id_classe || classe.id} value={classe.nome_classe}>{classe.nome_classe}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label>Curso</label>
                                <select name="curso" value={filters.curso} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="selecao-filtro">
                                    <option value="">Todos</option>
                                    {cursosDisponiveis.map(curso => (
                                        <option key={curso.id_curso || curso.id} value={curso.nome_curso}>{curso.nome_curso}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label>Sala</label>
                                <select name="sala" value={filters.sala} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="selecao-filtro">
                                    <option value="">Todas</option>
                                    {salasDisponiveis.map(sala => (
                                        <option key={sala.id_sala || sala.id} value={`Sala ${sala.numero_sala}`}>{`Sala ${sala.numero_sala}`}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label>Turma</label>
                                <select name="turma" value={filters.turma} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="selecao-filtro">
                                    <option value="">Todas</option>
                                    {turmasDisponiveis.map(turma => (
                                        <option key={turma.id_turma || turma.id} value={turma.codigo_turma}>{turma.codigo_turma}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setFilters({ ano: '', sala: '', curso: '', turma: '', classe: '' }); setCurrentPage(1); }}
                                className="btn-limpar-filtros">
                                <X size={16} /> Limpar Filtros
                            </button>
                        </div>
                    </div>
                )}


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
                                            <td className="sticky-col-1">
                                                <div className="student-info">
                                                    <div className="student-avatar" style={{ 
                                                        width: '40px', 
                                                        height: '40px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        overflow: 'hidden',
                                                        borderRadius: '10px',
                                                        background: s.foto ? 'white' : 'var(--primary-light-bg)',
                                                        border: s.foto ? '1px solid #e2e8f0' : 'none'
                                                    }}>
                                                        {s.foto ? (
                                                            <img src={s.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <User size={18} color="var(--primary-color)" />
                                                        )}
                                                    </div>
                                                    <span className="student-name" style={{ fontWeight: 600, color: '#1e293b' }}>{s.nome}</span>
                                                </div>
                                            </td>
                                            <td>{s.anoLectivo}</td>
                                            <td style={{ fontWeight: 700 }}>{s.classe}</td>
                                            <td style={{ color: '#475569' }}>{s.curso}</td>
                                            <td>{s.sala}</td>
                                            <td>{s.turno}</td>
                                            <td>{s.turma}</td>
                                             <td>
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
                                                         onClick={() => setSelectedStudent(s)}
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
                                                                 } else {
                                                                     const rect = e.currentTarget.getBoundingClientRect();
                                                                     setMenuPosition({
                                                                         top: rect.bottom + 5,
                                                                         left: Math.max(10, Math.min(window.innerWidth - 220, rect.right - 210))
                                                                     });
                                                                     setMenuStudent(s);
                                                                     setActiveMenuId(s.id);
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
                            onClick={() => setSelectedStudent(null)}
                            className="btn-close-modal">
                            <X size={24} color="#64748b" />
                        </button>

                        <div className="detail-modal-grid">
                            {/* Left Profile Card */}
                            <div className="profile-sidebar">
                                <div className="profile-avatar-large" style={{ overflow: 'hidden', padding: 0 }}>
                                    {selectedStudent.foto ? (
                                        <img src={selectedStudent.foto} alt={selectedStudent.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={48} color="white" />
                                        </div>
                                    )}
                                </div>
                                <h2 className="profile-name">{selectedStudent.nome}</h2>
                                <p className="profile-id">ID: {selectedStudent.id}</p>

                                <div className="profile-status">
                                    {selectedStudent.status}
                                </div>

                                <div className="profile-footer">
                                    <div className="profile-footer-item">
                                        <ClipboardList size={18} />
                                        <span className="profile-footer-text">Lançamento de Notas</span>
                                    </div>
                                    <div className="profile-footer-item">
                                        <ShieldCheck size={18} />
                                        <span className="profile-footer-text">Histórico Disciplinar</span>
                                    </div>
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
                                        <div><p className="info-label">Nome Completo</p><p className="info-value">{selectedStudent.nome}</p></div>
                                        <div><p className="info-label">Género</p><p className="info-value">{selectedStudent.genero || 'N/A'}</p></div>
                                        <div><p className="info-label">Data de Nascimento</p><p className="info-value">{selectedStudent.detalhes.nascimento}</p></div>
                                        <div><p className="info-label">Bilhete de Identidade</p><p className="info-value" style={{ fontFamily: 'monospace' }}>{selectedStudent.detalhes.bi}</p></div>
                                        <div><p className="info-label">NIF</p><p className="info-value">{selectedStudent.detalhes.nif || '-'}</p></div>
                                        <div><p className="info-label">Morada</p><p className="info-value">{selectedStudent.detalhes.endereco}</p></div>
                                    </div>
                                </div>

                                {/* 2. Dados Académicos */}
                                <div className="info-section">
                                    <h3 className="section-title" style={{ color: '#b45309' }}>
                                        <GraduationCap size={20} color="#b45309" /> Informações Académicas
                                    </h3>
                                    <div className="info-grid-2">
                                        <div><p className="info-label">Ano Lectivo</p><p className="info-value">{selectedStudent.anoLectivo}</p></div>
                                        <div><p className="info-label">Curso</p><p className="info-value">{selectedStudent.curso}</p></div>
                                        <div><p className="info-label">Classe</p><p className="info-value">{selectedStudent.classe}</p></div>
                                        <div><p className="info-label">Turno</p><p className="info-value">{selectedStudent.turno}</p></div>
                                        
                                        <div style={{ gridColumn: 'span 2', background: '#fffbeb', padding: '16px', borderRadius: '12px', marginTop: '8px', border: '1px solid #fcd34d' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Home size={20} color="#b45309" />
                                                <div>
                                                    <p className="info-label" style={{ color: '#b45309', marginBottom: '4px' }}>SALA & TURMA</p>
                                                    <p className="info-value" style={{ fontSize: '18px' }}>{selectedStudent.sala} • {selectedStudent.turma}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2.5 Histórico Escolar (Se Transferido) */}
                                {selectedStudent.detalhes.historico && selectedStudent.detalhes.historico.length > 0 && (
                                    <div className="info-section">
                                        <h3 className="section-title" style={{ color: '#b45309' }}>
                                            <ClipboardList size={20} color="#b45309" /> Histórico Escolar (Anterior)
                                        </h3>
                                        <div className="table-wrapper" style={{ marginTop: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: 'none' }}>
                                            <table className="data-table" style={{ fontSize: '13px' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ background: '#f8fafc', padding: '8px 12px' }}>Escola</th>
                                                        <th style={{ background: '#f8fafc', padding: '8px 12px' }}>Ano</th>
                                                        <th style={{ background: '#f8fafc', padding: '8px 12px' }}>Classe</th>
                                                        <th style={{ background: '#f8fafc', padding: '8px 12px' }}>Média</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedStudent.detalhes.historico.map((h, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ padding: '8px 12px' }}>{h.escola_origem || h.escola}</td>
                                                            <td style={{ padding: '8px 12px' }}>{h.ano_lectivo || h.ano}</td>
                                                            <td style={{ padding: '8px 12px' }}>{h.classe}</td>
                                                            <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{h.media_final || h.media}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Encarregado & Contactos */}
                                <div className="info-section">
                                    <h3 className="section-title" style={{ color: '#b45309' }}>
                                        <User size={20} color="#b45309" /> Encarregado & Contactos
                                    </h3>
                                    <div className="info-grid-2">
                                        <div style={{ gridColumn: 'span 2' }}>
                                             <p className="info-label">Encarregado Principal</p>
                                             <p className="info-value" style={{fontSize: '16px'}}>{selectedStudent.detalhes.encarregado}</p>
                                        </div>
                                        
                                        <div style={{display:'flex', alignItems:'center', gap: '8px'}}>
                                            <Phone size={18} color="#64748b"/>
                                            <div>
                                                <p className="info-label">Telefone</p>
                                                <p className="info-value">{selectedStudent.detalhes.telefone}</p>
                                            </div>
                                        </div>

                                        <div style={{display:'flex', alignItems:'center', gap: '8px'}}>
                                            <Mail size={18} color="#64748b"/>
                                            <div>
                                                <p className="info-label">Email</p>
                                                <p className="info-value">{selectedStudent.detalhes.email || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Observações */}
                                {selectedStudent.detalhes.obs && (
                                    <div className="info-section">
                                        <h3 className="section-title" style={{ color: '#b45309' }}>
                                            <ClipboardList size={20} color="#b45309" /> Observações
                                        </h3>
                                        <div className="observations-box">
                                            {selectedStudent.detalhes.obs}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Aluno Form Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="form-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="form-modal-header">
                            <div>
                                <h2>{modalMode === 'add' ? 'Novo Registro de Aluno' : 'Editar Dados do Aluno'}</h2>
                                <p>{modalMode === 'add' ? 'Preencha os dados básicos para iniciar a matrícula.' : 'Atualize as informações do registro do aluno.'}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn-close-form">
                                <X size={24} color="#64748b" />
                            </button>
                        </div>

                        <form className="form-container" onSubmit={handleSave}>
                            <div className="form-grid">
                                <div className="form-group form-group-full">
                                    <label>Nome Completo</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: João Manuel dos Santos" 
                                        className="form-input" 
                                        value={formData.nome}
                                        onChange={e => setFormData({...formData, nome: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nº Bilhete de Identidade</label>
                                    <input 
                                        type="text" 
                                        placeholder="000XXXXXXXLA0XX" 
                                        className="form-input" 
                                        value={formData.bi}
                                        onChange={e => setFormData({...formData, bi: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>NIF</label>
                                    <input 
                                        type="text" 
                                        placeholder="XXXXXXX" 
                                        className="form-input" 
                                        value={formData.nif}
                                        onChange={e => setFormData({...formData, nif: e.target.value})}
                                    />
                                </div>
                                
                                {modalMode === 'add' ? (
                                    <>
                                        <div className="form-group">
                                            <label>Curso</label>
                                            <select 
                                                className="form-select"
                                                value={formData.id_curso}
                                                onChange={e => setFormData({...formData, id_curso: e.target.value})}
                                            >
                                                <option value="">Seleccionar Curso</option>
                                                {cursosDisponiveis.map(c => <option key={c.id_curso} value={c.id_curso}>{c.nome_curso}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Classe</label>
                                            <select 
                                                className="form-select"
                                                value={formData.id_classe}
                                                onChange={e => setFormData({...formData, id_classe: e.target.value})}
                                            >
                                                <option value="">Seleccionar Classe</option>
                                                {classesDisponiveis.map(c => <option key={c.id_classe} value={c.id_classe}>{c.nome_classe}</option>)}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select 
                                            className="form-select"
                                            value={formData.status}
                                            onChange={e => setFormData({...formData, status: e.target.value})}
                                        >
                                            <option value="Activo">Activo</option>
                                            <option value="Suspenso">Suspenso</option>
                                            <option value="Concluído">Concluído</option>
                                            <option value="Inativo">Inativo</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-cancel">Cancelar</button>
                                <button
                                    type="submit"
                                    className="btn-confirm">
                                    {modalMode === 'add' ? 'Confirmar Registro' : 'Salvar Alterações'} <ChevronRight size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Actions Dropdown Portal-like */}
            {activeMenuId && menuStudent && (
                <div 
                    className="dropdown-menu"
                    style={{
                        position: 'fixed',
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        margin: 0,
                        zIndex: 10000,
                        display: 'block',
                        visibility: 'visible',
                        opacity: 1
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {hasPermission(PERMISSIONS.EDIT_ALUNO) && (
                        <button className="dropdown-item" onClick={() => { handleEdit(menuStudent); setActiveMenuId(null); setMenuStudent(null); }}>
                            <Edit size={16} /> Editar Aluno
                        </button>
                    )}

                    <div className="submenu-parent">
                        <button className="dropdown-item">
                            <RefreshCw size={16} /> Alterar Estado
                            <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
                        </button>
                        <div className="submenu">
                            <button className="dropdown-item success" onClick={() => handleUpdateStatus(menuStudent.id, 'Activo')}>
                                <CheckCircle size={14} /> Ativo
                            </button>
                            <button className="dropdown-item warning" onClick={() => handleUpdateStatus(menuStudent.id, 'Suspenso')}>
                                <Clock size={14} /> Suspenso
                            </button>
                            <button className="dropdown-item warning" onClick={() => handleUpdateStatus(menuStudent.id, 'Transferido')}>
                                <RefreshCw size={14} /> Transferido
                            </button>
                            <button className="dropdown-item danger" onClick={() => handleUpdateStatus(menuStudent.id, 'Desistente')}>
                                <UserX size={14} /> Desistente
                            </button>
                        </div>
                    </div>

                    {(menuStudent.sugeridoTipo || hasPermission(PERMISSIONS.CREATE_MATRICULA)) && (
                        <>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-section-title">Matrícula</div>
                            
                            {menuStudent.sugeridoTipo === 'Confirmacao' && (
                                <button className="dropdown-item success" onClick={() => navigate(`/matriculas/nova?aluno_id=${menuStudent.id}&tipo=Confirmacao`)}>
                                    <ShieldCheck size={16} /> Confirmar Matrícula
                                </button>
                            )}
                            {menuStudent.sugeridoTipo === 'Reenquadramento' && (
                                <button className="dropdown-item warning" onClick={() => navigate(`/matriculas/nova?aluno_id=${menuStudent.id}&tipo=Reenquadramento`)}>
                                    <BookOpen size={16} /> Reenquadrar Aluno
                                </button>
                            )}
                            {menuStudent.sugeridoTipo === 'Repetente' && (
                                <button className="dropdown-item danger" onClick={() => navigate(`/matriculas/nova?aluno_id=${menuStudent.id}&tipo=Repetente`)}>
                                    <Clock size={16} /> Marcar como Repetente
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
            {/* Portal-like Actions Dropdown */}
            {activeMenuId && menuStudent && (
                <div 
                    className="dropdown-menu"
                    style={{
                        position: 'fixed',
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        zIndex: 10000,
                        margin: 0,
                        display: 'block'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {hasPermission(PERMISSIONS.EDIT_ALUNO) && (
                        <button className="dropdown-item" onClick={() => { handleEdit(menuStudent); setActiveMenuId(null); setMenuStudent(null); }}>
                            <Edit size={16} /> Editar Aluno
                        </button>
                    )}

                    <div className="submenu-parent">
                        <button className="dropdown-item">
                            <RefreshCw size={16} /> Alterar Estado
                            <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
                        </button>
                        <div className="submenu">
                            <button className="dropdown-item success" onClick={() => handleUpdateStatus(menuStudent.id, 'Activo')}>
                                <CheckCircle size={14} /> Ativo
                            </button>
                            <button className="dropdown-item warning" onClick={() => handleUpdateStatus(menuStudent.id, 'Suspenso')}>
                                <Clock size={14} /> Suspenso
                            </button>
                            <button className="dropdown-item warning" onClick={() => handleUpdateStatus(menuStudent.id, 'Transferido')}>
                                <RefreshCw size={14} /> Transferido
                            </button>
                            <button className="dropdown-item danger" onClick={() => handleUpdateStatus(menuStudent.id, 'Desistente')}>
                                <UserX size={14} /> Desistente
                            </button>
                        </div>
                    </div>

                    {(menuStudent.sugeridoTipo || hasPermission(PERMISSIONS.CREATE_MATRICULA)) && (
                        <>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-section-title">Matrícula</div>
                            
                            {menuStudent.sugeridoTipo === 'Confirmacao' && (
                                <button className="dropdown-item success" onClick={() => navigate(`/matriculas/nova?aluno_id=${menuStudent.id}&tipo=Confirmacao`)}>
                                    <ShieldCheck size={16} /> Confirmar Matrícula
                                </button>
                            )}
                            {menuStudent.sugeridoTipo === 'Reenquadramento' && (
                                <button className="dropdown-item warning" onClick={() => navigate(`/matriculas/nova?aluno_id=${menuStudent.id}&tipo=Reenquadramento`)}>
                                    <BookOpen size={16} /> Reenquadrar Aluno
                                </button>
                            )}
                            {menuStudent.sugeridoTipo === 'Repetente' && (
                                <button className="dropdown-item danger" onClick={() => navigate(`/matriculas/nova?aluno_id=${menuStudent.id}&tipo=Repetente`)}>
                                    <Clock size={16} /> Marcar como Repetente
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Alunos;
