import React, { useState } from 'react';
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

const Alunos = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showNewStudentModal, setShowNewStudentModal] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        ano: '',
        sala: '',
        curso: '',
        turma: '',
        classe: ''
    });

    const studentsData = [
        {
            id: 'ALU-2024-001',
            nome: 'Ana Paula Lourenço',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-002',
            nome: 'Bruno Costa',
            anoLectivo: '2024/2025',
            classe: '12ª Classe',
            curso: 'Gestão',
            sala: 'S-204',
            turno: 'Tarde',
            turma: 'GST12B',
            status: 'Suspenso',
            dataMatricula: '10 Jan 2024',
            detalhes: {
                nif: 'B00987654',
                nascimento: '03/11/2006',
                encarregado: 'Carla Costa',
                telefone: '+244 931 222 333',
                email: 'bruno.costa@email.com',
                endereco: 'Cazenga, Luanda',
                bi: '009876543LA092',
                obs: 'Aguardando regularização de mensalidade.'
            }
        },
        {
            id: 'ALU-2024-003',
            nome: 'Carla Dias Macaia',
            anoLectivo: '2023/2024',
            classe: '11ª Classe',
            curso: 'Direito',
            sala: 'S-102',
            turno: 'Noite',
            turma: 'DIR11C',
            status: 'Concluído',
            dataMatricula: '15 Jan 2023',
            detalhes: {
                nif: 'C00456123',
                nascimento: '20/09/2005',
                encarregado: 'Manuel Macaia',
                telefone: '+244 944 444 555',
                email: 'carla.macaia@email.com',
                endereco: 'Viana, Luanda',
                bi: '004561234LA011',
                obs: 'Graduada com distinção.'
            }
        },
        {
            id: 'ALU-2024-004',
            nome: 'Aguinaldo Arnaldo',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'S-201',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '20 Jan 2024',
            detalhes: {
                nif: 'D00123456',
                nascimento: '07/07/2005',
                encarregado: 'Julia Maria',
                telefone: '+244 922 666 777',
                email: 'aguinaldoarnaldo5@gmail.com',
                endereco: 'Mombamba, Luanda',
                bi: '001234567LA022',
                obs: 'Regularização de mensalidade pendente.'
            }
        },
        {
            id: 'ALU-2024-005',
            nome: 'Manuela Lisboa',
            anoLectivo: '2023/2024',
            classe: '11ª Classe',
            curso: 'Direito',
            sala: 'S-102',
            turno: 'Manhã',
            turma: 'DIR11C',
            status: 'Concluído',
            dataMatricula: '15 Jan 2023',
            detalhes: {
                nif: 'C00456123',
                nascimento: '20/09/2005',
                encarregado: 'Manuel Lisboa',
                telefone: '+244 944 444 555',
                email: 'manuelalisboa5@gmail.com',
                endereco: 'Viana, Luanda',
                bi: '004561234LA011',
                obs: 'Graduada com distinção.'
            }
        },
    ];

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Gestão de Estudantes</h1>
                        <p>Visualização e administração de todos os alunos registrados.</p>
                    </div>
                    <button
                        onClick={() => setShowNewStudentModal(true)}
                        className="btn-new-student nav-item-active"
                    >
                        <Plus size={20} />
                        Novo Aluno
                    </button>
                </div>
            </header>

            <div className="table-card">
                {/* Search and Filters Header */}
                <div className="search-filter-header">
                    <div className="search-input-container">
                        <Search className="search-input-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou ID do aluno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-toggle-filters"
                        style={{
                            background: showFilters ? '#1e3a8a' : 'white',
                            color: showFilters ? 'white' : '#374151'
                        }}
                    >
                        <Filter size={18} />
                        Filtros
                    </button>
                </div>


                {/* Dynamic Filters */}
                {showFilters && (
                    <div className="filters-panel">
                        <div className="filters-grid">
                            <div className="filter-group">
                                <label>Ano Lectivo</label>
                                <select name="ano" value={filters.ano} onChange={handleFilterChange} className="filter-select">
                                    <option value="">Todos</option>
                                    <option value="2024/2025">2024/2025</option>
                                    <option value="2023/2024">2023/2024</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Classe</label>
                                <select name="classe" value={filters.classe} onChange={handleFilterChange} className="filter-select">
                                    <option value="">Todas</option>
                                    <option value="10ª Classe">10ª Classe</option>
                                    <option value="11ª Classe">11ª Classe</option>
                                    <option value="12ª Classe">12ª Classe</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Curso</label>
                                <select name="curso" value={filters.curso} onChange={handleFilterChange} className="filter-select">
                                    <option value="">Todos</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Sala</label>
                                <select name="sala" value={filters.sala} onChange={handleFilterChange} className="filter-select">
                                    <option value="">Todas</option>
                                    <option value="L-01">L-01</option>
                                    <option value="S-204">S-204</option>
                                    <option value="S-102">S-102</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Turma</label>
                                <select name="turma" value={filters.turma} onChange={handleFilterChange} className="filter-select">
                                    <option value="">Todas</option>
                                    <option value="INF10A">INF10A</option>
                                    <option value="GST12B">GST12B</option>
                                    <option value="DIR11C">DIR11C</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setFilters({ ano: '', sala: '', curso: '', turma: '', classe: '' })}
                                className="btn-reset-filters">
                                <X size={16} /> Resetar Filtros
                            </button>
                        </div>
                    </div>
                )}


                {/* Students Table */}
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '150px' }}>Nº Aluno</th>
                                <th style={{ minWidth: '220px' }}>Nome Completo</th>
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
                            {studentsData.map((s) => (
                                <tr key={s.id} onClick={() => setSelectedStudent(s)} className="clickable-row">
                                    <td className="student-id">{s.id}</td>
                                    <td>
                                        <div className="student-info">
                                            <div className="student-avatar">
                                                {s.nome.charAt(0)}
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
                                <div className="profile-avatar-large">
                                    {selectedStudent.nome.charAt(0)}
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