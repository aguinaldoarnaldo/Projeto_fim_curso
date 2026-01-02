import React, { useState } from 'react';
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

const Turmas = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedTurma, setSelectedTurma] = useState(null);

    // Filters State
    const [filters, setFilters] = useState({
        ano: '',
        curso: '',
        sala: '',
        turno: ''
    });

    const turmasInitialData = [
        {
            id: 'T-2024-001',
            turma: 'INF10A',
            curso: 'Informática',
            sala: 'Lab 01',
            coordenador: 'Prof. Marcos André',
            ano: '2024/2025',
            turno: 'Manhã',
            qtdAlunos: 48
        },
        {
            id: 'T-2024-002',
            turma: 'GST12B',
            curso: 'Gestão',
            sala: 'S-204',
            coordenador: 'Profª. Maria Helena',
            ano: '2024/2025',
            turno: 'Tarde',
            qtdAlunos: 46
        },
        {
            id: 'T-2023-003',
            turma: 'DIR11C',
            curso: 'Direito',
            sala: 'S-102',
            coordenador: 'Dr. Lucas Bento',
            ano: '2023/2024',
            turno: 'Noite',
            qtdAlunos: 50
        },
        {
            id: 'T-2024-004',
            turma: 'INF10B',
            curso: 'Informática',
            sala: 'Lab 02',
            coordenador: 'Prof. João Paulo',
            ano: '2024/2025',
            turno: 'Manhã',
            qtdAlunos: 45
        },
    ];

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleEdit = (turma) => {
        setSelectedTurma(turma);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedTurma(null);
        setModalMode('add');
        setShowModal(true);
    };

    const filteredData = turmasInitialData.filter(item => {
        const matchesSearch = item.turma.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.coordenador.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAno = filters.ano === '' || item.ano === filters.ano;
        const matchesCurso = filters.curso === '' || item.curso === filters.curso;
        const matchesSala = filters.sala === '' || item.sala === filters.sala;
        const matchesTurno = filters.turno === '' || item.turno === filters.turno;

        return matchesSearch && matchesAno && matchesCurso && matchesSala && matchesTurno;
    });

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
                        className="nav-item-active btn-config-turma"
                    >
                        <Plus size={20} />
                        Configurar Turma
                    </button>
                </div>
            </header>


            <div className="table-card" style={{ padding: '0' }}>
                <div className="search-filters-header">
                    <div className="search-box-turma">
                        <Search className="search-icon-turma" size={20} />
                        <input
                            type="text"
                            placeholder="Pesquisar por ID, Turma ou Coordenador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-turma"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-toggle-filters"
                        style={{ background: showFilters ? '#1e3a8a' : 'white', color: showFilters ? 'white' : '#374151' }}
                    >
                        <Filter size={18} />
                        Filtros
                    </button>
                </div>


                {/* Dynamic Filters */}
                {showFilters && (
                    <div className="filters-expanded-pane">
                        <div className="filters-grid-turmas">
                            <div>
                                <label className="filter-label-turma">Ano Lectivo</label>
                                <select name="ano" value={filters.ano} onChange={handleFilterChange} className="filter-select-turma">
                                    <option value="">Todos</option>
                                    <option value="2024/2025">2024/2025</option>
                                    <option value="2023/2024">2023/2024</option>
                                </select>
                            </div>
                            <div>
                                <label className="filter-label-turma">Curso</label>
                                <select name="curso" value={filters.curso} onChange={handleFilterChange} className="filter-select-turma">
                                    <option value="">Todos</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                </select>
                            </div>
                            <div>
                                <label className="filter-label-turma">Sala</label>
                                <select name="sala" value={filters.sala} onChange={handleFilterChange} className="filter-select-turma">
                                    <option value="">Todas</option>
                                    <option value="Lab 01">Lab 01</option>
                                    <option value="Lab 02">Lab 02</option>
                                    <option value="S-204">S-204</option>
                                    <option value="S-102">S-102</option>
                                </select>
                            </div>
                            <div>
                                <label className="filter-label-turma">Turno</label>
                                <select name="turno" value={filters.turno} onChange={handleFilterChange} className="filter-select-turma">
                                    <option value="">Todos</option>
                                    <option value="Manhã">Manhã</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Noite">Noite</option>
                                </select>
                            </div>
                        </div>
                        <div className="clear-filters-box">
                            <button
                                onClick={() => setFilters({ ano: '', curso: '', sala: '', turno: '' })}
                                className="btn-clear-filters"
                            >
                                Limpar Filtros
                            </button>
                        </div>
                    </div>
                )}


                {/* Turmas Table */}
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '120px' }}>ID Turma</th>
                                <th>Nome Turma</th>
                                <th>Curso</th>
                                <th>Sala</th>
                                <th>Coordenador</th>
                                <th>Ano</th>
                                <th>Turno</th>
                                <th style={{ textAlign: 'center' }}>Alunos (Capacidade)</th>
                                <th style={{ textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((t) => (
                                <tr key={t.id}>
                                    <td className="turma-id-cell">{t.id}</td>
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
                                            <span style={{ fontWeight: 700, color: t.qtdAlunos >= 50 ? '#ef4444' : '#10b981' }}>{t.qtdAlunos} / 50</span>
                                            <div className="capacity-progress-container">
                                                <div style={{ width: `${(t.qtdAlunos / 50) * 100}%`, background: t.qtdAlunos >= 50 ? '#ef4444' : '#1e3a8a' }} className="capacity-progress-bar" />
                                            </div>
                                        </div>
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

                            ))}
                        </tbody>
                    </table>
                </div>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label-turmas">Nome da Turma</label>
                                    <input type="text" placeholder="Ex: INF10A" defaultValue={selectedTurma?.turma} className="form-input-turmas" />
                                </div>
                                <div>
                                    <label className="form-label-turmas">Curso</label>
                                    <select defaultValue={selectedTurma?.curso} className="form-input-turmas">
                                        <option>Seleccionar Curso</option>
                                        <option>Informática</option>
                                        <option>Gestão</option>
                                        <option>Direito</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label-turmas">Turno</label>
                                    <select defaultValue={selectedTurma?.turno} className="form-input-turmas">
                                        <option>Seleccionar Turno</option>
                                        <option>Manhã</option>
                                        <option>Tarde</option>
                                        <option>Noite</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label-turmas">Sala</label>
                                    <input type="text" placeholder="Ex: Sala 01" defaultValue={selectedTurma?.sala} className="form-input-turmas" />
                                </div>
                                <div>
                                    <label className="form-label-turmas">Ano Lectivo</label>
                                    <input type="text" placeholder="Ex: 2024/2025" defaultValue={selectedTurma?.ano} className="form-input-turmas" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label-turmas">Coordenador</label>
                                    <input type="text" placeholder="Nome Completo do Professor" defaultValue={selectedTurma?.coordenador} className="form-input-turmas" />
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