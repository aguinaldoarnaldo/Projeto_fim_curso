import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Search, 
    Plus, 
    Edit3, 
    X, 
    Home, 
    Users, 
    ChevronRight,
    MapPin,
    Grid,
    Layers,
    LayoutGrid,
    Filter
} from 'lucide-react';

import Pagination from '../../components/Common/Pagination';
import FilterModal from '../../components/Common/FilterModal';
import api from '../../services/api';
import { parseApiError } from '../../utils/errorParser';
import { useCache } from '../../context/CacheContext';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';
import './Salas.css';

const Salas = () => {
    const { hasPermission } = usePermission();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        bloco: '',
        tipo: ''
    });
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedSala, setSelectedSala] = useState(null);
    const tableRef = useRef(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);



    const [salas, setSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        numero_sala: '',
        bloco: '',
        capacidade_alunos: ''
    });

    // Cache
    const { getCache, setCache } = useCache();

    // Fetch Salas
    useEffect(() => {
        fetchData();
    }, []);

    // Polling for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(true); // Silent force fetch
        }, 30000); // 30 seconds interval
        return () => clearInterval(interval);
    }, []);

    const fetchData = async (force = false) => {
        if (!force) {
            const cachedData = getCache('salas');
            if (cachedData) {
                setSalas(cachedData);
                setLoading(false);
                return;
            }
        }

        try {
            // Do not set loading=true on polling to avoid flash
            const response = await api.get('salas/');
            const data = response.data.results || response.data;
            setSalas(Array.isArray(data) ? data : []);
            setCache('salas', Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (err) {
            console.error('Erro ao buscar salas:', err);
            // Only show error on initial load
            if (loading) {
                setError('Falha ao carregar lista de salas.');
                setLoading(false);
            }
        }
    };

    const handleSave = async () => {
        try {
            // Validacao simples
            if (!formData.numero_sala || !formData.capacidade_alunos) {
                alert("Preencha o número da sala e a capacidade.");
                return;
            }

            const payload = {
                numero_sala: formData.numero_sala,
                bloco: formData.bloco,
                capacidade_alunos: formData.capacidade_alunos
            };

            if (modalMode === 'add') {
                await api.post('salas/', payload);
                alert('Sala criada com sucesso!');
            } else {
                await api.patch(`salas/${selectedSala.id_sala}/`, payload);
                alert('Sala atualizada com sucesso!');
            }

            setShowModal(false);
            fetchData(true); // Force refresh to update cache
        } catch (err) {
            console.error("Erro ao salvar sala:", err);
            const msg = parseApiError(err, "Erro ao salvar sala.");
            alert(msg);
        }
    };

    const handleEdit = (sala) => {
        setSelectedSala(sala);
        setFormData({
            numero_sala: sala.numero_sala,
            bloco: sala.bloco || '',
            capacidade_alunos: sala.capacidade_alunos
        });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedSala(null);
        setFormData({
            numero_sala: '',
            bloco: '',
            capacidade_alunos: ''
        });
        setModalMode('add');
        setShowModal(true);
    };

    // Helper to determine Room Type based on capacity/name
    function getRoomType(sala) {
        const cap = parseInt(sala.capacidade_alunos);
        if (cap >= 60) return { label: 'Auditório', color: '#7c3aed', bg: '#f5f3ff' };
        if (cap <= 25) return { label: 'Laboratório', color: '#059669', bg: '#ecfdf5' };
        return { label: 'Sala de Aula', color: '#2563eb', bg: '#eff6ff' };
    }

    // Helper for progress bar color
    function getCapacityColor(cap) {
        if (cap >= 60) return '#7c3aed';
        if (cap >= 40) return '#2563eb';
        return '#059669';
    }

    // Filter & Sort Logic
    const filteredData = React.useMemo(() => {
        let sortableItems = salas.filter(item => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = 
                String(item.numero_sala).includes(term) ||
                String(item.bloco || '').toLowerCase().includes(term);
            
            const type = getRoomType(item).label;
            const matchesFilters = 
                (filters.bloco === '' || item.bloco === filters.bloco) &&
                (filters.tipo === '' || type === filters.tipo);

            return matchesSearch && matchesFilters;
        });

        // Default sort by ID descending (newest first)
        sortableItems.sort((a, b) => b.id_sala - a.id_sala);
        
        return sortableItems;
    }, [salas, searchTerm, filters]);

    // Pagination Slicing
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSalas = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const filterButtonRef = useRef(null);

    // Filter Configs
    const filterConfigs = useMemo(() => [
        {
            key: 'bloco',
            label: 'Bloco',
            icon: Grid,
            options: [
                ...[...new Set(salas.map(s => s.bloco))].filter(Boolean).map(bloco => ({ label: bloco, value: bloco }))
            ]
        },
        {
            key: 'tipo',
            label: 'Tipo de Sala',
            icon: Layers,
            options: [
                { label: 'Sala de Aula', value: 'Sala de Aula' },
                { label: 'Laboratório', value: 'Laboratório' },
                { label: 'Auditório', value: 'Auditório' }
            ]
        }
    ], [salas]);

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ bloco: '', tipo: '' });
        setSearchTerm('');
        setCurrentPage(1);
    };

    return (
        <div className="page-container salas-page">
            <header className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1>Gestão de Salas</h1>
                        <p>Controlo e distribuição das salas de aula e laboratórios.</p>
                    </div>
                    <div className="page-header-actions">
                        {hasPermission(PERMISSIONS.MANAGE_SALAS) && (
                            <button onClick={handleAdd} className="btn-primary-action">
                                <Plus size={20} />
                                Nova Sala
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="table-card" style={{ padding: '0' }} ref={tableRef}>
                <div className="search-filters-header">
                    <div className="search-box-sala">
                        <Search className="search-icon-sala" size={20} aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Pesquisar por Sala ou Bloco..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="search-input-sala"
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button 
                            ref={filterButtonRef}
                            onClick={() => setShowFilters(!showFilters)} 
                            className={`btn-alternar-filtros ${showFilters ? 'active' : ''}`}
                        >
                            <Filter size={18} />
                            Filtros
                        </button>

                        <FilterModal
                            isOpen={showFilters}
                            onClose={() => setShowFilters(false)}
                            filterConfigs={filterConfigs}
                            activeFilters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={resetFilters}
                            triggerRef={filterButtonRef}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px', color: '#64748b'}}>
                        <div className="loading-spinner" style={{width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spinner 0.8s linear infinite'}}></div>
                        <span style={{fontWeight: 500}}>A carregar dados...</span>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Sala</th>
                                    <th>Tipo</th>
                                    <th>Bloco</th>
                                    <th>Capacidade</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {error ? (
                                    <tr>
                                        <td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#ef4444'}}>
                                            {error}
                                        </td>
                                    </tr>
                                ) : currentSalas.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                                            Nenhuma sala encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    currentSalas.map((s) => {
                                        const type = getRoomType(s);
                                        return (
                                            <tr key={s.id_sala} className="animate-fade-in">
                                                <td className="sala-name-cell">
                                                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                                        <div style={{
                                                            width: '36px', height: '36px', 
                                                            background: '#f1f5f9', borderRadius: '10px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#475569'
                                                        }}>
                                                            <LayoutGrid size={18} />
                                                        </div>
                                                         <div>
                                                            <span>Sala {s.numero_sala}</span>
                                                            <span style={{display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 500}}>{s.total_alunos || 0} alunos ativos</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 10px', 
                                                        borderRadius: '6px', 
                                                        fontSize: '12px', 
                                                        fontWeight: 600,
                                                        background: type.bg,
                                                        color: type.color
                                                    }}>
                                                        {type.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="bloco-badge">
                                                        <MapPin size={14} />
                                                        {s.bloco || 'Principal'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="capacity-wrapper">
                                                        <div className="capacity-text">
                                                            {(() => {
                                                                const detalhada = s.ocupacao_detalhada || {};
                                                                const values = Object.values(detalhada);
                                                                const maxOcupacao = values.length > 0 ? Math.max(...values) : 0;
                                                                const percent = Math.round((maxOcupacao / s.capacidade_alunos) * 100);
                                                                
                                                                return (
                                                                    <>
                                                                        <span title="Ocupação Máxima (Pior Turno)">{maxOcupacao} / {s.capacidade_alunos} (Máx)</span>
                                                                        <span style={{fontSize: '11px', color: '#94a3b8'}}>
                                                                            {percent}% Ocupada
                                                                        </span>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                        
                                                        {/* Progress Bar (Based on MAX occupancy) */}
                                                        {(() => {
                                                             const values = Object.values(s.ocupacao_detalhada || {});
                                                             const maxOcupacao = values.length > 0 ? Math.max(...values) : 0;
                                                             const percent = Math.min((maxOcupacao / s.capacidade_alunos) * 100, 100);
                                                             
                                                             return (
                                                                <div className="capacity-bar-bg">
                                                                    <div 
                                                                        className="capacity-bar-fill" 
                                                                        style={{
                                                                            width: `${percent}%`,
                                                                            background: percent >= 100 ? '#ef4444' : (percent >= 80 ? '#f59e0b' : '#3b82f6')
                                                                        }}
                                                                    />
                                                                </div>
                                                             );
                                                        })()}

                                                        {/* Shift Breakdown */}
                                                        <div style={{display: 'flex', gap: '8px', marginTop: '6px', fontSize: '10px', color: '#64748b', flexWrap: 'wrap'}}>
                                                            {Object.entries(s.ocupacao_detalhada || {}).map(([turno, qtd]) => (
                                                                <span key={turno} style={{background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0'}}>
                                                                    {turno}: <b>{qtd}</b>
                                                                </span>
                                                            ))}
                                                            {Object.keys(s.ocupacao_detalhada || {}).length === 0 && (
                                                                <span>Sem alunos</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {hasPermission(PERMISSIONS.MANAGE_SALAS) && (
                                                        <button
                                                            onClick={() => handleEdit(s)}
                                                            className="btn-edit-sala"
                                                            title="Editar Sala"
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {filteredData.length > itemsPerPage && (
                    <Pagination 
                        totalItems={filteredData.length} 
                        itemsPerPage={itemsPerPage} 
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* Modal de Criar/Editar Sala */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content-salas">
                        <div className="modal-header-salas">
                            <h2 className="modal-title-salas">
                                {modalMode === 'add' ? 'Adicionar Nova Sala' : `Editar Sala ${selectedSala?.numero_sala}`}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="btn-close-modal-salas">
                                <X size={20} />
                            </button>
                        </div>

                        <form className="modal-form-salas" onSubmit={(e) => e.preventDefault()}>
                            <div className="form-grid-salas-modal">
                                <div>
                                    <label className="form-label-salas">Número da Sala</label>
                                    <input 
                                        type="number" 
                                        placeholder="Ex: 101" 
                                        value={formData.numero_sala}
                                        onChange={e => setFormData({...formData, numero_sala: e.target.value})}
                                        className="form-input-salas"
                                    />
                                </div>
                                <div>
                                    <label className="form-label-salas">Bloco</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Bloco A" 
                                        value={formData.bloco}
                                        onChange={e => setFormData({...formData, bloco: e.target.value})}
                                        className="form-input-salas"
                                    />
                                </div>
                                <div>
                                    <label className="form-label-salas">Capacidade (Alunos)</label>
                                    <input 
                                        type="number" 
                                        placeholder="Ex: 40" 
                                        value={formData.capacidade_alunos}
                                        onChange={e => setFormData({...formData, capacidade_alunos: e.target.value})}
                                        className="form-input-salas"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions-salas">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="btn-modal-cancel"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn-modal-submit-sala"
                                >
                                    {modalMode === 'add' ? 'Adicionar Sala' : 'Salvar Alterações'} 
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Salas;
