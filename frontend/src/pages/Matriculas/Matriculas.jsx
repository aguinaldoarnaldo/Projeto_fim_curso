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
import api from '../../services/api';
import { useCache } from '../../context/CacheContext';

import Pagination from '../../components/Common/Pagination';

const Matriculas = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMatricula, setSelectedMatricula] = useState(null);
    const tableRef = useRef(null);

    // Data State
    const [matriculas, setMatriculas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // Cache
    const { getCache, setCache } = useCache();

    // Fetch Data from API
    // Fetch Data from API
    const [cursosDisponiveis, setCursosDisponiveis] = useState([]);

    // Define fetch function
    const fetchData = async (force = false) => {
        try {
            if (!force) setLoading(true);
            
            // Parallel fetch for matriculas and filter options (courses)
            const [matriculasRes, cursosRes] = await Promise.all([
                api.get('matriculas/'),
                api.get('cursos/')
            ]);

            // Handle Matriculas Data
            const formattedData = matriculasRes.data.results ? matriculasRes.data.results.map(item => ({
                id: `MAT-${item.id_matricula || '000'}`,
                aluno: item.aluno_nome || 'Desconhecido',
                foto: item.aluno_foto || null,
                anoLectivo: item.ano_lectivo || 'N/A',
                classe: item.classe_nome || 'N/A',
                curso: item.curso_nome || 'N/A',
                sala: item.sala_numero || 'N/A',
                turno: item.periodo_nome || 'N/A',
                turma: item.turma_codigo || 'Sem Turma',
                status: item.ativo ? 'Confirmada' : 'Pendente',
                dataMatricula: item.data_matricula ? new Date(item.data_matricula).toLocaleDateString() : 'N/A',
                detalhes: {
                    bi: item.bi || 'N/A', 
                    genero: item.genero || 'N/A',
                    nif: item.nif || 'N/A', // Campo nao existe no backend ainda
                    dataNascimento: item.data_nascimento || 'N/A',
                    encarregado: item.encarregado_nome || 'N/A', 
                    parentesco: item.encarregado_parentesco || 'N/A',
                    telefoneEncarregado: item.encarregado_telefone || 'N/A',
                    email: item.email || 'N/A', // Serializer nao retorna, talvez adicionar?
                    endereco: item.endereco || 'N/A',
                    pagamentoStatus: item.ativo ? 'Confirmado' : 'Pendente',
                    documentos: [],
                    historico: ''
                }
            })) : [];
            
            if (formattedData.length > 0) {
                    setMatriculas(formattedData);
                    setCache('matriculas', formattedData);
            } else {
                setMatriculas([]);
            }

            // Handle Courses Data for Filters
            const cursosData = cursosRes.data.results || cursosRes.data;
            if (Array.isArray(cursosData)) {
                setCursosDisponiveis(cursosData);
            }

        } catch (err) {
            console.error("Error fetching data:", err);
            if (!force) setError("Falha ao carregar dados. Verifique a conexão.");
        } finally {
            if (!force) setLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchData();
    }, []);

    // Polling
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(true);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const filteredMatriculas = matriculas.filter(matricula => {
        if (!matricula) return false;
        
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            (matricula.aluno && String(matricula.aluno).toLowerCase().includes(search)) ||
            (matricula.id && String(matricula.id).toLowerCase().includes(search));

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
                        style={{ background: showFilters ? 'var(--primary-color)' : 'white', color: showFilters ? 'white' : '#374151' }}
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
                                    {cursosDisponiveis.map(curso => (
                                        <option key={curso.id_curso} value={curso.nome_curso}>{curso.nome_curso}</option>
                                    ))}
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
                                <th>Matrícula</th>
                                <th>Nome Completo</th>
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
                                <tr key={m.id} onClick={() => setSelectedMatricula(m)} className="clickable-row animate-fade-in">
                                    <td className="student-id" style={{fontFamily: 'monospace', fontSize: '13px'}}>
                                        {m.id}
                                    </td>
                                    <td>
                                        <div className="student-info">
                                            {/* Foto ou Placeholder */}
                                            <div className="student-avatar" style={{ 
                                                width: '36px', 
                                                height: '36px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                                background: m.foto ? 'white' : '#e0e7ff',
                                                border: m.foto ? '1px solid #e2e8f0' : 'none',
                                                borderRadius: '10px'
                                            }}>
                                                {m.foto ? (
                                                    <img src={m.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <User size={18} color="var(--primary-color)" />
                                                )}
                                            </div>
                                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                                <span style={{ fontWeight: 600, color: '#1e293b' }}>{m.aluno}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="col-ano" style={{color: '#64748b'}}>{m.anoLectivo}</td>
                                    <td style={{fontWeight: 600, color: '#334155'}}>{m.classe}</td>
                                    <td style={{color: '#475569'}}>{m.curso}</td>
                                    <td className="col-sala" style={{textAlign: 'center'}}>
                                        {m.sala === 'N/A' ? <span style={{color: '#cbd5e1'}}>-</span> : <span style={{fontWeight: 600}}>{m.sala}</span>}
                                    </td>
                                    <td className="col-turno">{m.turno}</td>
                                    <td>
                                        {(m.turma === 'Sem Turma' || m.turma === 'N/A' || m.turma.includes('N/A')) ? (
                                             <span style={{
                                                 background: '#fff7ed', 
                                                 color: '#c2410c', 
                                                 padding: '4px 8px', 
                                                 borderRadius: '6px', 
                                                 fontSize: '11px', 
                                                 fontWeight: 600,
                                                 border: '1px solid #ffedd5'
                                             }}>
                                                Pendente
                                             </span>
                                        ) : (
                                            <span style={{fontWeight: 700, color: '#1e293b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px'}}>
                                                {m.turma}
                                            </span>
                                        )}
                                    </td>
                                    <td>{getStatusBadge(m.status)}</td>
                                    <td className="date-cell col-data" style={{color: '#64748b', fontSize: '12px'}}>{m.dataMatricula}</td>
                                    <td style={{textAlign: 'center'}}>
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
                                {/* Foto Grande ou Placeholder */}
                                <div className="profile-large-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                                    {selectedMatricula.foto ? (
                                        <img src={selectedMatricula.foto} alt={selectedMatricula.aluno} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={40} />
                                        </div>
                                    )}
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