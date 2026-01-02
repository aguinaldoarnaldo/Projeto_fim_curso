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
            // Sensitive/Detail data
            detalhes: {
                nif: '123456789',
                dataNascimento: '12/05/2008',
                encarregado: 'João Silva',
                telefone: '+244 923 000 000',
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
                nif: '987654321',
                dataNascimento: '05/11/2006',
                encarregado: 'Maria Bento',
                telefone: '+244 931 111 222',
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
                nif: '456123789',
                dataNascimento: '20/09/2005',
                encarregado: 'Manuel Carlos',
                telefone: '+244 944 333 444',
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
                        className="btn-new-matricula nav-item-active"
                    >
                        <Calendar size={18} />
                        Nova Matrícula
                    </button>
                </div>
            </header>


            {/* Stats Summary Tooltips (Optional visual flair) 
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <p className="info-label">Total Ano Corrente</p>
                    <div className="stat-value">1,240</div>
                </div>
                <div className="stat-card">
                    <p className="info-label">Confirmadas</p>
                    <div className="stat-value" style={{ color: '#10b981' }}>1,150</div>
                </div>
                <div className="stat-card">
                    <p className="info-label">Por Validar</p>
                    <div className="stat-value" style={{ color: '#f59e0b' }}>90</div>
                </div>
            </div>*/}

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
                                <th style={{ width: '160px' }}>Nº Matrícula</th>
                                <th style={{ minWidth: '200px' }}>Nome do Aluno</th>
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
                            {matriculasData.map((m) => (
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

            {/* Details Side Drawer/Modal */}
            {selectedMatricula && (
                <div className="side-drawer">
                    <div className="drawer-header">
                        <h2>Detalhes da Matrícula</h2>
                        <button onClick={() => setSelectedMatricula(null)} className="btn-close-drawer">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="drawer-content">
                        {/* Profile Section */}
                        <div className="profile-summary">
                            <div className="profile-avatar-circle">
                                {selectedMatricula.aluno.charAt(0)}
                            </div>
                            <h3>{selectedMatricula.aluno}</h3>
                            <p>ID: {selectedMatricula.id}</p>
                            <div style={{ marginTop: '12px' }}>{getStatusBadge(selectedMatricula.status)}</div>
                        </div>

                        {/* Academic Info */}
                        <div className="academic-section">
                            <h4 className="data-section-title">Informação Académica</h4>
                            <div className="academic-grid">
                                <div className="academic-item">
                                    <div className="icon-blue"><BookOpen size={18} /></div>
                                    <div>
                                        <p className="item-label">Classe/Curso</p>
                                        <p className="item-value">{selectedMatricula.classe} - {selectedMatricula.curso}</p>
                                    </div>
                                </div>
                                <div className="academic-item">
                                    <div className="icon-blue"><Home size={18} /></div>
                                    <div>
                                        <p className="item-label">Sala/Turma</p>
                                        <p className="item-value">{selectedMatricula.sala} / {selectedMatricula.turma}</p>
                                    </div>
                                </div>
                                <div className="academic-item">
                                    <div className="icon-blue"><Calendar size={18} /></div>
                                    <div>
                                        <p className="item-label">Ano Lectivo</p>
                                        <p className="item-value">{selectedMatricula.anoLectivo}</p>
                                    </div>
                                </div>
                                <div className="academic-item">
                                    <div className="icon-blue"><Clock size={18} /></div>
                                    <div>
                                        <p className="item-label">Turno</p>
                                        <p className="item-value">{selectedMatricula.turno}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sensitive / Student Details */}
                        <div className="academic-section">
                            <h4 className="data-section-title">DADOS SENSÍVEIS & CONTACTOS</h4>
                            <div className="sensitive-data-box">
                                <div className="data-row">
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>NIF:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedMatricula.detalhes.nif}</span>
                                </div>
                                <div className="data-row">
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Data de Nascimento:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedMatricula.detalhes.dataNascimento}</span>
                                </div>
                                <div className="data-row data-row-bordered">
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Encarregado:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedMatricula.detalhes.encarregado}</span>
                                </div>
                                <div className="contact-row">
                                    <Phone size={14} color="#64748b" />
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedMatricula.detalhes.telefone}</span>
                                </div>
                                <div className="contact-row">
                                    <Mail size={14} color="#64748b" />
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedMatricula.detalhes.email}</span>
                                </div>
                                <div className="contact-row">
                                    <MapPin size={14} color="#64748b" />
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedMatricula.detalhes.endereco}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment and Docs */}
                        <div>
                            <h4 className="data-section-title">PAGAMENTO & DOCUMENTAÇÃO</h4>
                            <div className="academic-item" style={{ marginBottom: '16px' }}>
                                <div style={{ color: '#10b981' }}><CreditCard size={18} /></div>
                                <div>
                                    <p className="item-label">Estado do Pagamento</p>
                                    <p className="item-value" style={{ color: '#10b981' }}>{selectedMatricula.detalhes.pagamentoStatus}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedMatricula.detalhes.documentos.map((doc, idx) => (
                                    <span key={idx} className="document-badge">{doc}</span>
                                ))}
                            </div>
                        </div>

                        <button className="btn-print-matricula">
                            <FileText size={18} />
                            Imprimir Ficha de Matrícula
                        </button>
                    </div>
                </div>
            )}

            {/* Backdrop for side drawer */}
            {selectedMatricula && (
                <div
                    onClick={() => setSelectedMatricula(null)}
                    className="backdrop"
                />
            )}

        </div>
    );
};

export default Matriculas;