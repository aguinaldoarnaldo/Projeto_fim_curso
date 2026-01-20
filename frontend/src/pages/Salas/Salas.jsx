import React, { useState, useEffect, useRef } from 'react';
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
    Monitor
} from 'lucide-react';
import Pagination from '../../components/Common/Pagination';
import api from '../../services/api';
import { useCache } from '../../context/CacheContext';
import './Salas.css';

const Salas = () => {
    const [searchTerm, setSearchTerm] = useState('');
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
        }, 2000);
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
            setSalas(data);
            setCache('salas', data);
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
            alert("Erro ao salvar. Verifique os dados e tente novamente.");
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

    // Filter Logic
    const filteredData = salas.filter(item => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            String(item.numero_sala).includes(term) ||
            String(item.bloco || '').toLowerCase().includes(term);
        
        return matchesSearch;
    });

    // Pagination Slicing
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSalas = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    // Helper to determine Room Type based on capacity/name
    const getRoomType = (sala) => {
        const cap = parseInt(sala.capacidade_alunos);
        if (cap >= 60) return { label: 'Auditório', color: '#7c3aed', bg: '#f5f3ff' };
        if (cap <= 25) return { label: 'Laboratório', color: '#059669', bg: '#ecfdf5' };
        return { label: 'Sala de Aula', color: '#2563eb', bg: '#eff6ff' };
    };

    // Helper for progress bar color
    const getCapacityColor = (cap) => {
        if (cap >= 60) return '#7c3aed';
        if (cap >= 40) return '#2563eb';
        return '#059669';
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="salas-header-content">
                    <div>
                        <h1>Gestão de Salas</h1>
                        <p>Controlo e distribuição das salas de aula e laboratórios.</p>
                    </div>
                    <button onClick={handleAdd} className="btn-primary-action">
                        <Plus size={20} />
                        Nova Sala
                    </button>
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
                                                            <Monitor size={18} />
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
                                                            <span>{s.total_alunos || 0} / {s.capacidade_alunos} Ocupado</span>
                                                            <span style={{fontSize: '11px', color: '#94a3b8'}}>
                                                                {Math.round(((s.total_alunos || 0) / s.capacidade_alunos) * 100)}% Cheia
                                                            </span>
                                                        </div>
                                                        <div className="capacity-bar-bg">
                                                            <div 
                                                                className="capacity-bar-fill" 
                                                                style={{
                                                                    width: `${Math.min(((s.total_alunos || 0) / s.capacidade_alunos) * 100, 100)}%`,
                                                                    background: getCapacityColor(s.capacidade_alunos)
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleEdit(s)}
                                                        className="btn-edit-sala"
                                                        title="Editar Sala"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
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

            {/* Modal de Criar/Editar Sala */}
            {showModal && (
                <div className="modal-overlay-salas">
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
