import React, { useState } from 'react';
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Gestão de Cursos</h1>
                        <p>Administração dos cursos e grades curriculares da instituição.</p>
                    </div>
                    <button
                        style={{
                            height: 'fit-content',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            backgroundColor: '#1e3a8a',
                            color: 'white',
                            fontWeight: 600
                        }}
                    >
                        <Plus size={18} />
                        Novo Curso
                    </button>
                </div>
            </header>

            <div className="table-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                outline: 'none',
                                background: '#f9fafb'
                            }}
                        />
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '120px' }}>ID do Curso</th>
                                <th>Nome do Curso</th>
                                <th>Duração</th>
                                <th>Coordenador</th>
                                <th style={{ textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.map((course) => (
                                <tr key={course.id}>
                                    <td style={{ fontWeight: 600, color: '#1e3a8a' }}>{course.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ background: '#eff6ff', color: '#1e3a8a', padding: '8px', borderRadius: '8px' }}>
                                                <BookOpen size={16} />
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{course.nome}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                            <Clock size={14} />
                                            <span>{course.duracao}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                                                <User size={14} />
                                            </div>
                                            <span>{course.coordenador}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#3b82f6',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '14px',
                                                fontWeight: 600
                                            }}
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
