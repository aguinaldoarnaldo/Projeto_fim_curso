import React, { useState, useEffect, useRef } from 'react';
import './Alunos.css';

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
    GraduationCap
} from 'lucide-react';

import Pagination from '../../components/Common/Pagination';

const Alunos = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showNewStudentModal, setShowNewStudentModal] = useState(false);
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

    // Filters State
    const [filters, setFilters] = useState({
        ano: '',
        sala: '',
        curso: '',
        turma: '',
        classe: ''
    });

    // Generate 50 mock students
    const studentsData = Array.from({ length: 150 }, (_, i) => {
        const id = i + 1;
        const padId = id.toString().padStart(3, '0');
        const cursos = ['Informática', 'Gestão', 'Direito', 'Enfermagem'];
        const classes = ['10ª Classe', '11ª Classe', '12ª Classe'];
        const turnos = ['Manhã', 'Tarde', 'Noite'];
        const salas = ['L-01', 'S-204', 'S-102', 'L-05'];
        const statusList = ['Ativo', 'Suspenso', 'Concluído'];
        
        // Mock Avatar URLs pool
        const avatarImages = [
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
            "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
            "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
            "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
        ];
        
        // Assign photo
        let fotoUrl = avatarImages[i % avatarImages.length];

        const curso = cursos[i % cursos.length];
        const status = statusList[i % statusList.length];

        return {
            id: `ALU-2024-${padId}`,
            nome: `Aluno Exemplo ${id}`,
            foto: fotoUrl,
            anoLectivo: i % 3 === 0 ? '2023/2024' : '2024/2025',
            classe: classes[i % classes.length],
            curso: curso,
            sala: salas[i % salas.length],
            turno: turnos[i % turnos.length],
            turma: `${curso.substring(0, 3).toUpperCase()}${classes[i % classes.length].substring(0, 2)}${String.fromCharCode(65 + (i % 3))}`,
            status: status,
            dataMatricula: `${(i % 28) + 1} Jan 2024`,
            detalhes: {
                nif: `A${padId}123456`,
                nascimento: `${(i % 28) + 1}/05/${2005 + (i % 4)}`,
                encarregado: `Encarregado ${id}`,
                telefone: `+244 923 ${padId} ${padId}`,
                email: `aluno${id}@email.com`,
                endereco: 'Luanda, Angola',
                bi: `00${padId}12345LA${padId.slice(-2)}`,
                obs: i % 5 === 0 ? 'Observação de teste.' : ''
            }
        };
    });


    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const filteredStudents = studentsData.filter(student => {
        const matchesSearch =
            student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.detalhes?.bi && student.detalhes.bi.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilters =
            (filters.ano === '' || student.anoLectivo === filters.ano) &&
            (filters.classe === '' || student.classe === filters.classe) &&
            (filters.curso === '' || student.curso === filters.curso) &&
            (filters.sala === '' || student.sala === filters.sala) &&
            (filters.turma === '' || student.turma === filters.turma);

        return matchesSearch && matchesFilters;
    });

    // Pagination Slicing
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Ativo': return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
            case 'Suspenso': return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' };
            case 'Concluído': return { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' };
            default: return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="alunos-header-content">
                    <div>
                        <h1>Gestão de Estudantes</h1>
                        <p>Visualização e administração de todos os alunos registrados.</p>
                    </div>
                    <button
                        onClick={() => setShowNewStudentModal(true)}
                        className="btn-primary-action"
                    >
                        <Plus size={20} />
                        Novo Aluno
                    </button>
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
                                    <option value="2024/2025">2024/2025</option>
                                    <option value="2023/2024">2023/2024</option>
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label>Classe</label>
                                <select name="classe" value={filters.classe} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="selecao-filtro">
                                    <option value="">Todas</option>
                                    <option value="10ª Classe">10ª Classe</option>
                                    <option value="11ª Classe">11ª Classe</option>
                                    <option value="12ª Classe">12ª Classe</option>
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label>Curso</label>
                                <select name="curso" value={filters.curso} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="selecao-filtro">
                                    <option value="">Todos</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label>Sala</label>
                                <select name="sala" value={filters.sala} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="selecao-filtro">
                                    <option value="">Todas</option>
                                    <option value="L-01">L-01</option>
                                    <option value="S-204">S-204</option>
                                    <option value="S-102">S-102</option>
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label>Turma</label>
                                <select name="turma" value={filters.turma} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="selecao-filtro">
                                    <option value="">Todas</option>
                                    <option value="INF10A">INF10A</option>
                                    <option value="GST12B">GST12B</option>
                                    <option value="DIR11C">DIR11C</option>
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
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nº Aluno</th>
                                <th>Nome Completo</th>
                                <th>Ano Lectivo</th>
                                <th>Classe</th>
                                <th>Curso</th>
                                <th>Sala</th>
                                <th>Turno</th>
                                <th>Turma</th>
                                <th>Estado</th>
                                <th>Data Matrícula</th>
                                <th style={{ textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentStudents.map((s) => (
                                <tr key={s.id} onClick={() => setSelectedStudent(s)} className="clickable-row">
                                    <td className="student-id">{s.id}</td>
                                    <td>
                                        <div className="student-info">
                                            <div className="student-avatar" style={{ 
                                                width: '36px', 
                                                height: '36px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                                background: s.foto ? 'white' : '#e0e7ff',
                                                border: s.foto ? '1px solid #e2e8f0' : 'none'
                                            }}>
                                                {s.foto ? (
                                                    <img src={s.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <User size={16} />
                                                )}
                                            </div>
                                            <span className="student-name">{s.nome}</span>
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
                                    <td className="student-date">{s.dataMatricula}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className="btn-more-actions">
                                            <MoreVertical size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    totalItems={filteredStudents.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Student Detail Central Modal */}
            {selectedStudent && (
                <div className="modal-overlay">
                    <div className="detail-modal-card">
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
                                <div className="info-section">
                                    <h3 className="section-title">
                                        <User size={20} /> Informações do Aluno
                                    </h3>
                                    <div className="info-grid">
                                        <div>
                                            <p className="info-label">Nº BILHETE IDENTIDADE</p>
                                            <p className="info-value">{selectedStudent.detalhes.bi}</p>
                                        </div>
                                        <div>
                                            <p className="info-label">NIF</p>
                                            <p className="info-value">{selectedStudent.detalhes.nif}</p>
                                        </div>
                                        <div>
                                            <p className="info-label">DATA NASCIMENTO</p>
                                            <p className="info-value">{selectedStudent.detalhes.nascimento}</p>
                                        </div>
                                        <div>
                                            <p className="info-label">ENCARREGADO</p>
                                            <p className="info-value">{selectedStudent.detalhes.encarregado}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="info-section">
                                    <h3 className="section-title">
                                        <Mail size={20} /> Contactos e Morada
                                    </h3>
                                    <div className="contact-list">
                                        <div className="contact-item">
                                            <Phone size={18} />
                                            <span className="contact-text">{selectedStudent.detalhes.telefone}</span>
                                        </div>
                                        <div className="contact-item">
                                            <Mail size={18} />
                                            <span className="contact-text">{selectedStudent.detalhes.email}</span>
                                        </div>
                                        <div className="contact-item">
                                            <MapPin size={18} />
                                            <span className="contact-text">{selectedStudent.detalhes.endereco}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="section-title">
                                        <ClipboardList size={20} /> Observações Internas
                                    </h3>
                                    <div className="observations-box">
                                        {selectedStudent.detalhes.obs}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* New Student Form Modal */}
            {showNewStudentModal && (
                <div className="modal-overlay">
                    <div className="form-modal-card">
                        <div className="form-modal-header">
                            <div>
                                <h2>Novo Registro de Aluno</h2>
                                <p>Preencha os dados básicos para iniciar a matrícula.</p>
                            </div>
                            <button
                                onClick={() => setShowNewStudentModal(false)}
                                className="btn-close-form">
                                <X size={24} color="#64748b" />
                            </button>
                        </div>

                        <form className="form-container" onSubmit={(e) => e.preventDefault()}>
                            <div className="form-grid">
                                <div className="form-group form-group-full">
                                    <label>Nome Completo</label>
                                    <input type="text" placeholder="Ex: João Manuel dos Santos" className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Nº Bilhete de Identidade</label>
                                    <input type="text" placeholder="000XXXXXXXLA0XX" className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>NIF</label>
                                    <input type="text" placeholder="XXXXXXX" className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Curso</label>
                                    <select className="form-select">
                                        <option>Seleccionar Curso</option>
                                        <option>Informática</option>
                                        <option>Gestão</option>
                                        <option>Direito</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Classe</label>
                                    <select className="form-select">
                                        <option>Seleccionar Classe</option>
                                        <option>10ª Classe</option>
                                        <option>11ª Classe</option>
                                        <option>12ª Classe</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    onClick={() => setShowNewStudentModal(false)}
                                    className="btn-cancel">Cancelar</button>
                                <button
                                    className="btn-confirm">
                                    Confirmar Registro <ChevronRight size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Alunos;