import React, { useState } from 'react';
import './Cursos.css';

import {
    Search,
    Plus,
    Edit3,
    BookOpen,
    Clock,
    User
} from 'lucide-react';

const Cursos = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const coursesData = [
        {
            id: 'CUR-001',
            nome: 'Informática de Gestão',
            duracao: '3 Anos',
            coordenador: 'Prof. Marcos André'
        },
        {
            id: 'CUR-002',
            nome: 'Gestão de Empresas',
            duracao: '3 Anos',
            coordenador: 'Profª. Maria Helena'
        },
        {
            id: 'CUR-003',
            nome: 'Direito Civil',
            duracao: '4 Anos',
            coordenador: 'Dr. Lucas Bento'
        },
        {
            id: 'CUR-004',
            nome: 'Contabilidade e Auditoria',
            duracao: '3 Anos',
            coordenador: 'Prof. João Paulo'
        },
        {
            id: 'CUR-005',
            nome: 'Engenharia de Software',
            duracao: '4 Anos',
            coordenador: 'Eng. Ricardo Santos'
        }
    ];

    const filteredCourses = coursesData.filter(course =>
        course.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.coordenador.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            {filteredCourses.map((course) => (
                                <tr key={course.id}>
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

                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Cursos;
