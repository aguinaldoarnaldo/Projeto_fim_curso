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
            setLoading(true);
            const response = await api.get('cursos/');
            console.log("API Cursos Response:", response);
            
            // Handle different response structures (pagination vs flat array)
            let data = [];
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data && Array.isArray(response.data.results)) {
                data = response.data.results;
            } else {
                console.warn("Formato de resposta inesperado:", response.data);
                data = [];
            }
            
            console.log("Dados processados:", data);

            const formattedCourses = data.map(c => ({
                id: c.id_curso,
                nome: String(c.nome_curso || 'Sem Nome'),
                duracao: c.duracao ? `${c.duracao} Anos` : 'N/A',
                coordenador: String(c.responsavel_nome || 'Sem Coordenador')
            }));
            setCourses(formattedCourses);
            setCache('cursos', formattedCourses);
            setError(null);
            setLoading(false);
        } catch (err) {
            console.error('Erro ao buscar cursos:', err);
            setError('Falha ao carregar cursos: ' + (err.response?.data?.detail || err.message));
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
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
                    <button className="btn-new-course">
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
                                    <th>ID do Curso</th>
                                    <th>Nome do Curso</th>
                                    <th>Duração</th>
                                    <th>Coordenador</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {error ? (
                                    <tr>
                                        <td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#ef4444'}}>
                                            {error}
                                        </td>
                                    </tr>
                                ) : filteredCourses.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                                            Nenhum curso encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCourses.map((course) => (
                                        <tr key={course.id} className="animate-fade-in">
                                            <td className="course-id">{course.id}</td>
                                            <td>
                                                <div className="course-info">
                                                    <div className="course-icon-bg">
                                                        <BookOpen size={16} />
                                                    </div>
                                                    <span className="course-name">{course.nome}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="duration-info">
                                                    <Clock size={14} />
                                                    <span>{course.duracao}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="coordinator-info">
                                                    <div className="coordinator-avatar">
                                                        <User size={14} />
                                                    </div>
                                                    <span>{course.coordenador}</span>
                                                </div>
                                            </td>
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
        </div>
    );
};

export default Cursos;
