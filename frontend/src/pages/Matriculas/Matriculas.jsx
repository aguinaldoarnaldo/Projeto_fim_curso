import React, { useState } from 'react';
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Gestão de Matrículas</h1>
                        <p>Controle centralizado de matrículas e registros acadêmicos.</p>
                    </div>
                    <button
                        onClick={() => navigate('/matriculas/nova')}
                        className="nav-item-active"
                        style={{ height: 'fit-content', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
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

            <div className="table-card" style={{ padding: '0' }}>
                {/* Search and Toggle Filter */}
                <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar aluno ou número de matrícula..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', background: '#f9fafb', color: '#111827' }}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', background: showFilters ? '#1e3a8a' : 'white', color: showFilters ? 'white' : '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                    >
                        <Filter size={18} />
                        Filtros Avançados
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Ano Lectivo</label>
                                <select name="ano" value={filters.ano} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', color: '#111827' }}>
                                    <option value="">Todos</option>
                                    <option value="2024/2025">2024/2025</option>
                                    <option value="2023/2024">2023/2024</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Classe</label>
                                <select name="classe" value={filters.classe} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                                    <option value="">Todas</option>
                                    <option value="10ª Classe">10ª Classe</option>
                                    <option value="11ª Classe">11ª Classe</option>
                                    <option value="12ª Classe">12ª Classe</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Curso</label>
                                <select name="curso" value={filters.curso} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                                    <option value="">Todos</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Sala</label>
                                <select name="sala" value={filters.sala} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                                    <option value="">Todas</option>
                                    <option value="L-01">L-01</option>
                                    <option value="S-204">S-204</option>
                                    <option value="S-102">S-102</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Turma</label>
                                <select name="turma" value={filters.turma} onChange={handleFilterChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}>
                                    <option value="">Todas</option>
                                    <option value="INF10A">INF10A</option>
                                    <option value="GST12B">GST12B</option>
                                    <option value="DIR11C">DIR11C</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Limpar Filtros</button>
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
                                <tr key={m.id} onClick={() => setSelectedMatricula(m)} style={{ cursor: 'pointer' }}>
                                    <td style={{ fontWeight: 600, color: '#1e3a8a' }}>{m.id}</td>
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
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
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
                <div style={{ position: 'fixed', top: 0, right: 0, width: '450px', height: '100vh', background: 'white', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', zIndex: 1000, overflowY: 'auto' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Detalhes da Matrícula</h2>
                        <button onClick={() => setSelectedMatricula(null)} style={{ background: '#f3f4f6', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ padding: '24px' }}>
                        {/* Profile Section */}
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{ width: '80px', height: '80px', background: '#1e3a8a', color: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, margin: '0 auto 16px' }}>
                                {selectedMatricula.aluno.charAt(0)}
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>{selectedMatricula.aluno}</h3>
                            <p style={{ color: '#6b7280' }}>ID: {selectedMatricula.id}</p>
                            <div style={{ marginTop: '12px' }}>{getStatusBadge(selectedMatricula.status)}</div>
                        </div>

                        {/* Academic Info */}
                        <div style={{ marginBottom: '32px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '16px' }}>Informação Académica</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ color: '#3b82f6' }}><BookOpen size={18} /></div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#64748b' }}>Classe/Curso</p>
                                        <p style={{ fontSize: '14px', fontWeight: 600 }}>{selectedMatricula.classe} - {selectedMatricula.curso}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ color: '#3b82f6' }}><Home size={18} /></div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#64748b' }}>Sala/Turma</p>
                                        <p style={{ fontSize: '14px', fontWeight: 600 }}>{selectedMatricula.sala} / {selectedMatricula.turma}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ color: '#3b82f6' }}><Calendar size={18} /></div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#64748b' }}>Ano Lectivo</p>
                                        <p style={{ fontSize: '14px', fontWeight: 600 }}>{selectedMatricula.anoLectivo}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ color: '#3b82f6' }}><Clock size={18} /></div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#64748b' }}>Turno</p>
                                        <p style={{ fontSize: '14px', fontWeight: 600 }}>{selectedMatricula.turno}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sensitive / Student Details */}
                        <div style={{ marginBottom: '32px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '16px' }}>DADOS SENSÍVEIS & CONTACTOS</h4>
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>NIF:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedMatricula.detalhes.nif}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Data de Nascimento:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedMatricula.detalhes.dataNascimento}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Encarregado:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedMatricula.detalhes.encarregado}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Phone size={14} color="#64748b" />
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedMatricula.detalhes.telefone}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Mail size={14} color="#64748b" />
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedMatricula.detalhes.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <MapPin size={14} color="#64748b" />
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedMatricula.detalhes.endereco}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment and Docs */}
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '16px' }}>PAGAMENTO & DOCUMENTAÇÃO</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ color: '#10b981' }}><CreditCard size={18} /></div>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#64748b' }}>Estado do Pagamento</p>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>{selectedMatricula.detalhes.pagamentoStatus}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedMatricula.detalhes.documentos.map((doc, idx) => (
                                    <span key={idx} style={{ padding: '6px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>{doc}</span>
                                ))}
                            </div>
                        </div>

                        <button style={{ width: '100%', marginTop: '40px', padding: '16px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 999 }}
                />
            )}
        </div>
    );
};

export default Matriculas;