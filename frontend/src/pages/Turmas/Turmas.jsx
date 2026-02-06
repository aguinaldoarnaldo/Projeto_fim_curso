import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Turmas.css';
import './TurmasTableResponsive.css';

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
    AlertTriangle,
    MapPin,
    Activity // Added for Status
} from 'lucide-react';

import Pagination from '../../components/Common/Pagination';
import api from '../../services/api';
import { useCache } from '../../context/CacheContext';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';
import FilterModal from '../../components/Common/FilterModal';

const Turmas = () => {
    const { hasPermission } = usePermission();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedTurma, setSelectedTurma] = useState(null);
    const tableRef = useRef(null);
    const filterButtonRef = useRef(null);

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
        classe: '',
        sala: '',
        turno: '',
        status: ''
    });

    const [turmas, setTurmas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [salas, setSalas] = useState([]);
    const [classesDisponiveis, setClassesDisponiveis] = useState([]);
    const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
    const [periodosDisponiveis, setPeriodosDisponiveis] = useState([]);
    const [anosDisponiveis, setAnosDisponiveis] = useState([]);
    
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
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async (force = false) => {
        if (!force) {
            const cTurmas = getCache('turmas');
            const cSalas = getCache('salas');
            const cCursos = getCache('cursos');
            const cPeriodos = getCache('periodos');
            const cAnos = getCache('anos-lectivos');
            const cClasses = getCache('classes');

            if (cTurmas && cSalas && cCursos && cPeriodos && cAnos && cClasses) {
                 setTurmas(cTurmas);
                 setSalas(cSalas);
                 setClassesDisponiveis(cClasses);
                 setCursosDisponiveis(cCursos);
                 setPeriodosDisponiveis(cPeriodos);
                 setAnosDisponiveis(cAnos);
                 setLoading(false);
            }
        }

        try {
            // Do not force set loading=true on updates to avoid flash
            const [turmasRes, salasRes, cursosRes, periodosRes, anosRes, classesRes] = await Promise.all([
                api.get('turmas/'),
                api.get('salas/'),
                api.get('cursos/'),
                api.get('periodos/'),
                api.get('anos-lectivos/'),
                api.get('classes/')
            ]);
            
            const turmasData = turmasRes.data.results || turmasRes.data;
            const formattedTurmas = turmasData.map(t => ({
                id: t.id_turma,
                turma: t.codigo_turma,
                id_curso: t.id_curso,
                curso: t.curso_nome,
                id_sala: t.id_sala,
                sala: `Sala ${t.sala_numero || 'N/A'}`,
                id_classe: t.id_classe,
                classe: t.classe_nome || 'N/A',
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
            const anosData = anosRes.data.results || anosRes.data || [];
            const classesData = classesRes.data.results || classesRes.data || [];

            setTurmas(formattedTurmas);
            setSalas(salasData);
            setClassesDisponiveis(classesData);
            setCursosDisponiveis(cursosData);
            setPeriodosDisponiveis(periodosData);
            setAnosDisponiveis(anosData);

            // Cache all
            setCache('turmas', formattedTurmas);
            setCache('salas', salasData);
            setCache('classes', classesData);
            setCache('cursos', cursosData);
            setCache('periodos', periodosData);
            setCache('anos-lectivos', anosData);

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
            if(!formData.id_curso || !formData.id_sala || !formData.id_classe || !formData.id_periodo) {
                alert("Preencha os campos obrigatórios (Curso, Classe, Turno e Sala).");
                return;
            }

            // VALIDATION: Active Year Only
            const selectedYearObj = anosDisponiveis.find(a => a.nome === formData.ano);
            if (selectedYearObj) {
                const today = new Date();
                today.setHours(0,0,0,0); // Reset time for accurate date comparison
                const start = new Date(selectedYearObj.data_inicio);
                const end = new Date(selectedYearObj.data_fim);
                
                // Check if today is OUTSIDE the year range
                if (today < start || today > end) {
                    alert(`🚫 Ação Bloqueada:\n\nO Ano Lectivo selecionado (${formData.ano}) não está ativo no momento.\n\nPor favor, selecione o ano corrente para criar ou editar turmas.`);
                    return; // Blocks the save
                }
            } else {
                 // Fallback if year object not found (shouldn't happen with select)
                 console.warn("Ano selecionado não encontrado na lista de referência.");
            }

            const payload = {
                codigo_turma: formData.codigo_turma,
                id_curso: formData.id_curso,
                id_sala: formData.id_sala,
                ano: formData.ano,
                status: formData.status,
                id_classe: formData.id_classe,
                id_periodo: formData.id_periodo
            };
            
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

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ ano: '', curso: '', classe: '', sala: '', turno: '', status: '' });
        setCurrentPage(1);
    };

    const handleEdit = (turma) => {
        setSelectedTurma(turma);
        setFormData({
            codigo_turma: turma.turma,
            id_curso: turma.id_curso || '',
            id_periodo: turma.id_periodo || '',
            id_sala: turma.id_sala || '',
            id_classe: turma.id_classe || '',
            ano: turma.ano,
            responsavel_nome: turma.coordenador,
            status: turma.status
        });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedTurma(null);
        
        // Auto-select current academic year based on today's date
        const today = new Date();
        const currentYearObj = anosDisponiveis.find(a => {
            const start = new Date(a.data_inicio);
            const end = new Date(a.data_fim);
            return today >= start && today <= end;
        }) || anosDisponiveis[0]; // Fallback to first available if none matches

        setFormData({
            codigo_turma: '',
            id_curso: '',
            id_periodo: '',
            id_sala: '',
            id_classe: '',
            ano: currentYearObj ? currentYearObj.nome : new Date().getFullYear().toString(), // Use dynamic year
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
        const matchesClasse = filters.classe === '' || (item.classe && item.classe.includes(filters.classe));
        const matchesSala = filters.sala === '' || item.sala.includes(filters.sala); 
        const matchesTurno = filters.turno === '' || item.turno === filters.turno;
        const matchesStatus = filters.status === '' || item.status === filters.status;

        return matchesSearch && matchesAno && matchesCurso && matchesClasse && matchesSala && matchesTurno && matchesStatus;
    });

    // Pagination Slicing
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTurmas = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    // Filter Configs
    const filterConfigs = useMemo(() => [
        { 
            key: 'ano', 
            label: 'Ano Lectivo', 
            icon: Calendar,
            options: anosDisponiveis.map(a => ({ value: a.nome, label: a.nome }))
        },
        { 
            key: 'classe', 
            label: 'Classe', 
            icon: BookOpen,
            options: classesDisponiveis.map(c => ({ value: c.nome_classe, label: c.nome_classe }))
        },
        { 
            key: 'curso', 
            label: 'Curso', 
            icon: BookOpen,
            options: cursosDisponiveis.map(c => ({ value: c.nome_curso, label: c.nome_curso }))
        },
        { 
            key: 'sala', 
            label: 'Sala', 
            icon: MapPin,
            options: salas.map(s => ({ value: `${s.numero_sala}`, label: `Sala ${s.numero_sala}` }))
        },
        { 
            key: 'turno', 
            label: 'Turno', 
            icon: Clock,
            options: periodosDisponiveis.map(p => ({ value: p.periodo, label: p.periodo }))
        },
        { 
            key: 'status', 
            label: 'Estado', 
            icon: Activity,
            options: [
                { value: 'Ativa', label: 'Ativa' },
                { value: 'Concluida', label: 'Concluída' }
            ]
        }
    ], [anosDisponiveis, classesDisponiveis, cursosDisponiveis, salas, periodosDisponiveis]);

    return (
        <div className="page-container turmas-page">
            <header className="page-header">
                <div className="turmas-header-content">
                    <div>
                        <h1>Gestão de Turmas</h1>
                        <p>Configuração e monitoramento das turmas do ano lectivo corrente.</p>
                    </div>
                    {hasPermission(PERMISSIONS.MANAGE_TURMAS) && (
                        <button
                            onClick={handleAdd}
                            className="btn-primary-action"
                        >
                            <Plus size={20} />
                            Novo Turma
                        </button>
                    )}
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
                        ref={filterButtonRef}
                        onClick={() => setShowFilters(true)}
                        className={`btn-toggle-filters ${showFilters ? 'btn-active' : ''}`}
                        aria-expanded={showFilters}
                        aria-label="Mostrar filtros"
                    >
                        <Filter size={18} aria-hidden="true" />
                        Filtros
                    </button>
                </div>

                {/* Filter Modal */}
                <FilterModal 
                    triggerRef={filterButtonRef}
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    filterConfigs={filterConfigs}
                    activeFilters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={resetFilters}
                />

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
                                    <th>Nome Turma</th>
                                    <th>Curso</th>
                                    <th>Classe</th>
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
                                        <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: '#ef4444'}}>
                                            {error}
                                        </td>
                                    </tr>
                                ) : currentTurmas.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                                            Nenhuma turma encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    currentTurmas.map((t) => (
                                        <tr key={t.id} className="animate-fade-in">
                                            <td className="turma-name-cell">{t.turma}</td>
                                            <td>{t.curso}</td>
                                            <td>{t.classe}</td>
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
                                                {hasPermission(PERMISSIONS.MANAGE_TURMAS) && (
                                                    <button
                                                        onClick={() => handleEdit(t)}
                                                        className="btn-edit-turma"
                                                        title="Editar Turma"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                )}
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
                <div className="modal-overlay">
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
                                    <label className="form-label-turmas">Código/Nome da Turma</label>
                                    <input 
                                        type="text" 
                                        placeholder="Gerado automaticamente..." 
                                        value={(() => {
                                            if (modalMode === 'edit') return formData.codigo_turma;
                                            
                                            // Preview generation logic
                                            const sala = salas.find(s => s.id_sala == formData.id_sala)?.numero_sala || '';
                                            const curso = cursosDisponiveis.find(c => c.id_curso == formData.id_curso)?.nome_curso?.substring(0,2).toUpperCase() || '';
                                            const classe = classesDisponiveis.find(c => c.id_classe == formData.id_classe)?.nivel || '';
                                            const periodo = periodosDisponiveis.find(p => p.id_periodo == formData.id_periodo)?.periodo?.charAt(0).toUpperCase() || '';
                                            const ano = formData.ano?.substring(formData.ano.length - 2) || '';
                                            
                                            const preview = `${sala}${curso}${classe}${periodo}${ano}`;
                                            return preview.length > 0 ? preview : 'Aguardando seleções...';
                                        })()}
                                        readOnly
                                        className="form-input-turmas" 
                                        style={{ background: '#f8fafc', fontWeight: 'bold', color: 'var(--primary-color)' }}
                                    />
                                    <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                        * O nome é gerado automaticamente com base nas seleções abaixo (Sala + Curso + Classe + Turno + Ano).
                                    </small>
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
                                    <label className="form-label-turmas">Classe</label>
                                    <select 
                                        value={formData.id_classe}
                                        onChange={e => setFormData({...formData, id_classe: e.target.value})}
                                        className="form-input-turmas"
                                    >
                                        <option value="">Seleccionar Classe</option>
                                        {classesDisponiveis.map(c => (
                                            <option key={c.id_classe} value={c.id_classe}>{c.nome_classe}</option>
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
                                    <select 
                                        value={formData.ano}
                                        onChange={e => setFormData({...formData, ano: e.target.value})}
                                        className="form-input-turmas"
                                    >
                                        <option value="">Seleccionar Ano</option>
                                        {anosDisponiveis.map(ano => (
                                            <option key={ano.id || ano.id_ano} value={ano.nome}>{ano.nome}</option>
                                        ))}
                                    </select>
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