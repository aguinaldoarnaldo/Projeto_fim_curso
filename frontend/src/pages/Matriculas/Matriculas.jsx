import React, { useState, useEffect, useRef } from 'react';
import './Matriculas.css';

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
    MapPin
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import Pagination from '../../components/Common/Pagination';

const Matriculas = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMatricula, setSelectedMatricula] = useState(null);
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


    // Mock filter states
    const [filters, setFilters] = useState({
        ano: '',
        sala: '',
        curso: '',
        turma: '',
        classe: ''
    });

    // Generate 50 mock entries for pagination testing
    const matriculasData = Array.from({ length: 150 }, (_, i) => {
        const id = i + 1;
        const padId = id.toString().padStart(3, '0');
        const cursos = ['Informática', 'Gestão', 'Direito', 'Enfermagem', 'Engenharia Civil'];
        const classes = ['10ª Classe', '11ª Classe', '12ª Classe', '13ª Classe'];
        const turnos = ['Manhã', 'Tarde', 'Noite'];
        const statusList = ['Confirmada', 'Pendente', 'Em Análise', 'Rejeitada'];
        const salas = ['L-01', 'S-204', 'S-102', 'L-05', 'A-101'];
        
        const curso = cursos[i % cursos.length];
        const status = statusList[i % statusList.length];
        
        return {
            id: `MAT-2024-${padId}`,
            aluno: `Aluno Exemplo ${id}`,
            anoLectivo: i % 3 === 0 ? '2023/2024' : '2024/2025',
            classe: classes[i % classes.length],
            curso: curso,
            sala: salas[i % salas.length],
            turno: turnos[i % turnos.length],
            turma: `${curso.substring(0, 3).toUpperCase()}${classes[i % classes.length].substring(0, 2)}${String.fromCharCode(65 + (i % 3))}`,
            status: status,
            dataMatricula: `${(i % 30) + 1} Dez 2024`,
            detalhes: {
                bi: `00${padId}1234LA${padId.slice(-2)}`,
                genero: i % 2 === 0 ? 'Masculino' : 'Feminino',
                nif: `987654${padId}`,
                dataNascimento: `${(i % 28) + 1}/05/${2005 + (i % 5)}`,
                encarregado: `Encarregado do Aluno ${id}`,
                parentesco: i % 2 === 0 ? 'Pai' : 'Mãe',
                telefoneEncarregado: `+244 923 ${padId} ${padId}`,
                email: `aluno${id}@escola.com`,
                endereco: 'Luanda, Angola',
                pagamentoStatus: status === 'Confirmada' ? 'Pago' : 'Pendente',
                documentos: ['BI', 'Certificado'],
                historico: 'Histórico gerado automaticamente para testes.'
            }
        };
    });

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const filteredMatriculas = matriculasData.filter(matricula => {
        const matchesSearch =
            matricula.aluno.toLowerCase().includes(searchTerm.toLowerCase()) ||
            matricula.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilters =
            (filters.ano === '' || matricula.anoLectivo === filters.ano) &&
            (filters.classe === '' || matricula.classe === filters.classe) &&
            (filters.curso === '' || matricula.curso === filters.curso) &&
            (filters.sala === '' || matricula.sala === filters.sala) &&
            (filters.turma === '' || matricula.turma === filters.turma);

        return matchesSearch && matchesFilters;
    });

    const clearFilters = () => {
        setFilters({ ano: '', sala: '', curso: '', turma: '', classe: '' });
        setCurrentPage(1); // Reset to page 1 on clear
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Confirmada': return <span className="status-badge status-confirmed">Confirmada</span>;
            case 'Pendente': return <span className="status-badge status-pending">Pendente</span>;
            case 'Em Análise': return <span className="status-badge status-analysis">Em Análise</span>;
            default: return <span className="status-badge status-default">{status}</span>;
        }
    };

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMatriculas.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="matriculas-header-content">
                    <div>
                        <h1>Gestão de Matrículas</h1>
                        <p>Controle centralizado de matrículas e registros acadêmicos.</p>
                    </div>
                    <button
                        onClick={() => navigate('/matriculas/nova')}
                        className="btn-primary-action"
                    >
                        <Calendar size={18} />
                        Nova Matrícula
                    </button>
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
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-filtros-avancados"
                        aria-expanded={showFilters}
                        aria-label={showFilters ? "Esconder filtros avançados" : "Mostrar filtros avançados"}
                        style={{ background: showFilters ? '#1e3a8a' : 'white', color: showFilters ? 'white' : '#374151' }}
                    >
                        <Filter size={18} aria-hidden="true" />
                        Filtros Avançados
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="painel-filtros">
                        <div className="grade-filtros">
                            <div className="grupo-filtro">
                                <label htmlFor="filtro-ano-mat">Ano Lectivo</label>
                                <select id="filtro-ano-mat" name="ano" value={filters.ano} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }}>
                                    <option value="">Todos</option>
                                    <option value="2024/2025">2024/2025</option>
                                    <option value="2023/2024">2023/2024</option>
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label htmlFor="filtro-classe-mat">Classe</label>
                                <select id="filtro-classe-mat" name="classe" value={filters.classe} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }}>
                                    <option value="">Todas</option>
                                    <option value="10ª Classe">10ª Classe</option>
                                    <option value="11ª Classe">11ª Classe</option>
                                    <option value="12ª Classe">12ª Classe</option>
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label htmlFor="filtro-curso-mat">Curso</label>
                                <select id="filtro-curso-mat" name="curso" value={filters.curso} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }}>
                                    <option value="">Todos</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label htmlFor="filtro-sala-mat">Sala</label>
                                <select id="filtro-sala-mat" name="sala" value={filters.sala} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }}>
                                    <option value="">Todas</option>
                                    <option value="L-01">L-01</option>
                                    <option value="S-204">S-204</option>
                                    <option value="S-102">S-102</option>
                                </select>
                            </div>
                            <div className="grupo-filtro">
                                <label htmlFor="filtro-turma-mat">Turma</label>
                                <select id="filtro-turma-mat" name="turma" value={filters.turma} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }}>
                                    <option value="">Todas</option>
                                    <option value="INF10A">INF10A</option>
                                    <option value="GST12B">GST12B</option>
                                    <option value="DIR11C">DIR11C</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={clearFilters} className="btn-limpar-filtros">Limpar Filtros</button>
                        </div>
                    </div>
                )}

                {/* Detailed Table */}
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nº Matrícula</th>
                                <th>Nome do Aluno</th>
                                <th className="col-ano">Ano Lectivo</th>
                                <th>Classe</th>
                                <th>Curso</th>
                                <th className="col-sala">Sala</th>
                                <th className="col-turno">Turno</th>
                                <th>Turma</th>
                                <th>Estado</th>
                                <th className="col-data">Data</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((m) => (
                                <tr key={m.id} onClick={() => setSelectedMatricula(m)} className="clickable-row">
                                    <td className="student-id">{m.id}</td>
                                    <td>
                                        <div className="student-info">
                                            <div className="student-avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>{m.aluno.charAt(0)}</div>
                                            <span style={{ fontWeight: 500 }}>{m.aluno}</span>
                                        </div>
                                    </td>
                                    <td className="col-ano">{m.anoLectivo}</td>
                                    <td className="turma-cell">{m.classe}</td>
                                    <td>{m.curso}</td>
                                    <td className="col-sala">{m.sala}</td>
                                    <td className="col-turno">{m.turno}</td>
                                    <td>{m.turma}</td>
                                    <td>{getStatusBadge(m.status)}</td>
                                    <td className="date-cell col-data">{m.dataMatricula}</td>
                                    <td>
                                        <button className="btn-more-actions">
                                            <MoreVertical size={18} />
                                        </button>
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
                <div className="modal-overlay">
                    <div className="matricula-modal-card">
                        <div className="matricula-modal-header">
                            <div className="modal-header-info">
                                <h2>Detalhes da Matrícula</h2>
                                <span className="modal-subtitle">ID: {selectedMatricula.id}</span>
                            </div>
                            <button onClick={() => setSelectedMatricula(null)} className="btn-close-modal">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="matricula-modal-body">

                            {/* Top Profile Section */}
                            <div className="modal-profile-section">
                                <div className="profile-large-avatar">
                                    {selectedMatricula.aluno.charAt(0)}
                                </div>
                                <div className="profile-texts">
                                    <h3>{selectedMatricula.aluno}</h3>
                                    <div className="profile-badges">
                                        {getStatusBadge(selectedMatricula.status)}
                                        <span className="info-badge">{selectedMatricula.classe}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-grid-layout">

                                {/* 1. DADOS PESSOAIS */}
                                <div className="info-group-card">
                                    <div className="info-group-header">
                                        <User size={18} className="text-blue-600" />
                                        <h4>Dados Pessoais</h4>
                                    </div>
                                    <div className="info-list">
                                        <div className="info-item">
                                            <label>Bilhete de Identidade (BI)</label>
                                            <p className="highlight-text">{selectedMatricula.detalhes.bi}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Género</label>
                                            <p>{selectedMatricula.detalhes.genero}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Data de Nascimento</label>
                                            <p>{selectedMatricula.detalhes.dataNascimento}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>NIF</label>
                                            <p>{selectedMatricula.detalhes.nif}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. DADOS DO ENCARREGADO */}
                                <div className="info-group-card">
                                    <div className="info-group-header">
                                        <User size={18} className="text-purple-600" />
                                        <h4>Dados do Encarregado</h4>
                                    </div>
                                    <div className="info-list">
                                        <div className="info-item">
                                            <label>Nome Completo</label>
                                            <p className="font-semibold">{selectedMatricula.detalhes.encarregado}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Grau de Parentesco</label>
                                            <p>{selectedMatricula.detalhes.parentesco}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Telefone</label>
                                            <div className="flex-row-center">
                                                <Phone size={14} className="text-gray-400" />
                                                <p>{selectedMatricula.detalhes.telefoneEncarregado}</p>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <label>Morada / Endereço</label>
                                            <div className="flex-row-center">
                                                <MapPin size={14} className="text-gray-400" />
                                                <p>{selectedMatricula.detalhes.endereco}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. DADOS ACADÉMICOS */}
                                <div className="info-group-card full-width-mobile">
                                    <div className="info-group-header">
                                        <BookOpen size={18} className="text-orange-600" />
                                        <h4>Dados Académicos</h4>
                                    </div>
                                    <div className="grid-2-cols">
                                        <div className="info-item">
                                            <label>Curso</label>
                                            <p>{selectedMatricula.curso}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Turma</label>
                                            <p>{selectedMatricula.turma}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Sala</label>
                                            <p>{selectedMatricula.sala}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Turno</label>
                                            <p>{selectedMatricula.turno}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Ano Lectivo</label>
                                            <p>{selectedMatricula.anoLectivo}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Data Matrícula</label>
                                            <p>{selectedMatricula.dataMatricula}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. FINANCEIRO & DOCUMENTOS */}
                                <div className="info-group-card full-width-mobile">
                                    <div className="info-group-header">
                                        <CreditCard size={18} className="text-green-600" />
                                        <h4>Financeiro & Documentos</h4>
                                    </div>
                                    <div className="info-list">
                                        <div className="status-row">
                                            <span>Estado Pagamento:</span>
                                            <span className="status-pill-green">{selectedMatricula.detalhes.pagamentoStatus}</span>
                                        </div>
                                        <div className="docs-list">
                                            <label>Documentos Entregues:</label>
                                            <div className="doc-tags">
                                                {selectedMatricula.detalhes.documentos.map((doc, i) => (
                                                    <span key={i} className="doc-tag"><CheckCircle size={12} /> {doc}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="matricula-modal-footer">
                            <button className="btn-secondary">Editar Dados</button>
                            <button className="btn-primary-print">
                                <FileText size={18} /> Imprimir Ficha
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default Matriculas;