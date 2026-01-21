import React, { useState, useEffect, useRef } from 'react';
import './Turmas.css';

import {
    Search,
    Plus,
    Filter,
    Edit3,
    X,
    Users,
    User,
    Home,
    Clock,
    Calendar,
    BookOpen,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';

import Pagination from '../../components/Common/Pagination';
import api from '../../services/api';
import { useCache } from '../../context/CacheContext';

const Turmas = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedTurma, setSelectedTurma] = useState(null);
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

    const [filters, setFilters] = useState({
        ano: '',
        curso: '',
        sala: '',
        turno: '',
        status: ''
    });

    const [turmas, setTurmas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [salas, setSalas] = useState([]);
    const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
    const [periodosDisponiveis, setPeriodosDisponiveis] = useState([]);
    const [formData, setFormData] = useState({
        codigo_turma: '',
        id_curso: '',
        id_periodo: '',
        id_sala: '',
        ano: '2024/2025',
        responsavel_nome: '',
        status: 'Ativa'
    });

    // Cache
    const { getCache, setCache } = useCache();

    // Fetch Turmas, Salas, Cursos, Periodos
    useEffect(() => {
        fetchData();
    }, []);

    // Polling for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(true);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async (force = false) => {
        if (!force) {
            const cTurmas = getCache('turmas');
            const cSalas = getCache('salas');
            const cCursos = getCache('cursos');
            const cPeriodos = getCache('periodos');

            if (cTurmas && cSalas && cCursos && cPeriodos) {
                 setTurmas(cTurmas);
                 setSalas(cSalas);
                 setCursosDisponiveis(cCursos);
                 setPeriodosDisponiveis(cPeriodos);
                 setLoading(false);
                 return;
            }
        }

        try {
            // Do not force set loading=true on updates to avoid flash
            const [turmasRes, salasRes, cursosRes, periodosRes] = await Promise.all([
                api.get('turmas/'),
                api.get('salas/'),
                api.get('cursos/'),
                api.get('periodos/')
            ]);
            
            const turmasData = turmasRes.data.results || turmasRes.data;
            const formattedTurmas = turmasData.map(t => ({
                id: t.id_turma,
                turma: t.codigo_turma,
                id_curso: t.id_curso,
                curso: t.curso_nome,
                id_sala: t.id_sala,
                sala: `Sala ${t.sala_numero || 'N/A'}`,
                id_periodo: t.id_periodo,
                coordenador: t.responsavel_nome || 'Sem Coordenador',
                ano: t.ano || '2024/2025',
                turno: t.periodo_nome,
                qtdAlunos: t.total_alunos || 0,
                status: t.status || 'Ativa'
            }));
            
            const salasData = salasRes.data.results || salasRes.data;
            const cursosData = cursosRes.data.results || cursosRes.data;
            const periodosData = periodosRes.data.results || periodosRes.data;

            setTurmas(formattedTurmas);
            setSalas(salasData);
            setCursosDisponiveis(cursosData);
            setPeriodosDisponiveis(periodosData);

            // Cache all
            setCache('turmas', formattedTurmas);
            setCache('salas', salasData);
            setCache('cursos', cursosData);
            setCache('periodos', periodosData);

            setLoading(false);
        } catch (err) {
            console.error('Erro ao buscar dados:', err);
            if (loading) {
                setError('Falha ao carregar dados.');
                setLoading(false);
            }
        }
    };

    const handleSave = async () => {
        try {
            // Basic validation
            if(!formData.codigo_turma || !formData.id_curso || !formData.id_sala) {
                alert("Preencha os campos obrigatórios (Nome, Curso, Sala).");
                return;
            }

            const payload = {
                codigo_turma: formData.codigo_turma,
                id_curso: formData.id_curso,
                id_sala: formData.id_sala,
                ano: formData.ano,
                status: formData.status,
                // Assuming defaults or handling these fields for now as they might be required by backend
                id_classe: 1, // Default to 10th grade if not specified
                id_periodo: formData.id_periodo || 1 // Default to first period if not specified
            };
            
            // NOTE: You might need to adjust payload keys to match your exact serializer expectations
            
            if (modalMode === 'add') {
                 await api.post('turmas/', payload);
                 alert('Turma criada com sucesso!');
            } else {
                 await api.put(`turmas/${selectedTurma.id}/`, payload);
                 alert('Turma atualizada com sucesso!');
            }
            
            setShowModal(false);
            fetchData(true); // Refresh list
        } catch (err) {
            console.error("Erro ao salvar turma:", err);
            alert("Erro ao salvar turma. Verifique os dados.");
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleEdit = (turma) => {
        setSelectedTurma(turma);
        setFormData({
            codigo_turma: turma.turma,
            id_curso: turma.id_curso || '',
            id_periodo: turma.id_periodo || '',
            id_sala: turma.id_sala || '',
            ano: turma.ano,
            responsavel_nome: turma.coordenador,
            status: turma.status
        });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedTurma(null);
        setFormData({
            codigo_turma: '',
            id_curso: '',
            id_periodo: '',
            id_sala: '',
            ano: '2024/2025',
            responsavel_nome: '',
            status: 'Ativa'
        });
        setModalMode('add');
        setShowModal(true);
    };

    const filteredData = turmas.filter(item => {
        const matchesSearch = item.turma.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.coordenador.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(item.id).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAno = filters.ano === '' || String(item.ano) === filters.ano;
        const matchesCurso = filters.curso === '' || item.curso === filters.curso;
        const matchesSala = filters.sala === '' || item.sala.includes(filters.sala); // Adapted since sala formatting changed
        const matchesTurno = filters.turno === '' || item.turno === filters.turno;
        const matchesStatus = filters.status === '' || item.status === filters.status;

        return matchesSearch && matchesAno && matchesCurso && matchesSala && matchesTurno && matchesStatus;
    });

    // Pagination Slicing
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTurmas = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="turmas-header-content">
                    <div>
                        <h1>Gestão de Turmas</h1>
                        <p>Configuração e monitoramento das turmas do ano lectivo corrente.</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="btn-primary-action"
                    >
                        <Plus size={20} />
                        Nova Turma
                    </button>
                </div>
            </header>


            <div className="table-card" style={{ padding: '0' }} ref={tableRef}>
                <div className="search-filters-header">
                    <div className="search-box-turma">
                        <Search className="search-icon-turma" size={20} aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Pesquisar por ID, Turma ou Coordenador..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="search-input-turma"
                            aria-label="Pesquisar turmas por ID, nome ou coordenador"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-toggle-filters ${showFilters ? 'btn-active' : ''}`}
                        aria-expanded={showFilters}
                        aria-label={showFilters ? "Esconder filtros" : "Mostrar filtros"}
                    >
                        <Filter size={18} aria-hidden="true" />
                        Filtros
                    </button>
                </div>


                {/* Dynamic Filters */}
                {showFilters && (
                    <div className="filters-expanded-pane">
                        <div className="filters-grid-turmas">
                            <div>
                                <label htmlFor="filtro-ano-tur" className="filter-label-turma">Ano Lectivo</label>
                                <select id="filtro-ano-tur" name="ano" value={filters.ano} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="filter-select-turma">
                                    <option value="">Todos</option>
                                    <option value="2024/2025">2024/2025</option>
                                    <option value="2023/2024">2023/2024</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="filtro-curso-tur" className="filter-label-turma">Curso</label>
                                <select id="filtro-curso-tur" name="curso" value={filters.curso} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="filter-select-turma">
                                    <option value="">Todos</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="filtro-sala-tur" className="filter-label-turma">Sala</label>
                                <select id="filtro-sala-tur" name="sala" value={filters.sala} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="filter-select-turma">
                                    <option value="">Todas</option>
                                    <option value="Lab 01">Lab 01</option>
                                    <option value="Lab 02">Lab 02</option>
                                    <option value="S-204">S-204</option>
                                    <option value="S-102">S-102</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="filtro-turno-tur" className="filter-label-turma">Turno</label>
                                <select id="filtro-turno-tur" name="turno" value={filters.turno} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="filter-select-turma">
                                    <option value="">Todos</option>
                                    <option value="Manhã">Manhã</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Noite">Noite</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="filtro-status-tur" className="filter-label-turma">Estado</label>
                                <select id="filtro-status-tur" name="status" value={filters.status} onChange={(e) => { handleFilterChange(e); setCurrentPage(1); }} className="filter-select-turma">
                                    <option value="">Todos</option>
                                    <option value="Ativa">Ativa</option>
                                    <option value="Concluida">Concluída</option>
                                </select>
                            </div>
                        </div>
                        <div className="clear-filters-box">
                            <button
                                onClick={() => { setFilters({ ano: '', curso: '', sala: '', turno: '', status: '' }); setCurrentPage(1); }}
                                className="btn-clear-filters"
                            >
                                Limpar Filtros
                            </button>
                        </div>
                    </div>
                )}


                {/* Turmas Table */}
                {loading ? (
                     <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px', color: '#64748b'}}>
                        <div className="loading-spinner" style={{width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spinner 0.8s linear infinite'}}></div>
                        <span style={{fontWeight: 500}}>A carregar turmas...</span>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID Turma</th>
                                    <th>Nome Turma</th>
                                    <th>Curso</th>
                                    <th>Sala</th>
                                    <th>Coordenador</th>
                                    <th>Ano</th>
                                    <th>Turno</th>
                                    <th>Alunos (Capacidade)</th>
                                    <th>Estado</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {error ? (
                                    <tr>
                                        <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: '#ef4444'}}>
                                            {error}
                                        </td>
                                    </tr>
                                ) : currentTurmas.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                                            Nenhuma turma encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    currentTurmas.map((t) => (
                                        <tr key={t.id} className="animate-fade-in">
                                            <td className="turma-id-cell">#{t.id}</td>
                                            <td className="turma-name-cell">{t.turma}</td>
                                            <td>{t.curso}</td>
                                            <td style={{ fontWeight: 500 }}>{t.sala}</td>
                                            <td>
                                                <div className="coordinator-cell">
                                                    <div className="coordinator-avatar-small">
                                                        {t.coordenador.split(' ').pop().charAt(0)}
                                                    </div>
                                                    <span>{t.coordenador}</span>
                                                </div>
                                            </td>
                                            <td>{t.ano}</td>
                                            <td>{t.turno}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="capacity-cell">
                                                    <span style={{ fontWeight: 700, fontSize: '12px', color: t.qtdAlunos >= 50 ? '#ef4444' : '#10b981' }}>{t.qtdAlunos} / 50</span>
                                                    <div className="capacity-progress-container">
                                                        <div className="capacity-progress-bar" style={{ width: `${(t.qtdAlunos / 50) * 100}%`, background: t.qtdAlunos >= 50 ? '#ef4444' : 'var(--primary-color)' }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    backgroundColor: t.status === 'Ativa' ? '#dcfce7' : '#f1f5f9',
                                                    color: t.status === 'Ativa' ? '#166534' : '#64748b'
                                                }}>
                                                    {t.status === 'Concluida' ? 'Concluída' : t.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleEdit(t)}
                                                    className="btn-edit-turma"
                                                    title="Editar Turma"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination 
                    totalItems={filteredData.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay-turmas">
                    <div className="modal-content-turmas">
                        <div className="modal-header-turmas">
                            <h2 className="modal-title-turmas">
                                {modalMode === 'add' ? 'Nova Configuração de Turma' : `Editar Turma: ${selectedTurma?.turma}`}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn-close-modal-turmas"
                            >
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        <form className="modal-form-turmas" onSubmit={(e) => e.preventDefault()}>
                            <div className="form-grid-turmas-modal">
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label-turmas">Nome da Turma</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: INF10A" 
                                        value={formData.codigo_turma}
                                        onChange={e => setFormData({...formData, codigo_turma: e.target.value})}
                                        className="form-input-turmas" 
                                    />
                                </div>
                                <div>
                                    <label className="form-label-turmas">Curso</label>
                                    <select 
                                        value={formData.id_curso}
                                        onChange={e => setFormData({...formData, id_curso: e.target.value})}
                                        className="form-input-turmas"
                                    >
                                        <option value="">Seleccionar Curso</option>
                                        {cursosDisponiveis.map(c => (
                                            <option key={c.id_curso} value={c.id_curso}>{c.nome_curso}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label-turmas">Turno</label>
                                    <select 
                                        value={formData.id_periodo} 
                                        onChange={e => setFormData({...formData, id_periodo: e.target.value})}
                                        className="form-input-turmas"
                                    >
                                        <option value="">Seleccionar Turno</option>
                                        {periodosDisponiveis.map(p => (
                                            <option key={p.id_periodo} value={p.id_periodo}>{p.periodo}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label-turmas">Sala</label>
                                    <select 
                                        value={formData.id_sala}
                                        onChange={e => setFormData({...formData, id_sala: e.target.value})}
                                        className="form-input-turmas"
                                    >
                                        <option value="">Seleccionar Sala</option>
                                        {salas.map(s => (
                                            <option key={s.id_sala} value={s.id_sala}>
                                                Sala {s.numero_sala} ({s.capacidade_alunos} lug.)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label-turmas">Estado</label>
                                    <select 
                                        value={formData.status}
                                        onChange={e => setFormData({...formData, status: e.target.value})}
                                        className="form-input-turmas"
                                    >
                                        <option value="Ativa">Ativa</option>
                                        <option value="Concluida">Concluída</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label-turmas">Ano Lectivo</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: 2024/2025" 
                                        value={formData.ano}
                                        onChange={e => setFormData({...formData, ano: e.target.value})}
                                        className="form-input-turmas" 
                                    />
                                </div>
                            </div>

                            {/* Capacity Alert */}
                            <div className="capacity-alert-box">
                                <AlertTriangle size={20} color="#d97706" />
                                <p className="capacity-alert-text">
                                    <strong>Aviso de Capacidade:</strong> O limite recomendado é entre 45 e 50 alunos por turma para garantir a qualidade do ensino e as normas da instituição.
                                </p>
                            </div>

                            <div className="modal-actions-turmas">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="btn-modal-cancel"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn-modal-submit-turma"
                                >
                                    {modalMode === 'add' ? 'Criar Turma' : 'Salvar Alterações'} <ChevronRight size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Turmas;