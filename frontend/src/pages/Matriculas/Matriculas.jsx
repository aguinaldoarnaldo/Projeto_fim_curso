import React, { useState } from 'react';
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

const Matriculas = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMatricula, setSelectedMatricula] = useState(null);

    // Mock filter states
    const [filters, setFilters] = useState({
        ano: '',
        sala: '',
        curso: '',
        turma: '',
        classe: ''
    });

    const matriculasData = [
        {
            id: 'MAT-2024-001',
            aluno: 'António J. Silva',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Confirmada',
            dataMatricula: '22 Dez 2024',
            detalhes: {
                bi: '001234567LA042',
                genero: 'Masculino',
                nif: '123456789',
                dataNascimento: '12/05/2008',
                encarregado: 'João Silva',
                parentesco: 'Pai',
                telefoneEncarregado: '+244 923 000 000',
                email: 'antonio.silva@email.com',
                endereco: 'Luanda, Cassequel',
                pagamentoStatus: 'Pago',
                documentos: ['BI', 'Certificado', 'Fotos'],
                historico: 'Transferido da Escola Secundária nº 12'
            }
        },
        {
            id: 'MAT-2024-002',
            aluno: 'Maria José Bento',
            anoLectivo: '2024/2025',
            classe: '12ª Classe',
            curso: 'Gestão',
            sala: 'S-204',
            turno: 'Tarde',
            turma: 'GST12B',
            status: 'Pendente',
            dataMatricula: '23 Dez 2024',
            detalhes: {
                bi: '005556667LA021',
                genero: 'Feminino',
                nif: '987654321',
                dataNascimento: '05/11/2006',
                encarregado: 'Maria Bento',
                parentesco: 'Mãe',
                telefoneEncarregado: '+244 931 111 222',
                email: 'maria.jose@email.com',
                endereco: 'Cazenga, Luanda',
                pagamentoStatus: 'Pendente',
                documentos: ['BI', 'Fotos'],
                historico: 'Excelente aproveitamento no ano anterior'
            }
        },
        {
            id: 'MAT-2024-003',
            aluno: 'Carlos Manuel',
            anoLectivo: '2023/2024',
            classe: '11ª Classe',
            curso: 'Direito',
            sala: 'S-102',
            turno: 'Noite',
            turma: 'DIR11C',
            status: 'Em Análise',
            dataMatricula: '24 Dez 2024',
            detalhes: {
                bi: '009887766LA011',
                genero: 'Masculino',
                nif: '456123789',
                dataNascimento: '20/09/2005',
                encarregado: 'Manuel Carlos',
                parentesco: 'Tio',
                telefoneEncarregado: '+244 944 333 444',
                email: 'carlos.manuel@email.com',
                endereco: 'Viana, Luanda',
                pagamentoStatus: 'Análise de Comprovativo',
                documentos: ['Certificado'],
                historico: 'Necessita reforço em Língua Portuguesa'
            }
        },
    ];

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
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Confirmada': return <span className="status-badge status-confirmed">Confirmada</span>;
            case 'Pendente': return <span className="status-badge status-pending">Pendente</span>;
            case 'Em Análise': return <span className="status-badge status-analysis">Em Análise</span>;
            default: return <span className="status-badge status-default">{status}</span>;
        }
    };

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

            <div className="table-card">
                {/* Search and Toggle Filter */}
                <div className="search-filter-row">
                    <div className="search-box">
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar aluno ou número de matrícula..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-box-input"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-advanced-filters"
                        style={{ background: showFilters ? '#1e3a8a' : 'white', color: showFilters ? 'white' : '#374151' }}
                    >
                        <Filter size={18} />
                        Filtros Avançados
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="filters-container">
                        <div className="filters-row">
                            <div className="filter-item">
                                <label>Ano Lectivo</label>
                                <select name="ano" value={filters.ano} onChange={handleFilterChange}>
                                    <option value="">Todos</option>
                                    <option value="2024/2025">2024/2025</option>
                                    <option value="2023/2024">2023/2024</option>
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Classe</label>
                                <select name="classe" value={filters.classe} onChange={handleFilterChange}>
                                    <option value="">Todas</option>
                                    <option value="10ª Classe">10ª Classe</option>
                                    <option value="11ª Classe">11ª Classe</option>
                                    <option value="12ª Classe">12ª Classe</option>
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Curso</label>
                                <select name="curso" value={filters.curso} onChange={handleFilterChange}>
                                    <option value="">Todos</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Sala</label>
                                <select name="sala" value={filters.sala} onChange={handleFilterChange}>
                                    <option value="">Todas</option>
                                    <option value="L-01">L-01</option>
                                    <option value="S-204">S-204</option>
                                    <option value="S-102">S-102</option>
                                </select>
                            </div>
                            <div className="filter-item">
                                <label>Turma</label>
                                <select name="turma" value={filters.turma} onChange={handleFilterChange}>
                                    <option value="">Todas</option>
                                    <option value="INF10A">INF10A</option>
                                    <option value="GST12B">GST12B</option>
                                    <option value="DIR11C">DIR11C</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={clearFilters} className="btn-clear-filters">Limpar Filtros</button>
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
                                <th>Ano Lectivo</th>
                                <th>Classe</th>
                                <th>Curso</th>
                                <th>Sala</th>
                                <th>Turno</th>
                                <th>Turma</th>
                                <th>Estado</th>
                                <th>Data</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMatriculas.map((m) => (
                                <tr key={m.id} onClick={() => setSelectedMatricula(m)} className="clickable-row">
                                    <td className="student-id">{m.id}</td>
                                    <td>
                                        <div className="student-info">
                                            <div className="student-avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>{m.aluno.charAt(0)}</div>
                                            <span style={{ fontWeight: 500 }}>{m.aluno}</span>
                                        </div>
                                    </td>
                                    <td>{m.anoLectivo}</td>
                                    <td className="turma-cell">{m.classe}</td>
                                    <td>{m.curso}</td>
                                    <td>{m.sala}</td>
                                    <td>{m.turno}</td>
                                    <td>{m.turma}</td>
                                    <td>{getStatusBadge(m.status)}</td>
                                    <td className="date-cell">{m.dataMatricula}</td>
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