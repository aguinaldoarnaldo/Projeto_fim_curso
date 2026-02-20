import React, { useState, useEffect } from 'react';
import './Cursos.css';

import {
    Search,
    Plus,
    Edit3,
    BookOpen,
    Clock,
    User,
    Filter
} from 'lucide-react';
import FilterModal from '../../components/Common/FilterModal';
import api from '../../services/api';
import { parseApiError } from '../../utils/errorParser';
import { useCache } from '../../context/CacheContext';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';

const Cursos = () => {
    const { hasPermission } = usePermission();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        area: '',
        duracao: ''
    });

    // State for courses
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    
    // Form Data
    const [formData, setFormData] = useState({ 
        nome_curso: '', 
        duracao: 4,
        id_area_formacao: '',
        id_responsavel: ''
    });

    // Aux Data
    const [areasFormacao, setAreasFormacao] = useState([]);
    const [coordenadores, setCoordenadores] = useState([]);

    // Fetch courses from API
    // Cache
    const { getCache, setCache } = useCache();

    // Fetch courses from API
    const fetchCourses = async (force = false) => {
        if (!force) {
            const cachedData = getCache('cursos');
            if (cachedData) {
                setCourses(cachedData);
                setLoading(false);
                return;
            }
        }

        try {
            // Note: We don't set loading=true here to avoid flashing UI during polling
            const response = await api.get('cursos/');
            
            // Handle different response structures (pagination vs flat array)
            let data = [];
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data && Array.isArray(response.data.results)) {
                data = response.data.results;
            } else {
                data = [];
            }
            
            const formattedCourses = data.map(c => ({
                id: c.id_curso,
                nome: String(c.nome_curso || 'Sem Nome'),
                area: c.area_formacao_nome || 'N/A',
                duracao: c.duracao ? `${c.duracao} Anos` : 'N/A',
                totalTurmas: c.total_turmas || 0,
                coordenador: String(c.responsavel_nome || 'Sem Coordenador'),
                // Raw data for editing
                raw: c
            }));
            setCourses(formattedCourses);
            setCache('cursos', formattedCourses);
            setError(null);
            setLoading(false);
        } catch (err) {
            console.error('Erro ao buscar cursos:', err);
            // Don't show error on polling failures to avoid interrupting user
            if (loading) {
                setError('Falha ao carregar cursos: ' + (err.response?.data?.detail || err.message));
                setLoading(false);
            }
        }
    };

    const handleSaveCourse = async () => {
        if (!formData.nome_curso) {
            alert("Nome do curso é obrigatório!");
            return;
        }

        try {
            const payload = {
                nome_curso: formData.nome_curso,
                duracao: formData.duracao,
                id_area_formacao: formData.id_area_formacao || null,
                id_responsavel: formData.id_responsavel || null
            };

            if (modalMode === 'create') {
                await api.post('cursos/', payload);
                alert("Curso criado com sucesso!");
            } else {
                await api.put(`cursos/${selectedCourseId}/`, payload);
                alert("Curso atualizado com sucesso!");
            }

            setShowCreateModal(false);
            resetForm();
            fetchCourses(true); // Auto-refresh!
        } catch (error) {
            console.error("Erro ao salvar curso:", error);
            const msg = parseApiError(error, "Erro ao salvar curso.");
            alert(msg);
        }
    };

    const handleEdit = (course) => {
        setModalMode('edit');
        setSelectedCourseId(course.id);
        
        // Populate form using raw data if available, or fallback
        const raw = course.raw || {};
        setFormData({
            nome_curso: raw.nome_curso || course.nome,
            duracao: raw.duracao || 4,
            id_area_formacao: raw.id_area_formacao || '',
            id_responsavel: raw.id_responsavel || ''
        });
        setShowCreateModal(true);
    };

    const resetForm = () => {
        setFormData({ 
            nome_curso: '', 
            duracao: 4,
            id_area_formacao: '',
            id_responsavel: ''
        });
        setModalMode('create');
        setSelectedCourseId(null);
    };

    // Initial Fetch & Aux Data
    useEffect(() => {
        fetchCourses(true);
        
        // Fetch Aux Data (Areas & Coordinators)
        const fetchAuxData = async () => {
             try {
                 const [resAreas, resFuncionarios] = await Promise.all([
                     api.get('areas-formacao/'),
                     api.get('funcionarios/')
                 ]);
                 setAreasFormacao(resAreas.data.results || resAreas.data || []);
                 setCoordenadores(resFuncionarios.data.results || resFuncionarios.data || []);
             } catch (e) {
                 console.error("Erro ao carregar dados auxiliares", e);
             }
        };
        fetchAuxData();
    }, []);

    // Real-time Update (Polling)
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchCourses(true);
        }, 2000); // Updates every 2 seconds

        return () => clearInterval(intervalId);
    }, []);

    const filterButtonRef = React.useRef(null);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filterConfigs = React.useMemo(() => [
        {
            key: 'area',
            label: 'Área de Formação',
            options: [...new Set(courses.map(c => c.area))].filter(Boolean).map(area => ({
                value: area,
                label: area
            }))
        },
        {
            key: 'duracao',
            label: 'Duração',
            options: [...new Set(courses.map(c => c.duracao))].filter(Boolean).map(dur => ({
                value: dur,
                label: dur
            }))
        }
    ], [courses]);

    const filteredCourses = React.useMemo(() => {
        let sortableItems = (Array.isArray(courses) ? courses : []).filter(course => {
            if (!course) return false;
            const search = searchTerm.toLowerCase();
            const matchesSearch = (
                (course.nome && String(course.nome).toLowerCase().includes(search)) ||
                (course.id && String(course.id).toLowerCase().includes(search)) ||
                (course.coordenador && String(course.coordenador).toLowerCase().includes(search))
            );

            const matchesFilters = 
                (filters.area === '' || course.area === filters.area) &&
                (filters.duracao === '' || course.duracao === filters.duracao);

            return matchesSearch && matchesFilters;
        });

        // Default sort by ID descending (newest first)
        sortableItems.sort((a, b) => (b.id || 0) - (a.id || 0));

        return sortableItems;
    }, [courses, searchTerm, filters]);

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1>Gestão de Cursos</h1>
                        <p>Administração dos cursos e grades curriculares da instituição.</p>
                    </div>
                    <div className="page-header-actions">
                        {hasPermission(PERMISSIONS.MANAGE_CURSOS) && ( 
                            <button className="btn-primary-action" onClick={() => { resetForm(); setShowCreateModal(true); }}>
                                <Plus size={18} />
                                Novo Curso
                            </button>
                        )}
                    </div>
                </div>
            </header>
            
            <div className="table-card">
                <div className="search-container" style={{ display: 'flex', gap: '15px' }}>
                    <div className="search-wrapper" style={{ flex: 1 }}>
                        <Search className="cursos-search-icon" size={18} aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Pesquisar curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                            aria-label="Pesquisar cursos"
                        />
                    </div>
                    <button 
                        ref={filterButtonRef}
                        onClick={() => setShowFilters(!showFilters)} 
                        className="btn-alternar-filtros"
                        style={{
                            background: showFilters ? 'var(--primary-color)' : 'white',
                            color: showFilters ? 'white' : 'var(--text-color)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '0 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        <Filter size={18} />
                        Filtros
                    </button>
                </div>

                <FilterModal
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    filterConfigs={filterConfigs}
                    activeFilters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={() => setFilters({ area: '', duracao: '' })}
                    triggerRef={filterButtonRef}
                />


                {loading ? (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px', color: '#64748b'}}>
                        <div className="loading-spinner" style={{width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spinner 0.8s linear infinite'}}></div>
                        <span style={{fontWeight: 500}}>A carregar cursos...</span>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nome do Curso</th>
                                    <th>Área de Formação</th>
                                    <th>Coordenador</th>
                                    <th>Duração</th>
                                    <th>Turmas</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {error ? (
                                    <tr>
                                        <td colSpan="6" style={{textAlign: 'center', padding: '40px', color: '#ef4444'}}>
                                            {error}
                                        </td>
                                    </tr>
                                ) : filteredCourses.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                                            Nenhum curso encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCourses.map((course) => (
                                        <tr key={course.id} className="animate-fade-in">
                                            <td>
                                                <div className="course-info">
                                                    <div className="course-icon-bg">
                                                        <BookOpen size={16} />
                                                    </div>
                                                    <span className="course-name">{course.nome}</span>
                                                </div>
                                            </td>
                                            <td>{course.area}</td>
                                            <td>
                                                <div className="coordinator-info">
                                                    <div className="coordinator-avatar">
                                                        <User size={14} />
                                                    </div>
                                                    <span>{course.coordenador}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="duration-info">
                                                    <Clock size={14} />
                                                    <span>{course.duracao}</span>
                                                </div>
                                            </td>
                                            <td style={{textAlign: 'center'}}>{course.totalTurmas}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                {hasPermission(PERMISSIONS.MANAGE_CURSOS) && (
                                                    <button
                                                        onClick={() => handleEdit(course)}
                                                        className="btn-edit-course"
                                                        title="Editar Curso"
                                                    >
                                                        <Edit3 size={16} />
                                                        Editar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {/* Modal de Criação / Edição */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', padding: '30px', borderRadius: '12px',
                        width: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{marginTop: 0, marginBottom: '20px', color: '#1e293b'}}>
                            {modalMode === 'create' ? 'Novo Curso' : 'Editar Curso'}
                        </h2>
                        
                        <div style={{marginBottom: '15px'}}>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 500, color: '#475569'}}>Nome do Curso</label>
                            <input 
                                type="text" 
                                style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}}
                                value={formData.nome_curso}
                                onChange={e => setFormData({...formData, nome_curso: e.target.value})}
                                placeholder="Ex: Engenharia Informática"
                            />
                        </div>

                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                             <div>
                                <label style={{display: 'block', marginBottom: '5px', fontWeight: 500, color: '#475569'}}>Duração (Anos)</label>
                                <input 
                                    type="number" 
                                    style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}}
                                    value={formData.duracao}
                                    onChange={e => setFormData({...formData, duracao: parseInt(e.target.value)})}
                                    min="1" max="6"
                                />
                             </div>
                             <div>
                                <label style={{display: 'block', marginBottom: '5px', fontWeight: 500, color: '#475569'}}>Área de Formação</label>
                                <select
                                    style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}}
                                    value={formData.id_area_formacao}
                                    onChange={e => setFormData({...formData, id_area_formacao: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {areasFormacao.map(area => (
                                        <option key={area.id_area_formacao} value={area.id_area_formacao}>
                                            {area.nome_area}
                                        </option>
                                    ))}
                                </select>
                             </div>
                        </div>

                        <div style={{marginBottom: '20px'}}>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 500, color: '#475569'}}>Coordenador</label>
                            <select
                                style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}}
                                value={formData.id_responsavel}
                                onChange={e => setFormData({...formData, id_responsavel: e.target.value})}
                            >
                                <option value="">Selecione um coordenador...</option>
                                {coordenadores.map(func => (
                                    <option key={func.id_funcionario} value={func.id_funcionario}>
                                        {func.nome_completo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                style={{padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', color: '#475569'}}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveCourse}
                                style={{padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 500}}
                            >
                                {modalMode === 'create' ? 'Criar Curso' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cursos;
