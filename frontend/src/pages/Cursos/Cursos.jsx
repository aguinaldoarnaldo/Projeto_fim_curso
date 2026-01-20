import React, { useState, useEffect } from 'react';
import './Cursos.css';

import {
    Search,
    Plus,
    Edit3,
    BookOpen,
    Clock,
    User
} from 'lucide-react';
import api from '../../services/api';
import { useCache } from '../../context/CacheContext';

const Cursos = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // State for courses
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCourseData, setNewCourseData] = useState({ nome_curso: '', duracao: 4 });

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
                coordenador: String(c.responsavel_nome || 'Sem Coordenador')
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

    const handleCreateCourse = async () => {
        if (!newCourseData.nome_curso) {
            alert("Nome do curso é obrigatório!");
            return;
        }

        try {
            await api.post('cursos/', newCourseData);
            alert("Curso criado com sucesso!");
            setShowCreateModal(false);
            setNewCourseData({ nome_curso: '', duracao: 4 });
            fetchCourses(true); // Auto-refresh!
        } catch (error) {
            console.error("Erro ao criar curso:", error);
            alert("Erro ao criar curso. Verifique o console.");
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchCourses(true);
    }, []);

    // Real-time Update (Polling)
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchCourses(true);
        }, 2000); // Updates every 2 seconds

        return () => clearInterval(intervalId);
    }, []);

    const filteredCourses = (Array.isArray(courses) ? courses : []).filter(course => {
        if (!course) return false;
        const search = searchTerm.toLowerCase();
        return (
            (course.nome && String(course.nome).toLowerCase().includes(search)) ||
            (course.id && String(course.id).toLowerCase().includes(search)) ||
            (course.coordenador && String(course.coordenador).toLowerCase().includes(search))
        );
    });

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="cursos-header-content">
                    <div>
                        <h1>Gestão de Cursos</h1>
                        <p>Administração dos cursos e grades curriculares da instituição.</p>
                    </div>
                    <button className="btn-new-course" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} />
                        Novo Curso
                    </button>
                </div>
            </header>
            
            <div className="table-card">
                <div className="search-container">
                    <div className="search-wrapper">
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
                </div>


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
                                                <button
                                                    className="btn-edit-course"
                                                    title="Editar Curso"
                                                >
                                                    <Edit3 size={16} />
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {/* Modal de Criação */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', padding: '30px', borderRadius: '12px',
                        width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{marginTop: 0, marginBottom: '20px', color: '#1e293b'}}>Novo Curso</h2>
                        
                        <div style={{marginBottom: '15px'}}>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 500, color: '#475569'}}>Nome do Curso</label>
                            <input 
                                type="text" 
                                style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}}
                                value={newCourseData.nome_curso}
                                onChange={e => setNewCourseData({...newCourseData, nome_curso: e.target.value})}
                                placeholder="Ex: Engenharia Informática"
                            />
                        </div>

                        <div style={{marginBottom: '20px'}}>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 500, color: '#475569'}}>Duração (Anos)</label>
                            <input 
                                type="number" 
                                style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}}
                                value={newCourseData.duracao}
                                onChange={e => setNewCourseData({...newCourseData, duracao: parseInt(e.target.value)})}
                                min="1" max="6"
                            />
                        </div>

                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                style={{padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', color: '#475569'}}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleCreateCourse}
                                style={{padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 500}}
                            >
                                Criar Curso
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cursos;
