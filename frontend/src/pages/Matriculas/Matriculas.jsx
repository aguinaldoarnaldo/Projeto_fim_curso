import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Matriculas.css';
import './MatriculasTableResponsive.css';

import {
    Search,
    Filter,
    MoreVertical,
    X,
    Calendar,
    User,
    BookOpen,
    Home,
    Clock,
    CheckCircle,
    FileText,
    CreditCard,
    Phone,
    Mail,
    Eye,
    Edit,
    ArrowRightLeft,
    ArrowUp,
    ArrowDown,
    ChevronRight,
    MapPin, // Added for Sala
    Users // Added for Turma
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Common/Pagination';
import FilterModal from '../../components/Common/FilterModal';
import PermutaModal from './PermutaModal';
import { useDataCache } from '../../hooks/useDataCache';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';

const Matriculas = () => {
    const { hasPermission } = usePermission();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMatricula, setSelectedMatricula] = useState(null);
    const [showPermutaModal, setShowPermutaModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMatriculaId, setEditingMatriculaId] = useState(null);
    const filterButtonRef = useRef(null);
    const [modalFormData, setModalFormData] = useState({
        status: '',
        id_sala: '',
        id_classe: '',
        id_periodo: '',
        id_turma: ''
    });
    const tableRef = useRef(null);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(24);

    // Scroll to top on page change
    useEffect(() => {
        if (tableRef.current) {
            tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const tableWrapper = tableRef.current.querySelector('.table-wrapper');
            if (tableWrapper) tableWrapper.scrollTop = 0;
        }
    }, [currentPage]);

    // Menu States
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [menuMatricula, setMenuMatricula] = useState(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeMenuId && 
                !event.target.closest('.actions-dropdown-container') && 
                !event.target.closest('.dropdown-menu')) {
                setActiveMenuId(null);
                setMenuMatricula(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeMenuId]);

    // Close menu on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (activeMenuId) {
                setActiveMenuId(null);
                setMenuMatricula(null);
            }
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [activeMenuId]);


    // Filter states
    const [filters, setFilters] = useState({
        ano: '',
        sala: '',
        curso: '',
        turma: '',
        classe: ''
    });

    // Filter Options State
    const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
    const [anosDisponiveis, setAnosDisponiveis] = useState([]);
    const [classesDisponiveis, setClassesDisponiveis] = useState([]);
    const [salasDisponiveis, setSalasDisponiveis] = useState([]);
    const [turmasDisponiveis, setTurmasDisponiveis] = useState([]);

    // 1. Define Fetch Function for Matriculas ONLY
    const fetchMatriculasData = async () => {
        const response = await api.get('matriculas/');
        const data = response.data.results || response.data;
        
        if (!Array.isArray(data)) return [];

        return data.map(item => ({
            id: `MAT-${item.id_matricula || '000'}`,
            real_id: item.id_matricula,
            aluno: item.aluno_nome || 'Desconhecido',
            foto: item.aluno_foto || null,
            anoLectivo: item.ano_lectivo_nome || item.ano_lectivo || 'N/A',
            classe: item.classe_nome || 'N/A',
            curso: item.curso_nome || 'N/A',
            sala: item.sala_numero || item.sala_nome || 'N/A',
            turno: item.periodo_nome || 'N/A',
            turma: item.turma_codigo || 'Sem Turma',
            status: item.status || 'Ativa',
            dataMatricula: item.data_matricula ? new Date(item.data_matricula).toLocaleDateString() : 'N/A',
            alunoId: item.aluno_id || item.aluno, // Ensure we have the student ID
            detalhes: {
                bi: item.bi || 'N/A', 
                genero: item.genero || 'N/A',
                nif: item.nif || 'N/A',
                dataNascimento: item.data_nascimento || 'N/A',
                encarregado: item.encarregado_nome || 'N/A', 
                parentesco: item.encarregado_parentesco || 'N/A',
                telefoneEncarregado: item.encarregado_telefone || 'N/A',
                email: item.email || 'N/A', 
                endereco: item.endereco || 'N/A',
                pagamentoStatus: item.ativo ? 'Confirmado' : 'Pendente',
                documentos: [], // Populate if available from API
                historico: item.historico_escolar || [] // Map history from API response
            }
        }));
    };

    // 2. Use Data Cache Hook
    const { 
        data: cachedMatriculas, 
        loading: isLoading, 
        refresh 
    } = useDataCache('matriculas', fetchMatriculasData);

    // Safeguard for array iteration
    const matriculas = Array.isArray(cachedMatriculas) ? cachedMatriculas : [];

    // 3. Fetch Filters Separately (Once)
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [cursosRes, anosRes, classesRes, salasRes, turmasRes] = await Promise.all([
                    api.get('cursos/'),
                    api.get('anos-lectivos/'),
                    api.get('classes/'),
                    api.get('salas/'),
                    api.get('turmas/')
                ]);

                if (cursosRes.data.results || Array.isArray(cursosRes.data))
                     setCursosDisponiveis(cursosRes.data.results || cursosRes.data);
                
                if (anosRes.data.results || Array.isArray(anosRes.data))
                     setAnosDisponiveis(anosRes.data.results || anosRes.data);

                if (classesRes.data.results || Array.isArray(classesRes.data))
                     setClassesDisponiveis(classesRes.data.results || classesRes.data);

                if (salasRes.data.results || Array.isArray(salasRes.data))
                     setSalasDisponiveis(salasRes.data.results || salasRes.data);

                if (turmasRes.data.results || Array.isArray(turmasRes.data))
                     setTurmasDisponiveis(turmasRes.data.results || turmasRes.data);

            } catch (e) {
                console.error("Error fetching filter options", e);
            }
        };

        fetchFilters();
    }, []);

    // 4. Polling (Silent Refresh)
    useEffect(() => {
        const interval = setInterval(() => {
            refresh(true); // silent = true
        }, 60000); // 60s polling
        return () => clearInterval(interval);
    }, [refresh]);

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ ano: '', sala: '', curso: '', turma: '', classe: '' });
        setCurrentPage(1);
    };

    const handleEdit = (m) => {
        setEditingMatriculaId(m.real_id);
        setModalFormData({
            status: m.status,
            id_sala: '', // Would need IDs from mapping
            id_classe: '',
            id_periodo: '',
            id_turma: ''
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                status: modalFormData.status
                // Add more fields if logic implemented in backend
            };

            await api.patch(`matriculas/${editingMatriculaId}/`, payload);
            alert("Matrícula atualizada com sucesso!");
            setShowEditModal(false);
            refresh(true);
        } catch (err) {
            console.error("Erro ao atualizar matrícula:", err);
            alert("Erro ao atualizar matrícula.");
        }
    };

    const handleDownloadFicha = async (id, matriculaNum) => {
        try {
            const response = await api.get(`matriculas/${id}/download_ficha/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Ficha_Matricula_${matriculaNum || 'Documento'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Erro ao baixar PDF", error);
            alert("Erro ao baixar o documento.");
        }
    };

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'aluno', direction: 'asc' });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredMatriculas = React.useMemo(() => {
        let sortableItems = matriculas.filter(matricula => {
            if (!matricula) return false;
            
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                (matricula.aluno && String(matricula.aluno).toLowerCase().includes(search)) ||
                (matricula.id && String(matricula.id).toLowerCase().includes(search));

            const matchesFilters =
                (filters.ano === '' || matricula.anoLectivo === filters.ano) &&
                (filters.classe === '' || matricula.classe === filters.classe) &&
                (filters.curso === '' || matricula.curso === filters.curso) &&
                (filters.sala === '' || String(matricula.sala) === filters.sala) &&
                (filters.turma === '' || matricula.turma === filters.turma);

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
    }, [matriculas, searchTerm, filters, sortConfig]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Ativa': return <span className="status-badge status-confirmed">Ativa</span>;
            case 'Confirmada': return <span className="status-badge status-confirmed">Confirmada</span>;
            case 'Concluida': return <span className="status-badge status-success">Concluída</span>;
            case 'Transferido': return <span className="status-badge status-warning">Transferido</span>;
            case 'Desistente': return <span className="status-badge status-danger">Desistente</span>;
            default: return <span className="status-badge status-default">{status}</span>;
        }
    };

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMatriculas.slice(indexOfFirstItem, indexOfLastItem);

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
            options: salasDisponiveis.map(s => ({ value: s.numero_sala || s.nome, label: s.numero_sala || s.nome }))
        },
        { 
            key: 'turma', 
            label: 'Turma', 
            icon: Users,
            options: turmasDisponiveis.map(t => ({ value: t.codigo_turma || t.nome, label: t.codigo_turma || t.nome }))
        }
    ], [anosDisponiveis, classesDisponiveis, cursosDisponiveis, salasDisponiveis, turmasDisponiveis]);

    return (
        <div className="page-container matriculas-page">
            <header className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1>Gestão de Matrículas</h1>
                        <p>Controle centralizado de matrículas e registros acadêmicos.</p>
                    </div>
                    <div className="page-header-actions">
                        {hasPermission(PERMISSIONS.EDIT_MATRICULA) && (
                            <button
                                onClick={() => setShowPermutaModal(true)}
                                className="btn-permuta"
                                title="Trocar turmas entre alunos"
                            >
                                <ArrowRightLeft size={18} /> Permuta
                            </button>
                        )}
                        {hasPermission(PERMISSIONS.CREATE_MATRICULA) && (
                            <button
                                onClick={() => navigate('/matriculas/nova')}
                                className="btn-new-matricula"
                            >
                                <Calendar size={18} /> Nova Matrícula
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="table-card" ref={tableRef}>
                {/* Search and Toggle Filter */}
                <div className="search-filter-row">
                    <div className="search-box">
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Buscar aluno ou número de matrícula..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="search-box-input"
                            aria-label="Pesquisar matrículas por aluno ou número"
                        />
                    </div>
                    <button
                        ref={filterButtonRef}
                        onClick={() => setShowFilters(true)}
                        className="btn-filtros-avancados"
                        aria-label="Abrir filtros avançados"
                        style={{ background: showFilters ? 'var(--primary-color)' : 'white', color: showFilters ? 'white' : '#374151' }}
                    >
                        <Filter size={18} aria-hidden="true" />
                        Filtros Avançados
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

                {/* Detailed Table */}
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                    <th className="sticky-col-1" style={{ width: '80px', textAlign: 'center' }}>Nº Matr.</th>
                                    <th 
                                        className={`sticky-col-2 sortable-header ${sortConfig.key === 'aluno' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('aluno')}
                                        style={{ minWidth: '250px' }} 
                                    >
                                        Nome Completo
                                         <span className="sort-icon">
                                            {sortConfig.key === 'aluno' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
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
                                        className={`sortable-header ${sortConfig.key === 'turma' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('turma')}
                                    >
                                        Turma
                                         <span className="sort-icon">
                                            {sortConfig.key === 'turma' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th 
                                        className={`col-turno sortable-header ${sortConfig.key === 'turno' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('turno')}
                                    >
                                        Turno
                                         <span className="sort-icon">
                                            {sortConfig.key === 'turno' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                                        </span>
                                    </th>
                                    <th 
                                        className={`col-ano sortable-header ${sortConfig.key === 'anoLectivo' ? 'active-sort' : ''}`} 
                                        onClick={() => requestSort('anoLectivo')}
                                    >
                                        Ano Lectivo
                                         <span className="sort-icon">
                                            {sortConfig.key === 'anoLectivo' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
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
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((m) => (
                                    <tr key={m.id} className="animate-fade-in">
                                        <td className="sticky-col-1" style={{ textAlign: 'center', fontWeight: '700', fontFamily: 'monospace', color: '#64748b' }}>
                                            #{m.real_id}
                                        </td>
                                        <td className="sticky-col-2">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div className="student-avatar" style={{ 
                                                    width: '32px', 
                                                    height: '32px',
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    overflow: 'hidden',
                                                    background: m.foto ? 'white' : '#eff6ff',
                                                    border: m.foto ? '1px solid #e2e8f0' : '1px solid #dbeafe',
                                                    borderRadius: '10px',
                                                    color: 'var(--primary-color)'
                                                }}>
                                                    {m.foto ? (
                                                        <img src={m.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span style={{ fontWeight: 700, fontSize: '12px' }}>
                                                            {m.aluno.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13.5px' }}>{m.aluno}</span>
                                            </div>
                                        </td>
                                    <td style={{fontWeight: 600, color: '#334155'}}>{m.classe}</td>
                                    <td>
                                        {(m.turma === 'Sem Turma' || m.turma === 'N/A' || m.turma.includes('N/A')) ? (
                                             <span style={{
                                                 background: '#fff7ed', 
                                                 color: '#c2410c', 
                                                 padding: '4px 8px', 
                                                 borderRadius: '6px', 
                                                 fontSize: '11px', 
                                                 fontWeight: 600,
                                                 border: '1px solid #ffedd5'
                                             }}>
                                                Pendente
                                             </span>
                                        ) : (
                                            <span style={{fontWeight: 700, color: '#1e293b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px'}}>
                                                {m.turma}
                                            </span>
                                        )}
                                    </td>
                                    <td className="col-turno">{m.turno}</td>
                                    <td className="col-ano" style={{color: '#64748b'}}>{m.anoLectivo}</td>
                                    <td>{getStatusBadge(m.status)}</td>
                                    <td style={{ 
                                        textAlign: 'center', 
                                        position: 'relative',
                                        zIndex: activeMenuId === m.real_id ? 100 : 1 
                                    }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                            <button 
                                                className="btn-icon-action" 
                                                onClick={() => setSelectedMatricula(m)}
                                                title="Ver Detalhes"
                                                style={{
                                                    background: '#f1f5f9',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    color: '#2563eb',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => {e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1d4ed8'}}
                                                onMouseOut={(e) => {e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#2563eb'}}
                                            >
                                                <Eye size={18} />
                                            </button>

                                            <div className="actions-dropdown-container">
                                                <button 
                                                    className="btn-icon-action" 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        
                                                        if (activeMenuId === m.real_id) {
                                                            setActiveMenuId(null);
                                                            setMenuMatricula(null);
                                                        } else {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setMenuPosition({
                                                                top: rect.bottom + 5,
                                                                left: Math.max(10, Math.min(window.innerWidth - 220, rect.right - 210))
                                                            });
                                                            setMenuMatricula(m);
                                                            setActiveMenuId(m.real_id);
                                                        }
                                                    }}
                                                    title="Mais Opções"
                                                    style={{ 
                                                        background: activeMenuId === m.real_id ? '#f1f5f9' : 'transparent',
                                                        color: activeMenuId === m.real_id ? 'var(--primary-color)' : '#64748b',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        padding: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <Pagination 
                    totalItems={filteredMatriculas.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* DETAILS MODAL (REDESIGN) */}
            {selectedMatricula && (
                <div className="modal-overlay" onClick={() => setSelectedMatricula(null)}>
                    
                    {/* Lightbox for Image Zoom */}
                    <div className="detail-modal-card matriculas-page" onClick={(e) => e.stopPropagation()}>
                         <button className="btn-close-modal" onClick={() => setSelectedMatricula(null)}>
                            <X size={24} color="#64748b" />
                        </button>
                        
                        <div className="detail-modal-grid">
                            
                            {/* LEFT SIDEBAR: EMERALD THEME */}
                            <div className="profile-sidebar">
                                <div className="profile-avatar-large" onClick={() => {
                                    if (selectedMatricula.foto) {
                                        const win = window.open("", "_blank");
                                        win.document.write(`<img src="${selectedMatricula.foto}" style="max-width:100%; height:auto;">`);
                                        win.focus();
                                    }
                                }} title="Clique para ampliar">
                                    {selectedMatricula.foto ? (
                                        <img src={selectedMatricula.foto} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                    ) : (
                                        <User size={64} />
                                    )}
                                </div>
                                <h2 className="profile-name">{selectedMatricula.aluno}</h2>
                                <p className="profile-id">ID: {selectedMatricula.id}</p>
                                
                                <div style={{
                                    background: 'rgba(255,255,255,0.2)', 
                                    padding: '8px 16px', 
                                    borderRadius: '8px', 
                                    marginBottom: '32px',
                                    fontWeight: '700',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}>
                                    {selectedMatricula.status}
                                </div>

                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadFicha(selectedMatricula.real_id, selectedMatricula.id);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#fff',
                                        color: '#b45309',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        marginBottom: '20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <FileText size={18} /> Baixar Ficha
                                </button>

                                <div className="profile-footer">
                                    <div className="profile-footer-item">
                                        <Calendar size={18} />
                                        <span>Matrícula: {selectedMatricula.dataMatricula}</span>
                                    </div>
                                    <div className="profile-footer-item">
                                        <BookOpen size={18} />
                                        <span>Classe: {selectedMatricula.classe}</span>
                                    </div>
                                    <div className="profile-footer-item">
                                        <Home size={18} />
                                        <span>Turma: {selectedMatricula.turma}</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT CONTENT */}
                            <div className="content-area">
                                
                                {/* 1. Dados Pessoais */}
                                <div className="info-section">
                                    <div className="section-title"><User size={20} color="#b45309" /> Dados do Estudante</div>
                                    <div className="info-grid-2">
                                        <div><p className="info-label">Nome Completo</p><p className="info-value">{selectedMatricula.aluno}</p></div>
                                        <div><p className="info-label">Género</p><p className="info-value">{selectedMatricula.detalhes.genero}</p></div>
                                        <div><p className="info-label">Nascimento</p><p className="info-value">{selectedMatricula.detalhes.dataNascimento}</p></div>
                                        <div><p className="info-label">Bilhete de Identidade</p><p className="info-value monospace">{selectedMatricula.detalhes.bi}</p></div>
                                        <div><p className="info-label">Email</p><p className="info-value">{selectedMatricula.detalhes.email}</p></div>
                                        <div><p className="info-label">Endereço</p><p className="info-value">{selectedMatricula.detalhes.endereco}</p></div>
                                    </div>
                                </div>

                                {/* 2. Dados Académicos */}
                                <div className="info-section">
                                    <div className="section-title"><BookOpen size={20} color="#b45309" /> Informações Académicas</div>
                                    <div className="info-grid-2">
                                        <div><p className="info-label">Ano Lectivo</p><p className="info-value">{selectedMatricula.anoLectivo}</p></div>
                                        <div><p className="info-label">Curso</p><p className="info-value">{selectedMatricula.curso}</p></div>
                                        <div><p className="info-label">Classe/Nível</p><p className="info-value">{selectedMatricula.classe}</p></div>
                                        <div><p className="info-label">Turno</p><p className="info-value">{selectedMatricula.turno}</p></div>
                                        <div style={{gridColumn: 'span 2', background: '#fffbeb', padding: '16px', borderRadius: '12px', marginTop: '8px', border: '1px solid #fcd34d'}}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                <Home size={20} color="#b45309" />
                                                <div>
                                                    <p className="info-label" style={{color: '#b45309', marginBottom: '4px'}}>SALA & TURMA ATRIBUÍDA</p>
                                                    <p className="info-value" style={{fontSize: '18px'}}>{selectedMatricula.sala} • {selectedMatricula.turma}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* 2.5 Histórico Escolar (Se Transferido) */}
                                {selectedMatricula.detalhes.historico && selectedMatricula.detalhes.historico.length > 0 && (
                                    <div className="info-section">
                                        <div className="section-title"><FileText size={20} color="#b45309" /> Histórico Escolar (Transferência)</div>
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
                                                    {selectedMatricula.detalhes.historico.map((h, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ padding: '8px 12px' }}>{h.escola}</td>
                                                            <td style={{ padding: '8px 12px' }}>{h.ano}</td>
                                                            <td style={{ padding: '8px 12px' }}>{h.classe}</td>
                                                            <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{h.media}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Encarregado */}
                                <div className="info-section">
                                    <div className="section-title"><User size={20} color="#b45309" /> Encarregado de Educação</div>
                                    <div className="info-grid-2">
                                        <div><p className="info-label">Nome do Encarregado</p><p className="info-value">{selectedMatricula.detalhes.encarregado}</p></div>
                                        <div><p className="info-label">Parentesco</p><p className="info-value">{selectedMatricula.detalhes.parentesco}</p></div>
                                        <div><p className="info-label">Contacto Telefónico</p><p className="info-value">{selectedMatricula.detalhes.telefoneEncarregado}</p></div>
                                    </div>
                                </div>

                                {/* 4. Financeiro e Docs */}
                                <div className="info-section">
                                    <div className="section-title"><CreditCard size={20} color="#b45309" /> Financeiro & Documentação</div>
                                    
                                    <div style={{display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap'}}>
                                        <div style={{ flex: 1, minWidth: '240px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                            <p className="info-label">ESTADO DO PAGAMENTO</p>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px'}}>
                                                 <CheckCircle size={24} color={selectedMatricula.detalhes.pagamentoStatus === 'Confirmado' ? '#15803d' : '#eab308'} />
                                                 <span style={{fontSize: '18px', fontWeight: '700', color: selectedMatricula.detalhes.pagamentoStatus === 'Confirmado' ? '#15803d' : '#ca8a04'}}>
                                                     {selectedMatricula.detalhes.pagamentoStatus}
                                                 </span>
                                            </div>
                                        </div>

                                        <div style={{ flex: 1.5, minWidth: '240px' }}>
                                            <p className="info-label" style={{marginBottom: '10px'}}>DOCUMENTOS ENTREGUES</p>
                                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                                                {selectedMatricula.detalhes.documentos.length > 0 ? selectedMatricula.detalhes.documentos.map((doc, i) => (
                                                    <span key={i} style={{
                                                        background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px'
                                                    }}>
                                                        <CheckCircle size={14} color="#b45309"/> {doc}
                                                    </span>
                                                )) : <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Nenhum documento registado.</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PERMUTA MODAL */}
            <PermutaModal 
                isOpen={showPermutaModal} 
                onClose={() => setShowPermutaModal(false)} 
                onSuccess={() => { setShowPermutaModal(false); refresh(true); }}
            />

            {/* EDIT MATRICULA MODAL */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="form-modal-card" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px'}}>
                        <div className="form-modal-header">
                            <div>
                                <h2>Editar Matrícula</h2>
                                <p>Atualize o estado e vínculo acadêmico.</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="btn-close-form">
                                <X size={24} color="#64748b" />
                            </button>
                        </div>

                        <form className="form-container" onSubmit={handleUpdate}>
                            <div className="form-grid">
                                <div className="form-group form-group-full">
                                    <label>Estado da Matrícula</label>
                                    <select 
                                        className="form-select"
                                        value={modalFormData.status}
                                        onChange={e => setModalFormData({...modalFormData, status: e.target.value})}
                                    >
                                        <option value="Ativa">Ativa</option>
                                        <option value="Confirmada">Confirmada</option>
                                        <option value="Concluida">Concluída</option>
                                        <option value="Transferido">Transferido</option>
                                        <option value="Desistente">Desistente</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Sala</label>
                                    <select 
                                        className="form-select"
                                        value={modalFormData.id_sala}
                                        onChange={e => setModalFormData({...modalFormData, id_sala: e.target.value})}
                                    >
                                        <option value="">Manter Atual</option>
                                        {salasDisponiveis.map(s => <option key={s.id_sala} value={s.id_sala}>Sala {s.numero_sala}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Turma</label>
                                    <select 
                                        className="form-select"
                                        value={modalFormData.id_turma}
                                        onChange={e => setModalFormData({...modalFormData, id_turma: e.target.value})}
                                    >
                                        <option value="">Manter Atual / Sem Turma</option>
                                        {turmasDisponiveis.map(t => <option key={t.id_turma} value={t.id_turma}>{t.codigo_turma}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-confirm">
                                    Salvar Alterações <ChevronRight size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Portal-like Actions Dropdown */}
            {activeMenuId && menuMatricula && (
                <div 
                    className="dropdown-menu"
                    style={{
                        position: 'fixed',
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        zIndex: 10000,
                        margin: 0,
                        display: 'block',
                        minWidth: '220px',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #e2e8f0',
                        padding: '6px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {hasPermission(PERMISSIONS.EDIT_MATRICULA) && (
                        <button 
                            className="dropdown-item" 
                            onClick={() => { handleEdit(menuMatricula); setActiveMenuId(null); setMenuMatricula(null); }}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 12px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: '#1e293b',
                                fontSize: '14px',
                                fontWeight: 500,
                                marginBottom: '2px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Edit size={16} color="#64748b" /> Editar Matrícula
                        </button>
                    )}



                    {hasPermission(PERMISSIONS.CREATE_MATRICULA) && (
                        <div style={{ padding: '4px 0', borderTop: '1px solid #f1f5f9', marginTop: '4px' }}>
                            <div className="dropdown-section-title" style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                                Próximo Ano Lectivo
                            </div>
                            <button 
                                className="dropdown-item success" 
                                onClick={() => navigate(`/matriculas/nova?aluno_id=${menuMatricula.alunoId}&tipo=Confirmacao`)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 12px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: '#059669',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#ecfdf5'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <CheckCircle size={16} color="#059669" /> Confirmar Matrícula
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Matriculas;