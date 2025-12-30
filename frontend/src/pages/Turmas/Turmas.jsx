import React, { useState } from 'react';
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Gestão de Turmas</h1>
                        <p>Configuração e monitoramento das turmas do ano lectivo corrente.</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="nav-item-active"
                        style={{ height: 'fit-content', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        <Plus size={20} />
                        Configurar Turma
                    </button>
                </div>
            </header>

            <div className="table-card" style={{ padding: '0' }}>
                {/* Search and Filters Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
                        <input
                            type="text"
                            placeholder="Pesquisar por ID, Turma ou Coordenador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', color: '#111827', fontSize: '15px' }}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: showFilters ? '#1e3a8a' : 'white', color: showFilters ? 'white' : '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 500 }}
                    >
                        <Filter size={18} />
                        Filtros
                    </button>
                </div>

                {/* Dynamic Filters */}
                {showFilters && (
                    <div style={{ padding: '24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Ano Lectivo</label>
                                <select name="ano" value={filters.ano} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', color: '#111827' }}>
                                    <option value="">Todos</option>
                                    <option value="2024/2025">2024/2025</option>
                                    <option value="2023/2024">2023/2024</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Curso</label>
                                <select name="curso" value={filters.curso} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}>
                                    <option value="">Todos</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Sala</label>
                                <select name="sala" value={filters.sala} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}>
                                    <option value="">Todas</option>
                                    <option value="Lab 01">Lab 01</option>
                                    <option value="Lab 02">Lab 02</option>
                                    <option value="S-204">S-204</option>
                                    <option value="S-102">S-102</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Turno</label>
                                <select name="turno" value={filters.turno} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}>
                                    <option value="">Todos</option>
                                    <option value="Manhã">Manhã</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Noite">Noite</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setFilters({ ano: '', curso: '', sala: '', turno: '' })}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Limpar Filtros</button>
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
                                    <td style={{ fontWeight: 700, color: '#1e3a8a' }}>{t.id}</td>
                                    <td style={{ fontWeight: 600 }}>{t.turma}</td>
                                    <td>{t.curso}</td>
                                    <td style={{ fontWeight: 500 }}>{t.sala}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                                                {t.coordenador.split(' ').pop().charAt(0)}
                                            </div>
                                            <span>{t.coordenador}</span>
                                        </div>
                                    </td>
                                    <td>{t.ano}</td>
                                    <td>{t.turno}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontWeight: 700, color: t.qtdAlunos >= 50 ? '#ef4444' : '#10b981' }}>{t.qtdAlunos} / 50</span>
                                            <div style={{ width: '80px', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ width: `${(t.qtdAlunos / 50) * 100}%`, height: '100%', background: t.qtdAlunos >= 50 ? '#ef4444' : '#1e3a8a' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleEdit(t)}
                                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
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
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ width: '90%', maxWidth: '600px', background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                                {modalMode === 'add' ? 'Nova Configuração de Turma' : `Editar Turma: ${selectedTurma?.turma}`}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: '#f8fafc', border: 'none', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}>
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        <form style={{ padding: '32px' }} onSubmit={(e) => e.preventDefault()}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Nome da Turma</label>
                                    <input type="text" placeholder="Ex: INF10A" defaultValue={selectedTurma?.turma} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Curso</label>
                                    <select defaultValue={selectedTurma?.curso} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}>
                                        <option>Seleccionar Curso</option>
                                        <option>Informática</option>
                                        <option>Gestão</option>
                                        <option>Direito</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Turno</label>
                                    <select defaultValue={selectedTurma?.turno} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}>
                                        <option>Seleccionar Turno</option>
                                        <option>Manhã</option>
                                        <option>Tarde</option>
                                        <option>Noite</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Sala</label>
                                    <input type="text" placeholder="Ex: Sala 01" defaultValue={selectedTurma?.sala} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Ano Lectivo</label>
                                    <input type="text" placeholder="Ex: 2024/2025" defaultValue={selectedTurma?.ano} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Coordenador</label>
                                    <input type="text" placeholder="Nome Completo do Professor" defaultValue={selectedTurma?.coordenador} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                </div>
                            </div>

                            {/* Capacity Alert */}
                            <div style={{ marginTop: '24px', padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7', display: 'flex', gap: '12px' }}>
                                <AlertTriangle size={20} color="#d97706" />
                                <p style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
                                    <strong>Aviso de Capacidade:</strong> O limite recomendado é entre 45 e 50 alunos por turma para garantir a qualidade do ensino e as normas da instituição.
                                </p>
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                                <button
                                    style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: '#1e3a8a', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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