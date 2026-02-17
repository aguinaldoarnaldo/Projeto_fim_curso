import React, { useState, useEffect, useMemo, useRef } from 'react';
import './ListaEspera.css';
import { 
    Search, Plus, Bell, RefreshCw, X, ArrowUpRight, Filter, BookOpen, Activity, Calendar
} from 'lucide-react';
import { useDataCache } from '../../hooks/useDataCache'; 
import api from '../../services/api';

import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';
import FilterModal from '../../components/Common/FilterModal';

const ListaEspera = () => {
    const { hasPermission } = usePermission();
    // UI Local State
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newEntry, setNewEntry] = useState({ id_candidato: '', prioridade: 0, observacao: '' });
    const filterButtonRef = useRef(null);

    const [filters, setFilters] = useState({
        curso: '',
        status: '',
        ano: '' // If supported by backend or derived
    });

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const [cursosDisponiveis, setCursosDisponiveis] = useState([]);

    // Get courses for filter
    useEffect(() => {
        api.get('cursos/').then(res => {
            const data = res.data.results || res.data || [];
            setCursosDisponiveis(data);
        }).catch(err => console.error(err));
    }, []);


    // Data Fetcher
    const fetchListaData = async () => {
        const response = await api.get('lista-espera/');
        return response.data.results || response.data || [];
    };

    // USE DATA CACHE HOOK
    const { 
        data: cachedLista, 
        loading, 
        refresh 
    } = useDataCache('lista-espera', fetchListaData);

    const lista = Array.isArray(cachedLista) ? cachedLista : [];

    const handleCallCandidate = async (id, nome) => {
        if(!window.confirm(`Deseja chamar o candidato ${nome}?`)) return;
        try {
            await api.post(`lista-espera/${id}/chamar_candidato/`);
            alert("Candidato chamado com sucesso!");
            refresh(); 
        } catch (error) {
            console.error(error);
            alert("Erro ao chamar candidato.");
        }
    };

    const handleAdd = async () => {
        try {
            await api.post('lista-espera/adicionar_candidato_reprovado/', newEntry);
            alert("Candidato adicionado!");
            setShowModal(false);
            setNewEntry({ id_candidato: '', prioridade: 0, observacao: '' });
            refresh();
        } catch(error) {
            const msg = error.response?.data?.erro || "Erro ao adicionar.";
            alert(msg);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const resetFilters = () => {
        setFilters({ curso: '', status: '', ano: '' });
        setSearchTerm('');
    };

    const filtered = useMemo(() => {
        let sortableItems = lista.filter(item => {
            const matchesSearch = 
                (item.candidato_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.candidato_numero?.includes(searchTerm));
            
            const matchesCurso = filters.curso === '' || (item.curso1 === filters.curso);
            const matchesStatus = filters.status === '' || (item.status === filters.status);
            // item.ano_candidatura or similar if available
            
            return matchesSearch && matchesCurso && matchesStatus;
        });

        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                
                if (aValue === null) aValue = '';
                if (bValue === null) bValue = '';
                
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [lista, searchTerm, filters, sortConfig]);


    const filterConfigs = useMemo(() => [
        {
            key: 'status',
            label: 'Estado',
            icon: Activity,
            options: [
                { value: 'Aguardando', label: 'Aguardando' },
                { value: 'Chamado', label: 'Chamado' },
                // Add others if known
            ]
        },
        {
            key: 'curso',
            label: 'Curso',
            icon: BookOpen,
            options: cursosDisponiveis.map(c => ({ value: c.nome_curso, label: c.nome_curso }))
        }
    ], [cursosDisponiveis]);

    return (
        <div className="page-container lista-espera-page">
            <header className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1>Lista de Espera</h1>
                        <p>Gerenciamento de candidatos aguardando vagas.</p>
                    </div>
                    <div className="page-header-actions">
                        <button className="btn-action" onClick={() => refresh()} style={{background:'white', color:'#0f172a', border:'1px solid #e2e8f0'}}>
                            <RefreshCw size={18} /> Atualizar
                        </button>
                        {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                            <button className="btn-action" onClick={() => setShowModal(true)}>
                                <Plus size={18} /> Adicionar Candidato
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="table-card">
                <div className="search-filter-header">
                    <div className="search-input-container">
                        <Search className="search-input-icon" size={18} />
                        <input 
                            type="text" 
                            className="search-input"
                            placeholder="Buscar por nome ou número..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        ref={filterButtonRef}
                        onClick={() => setShowFilters(true)}
                        className={`btn-alternar-filtros ${showFilters ? 'active' : ''}`}
                    >
                        <Filter size={18} />
                        Filtros
                    </button>
                </div>

                <FilterModal 
                    triggerRef={filterButtonRef}
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    filterConfigs={filterConfigs}
                    activeFilters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={resetFilters}
                />

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Prioridade</th>
                                <th>Candidato</th>
                                <th>Curso (Opção 1)</th>
                                <th>Média</th>
                                <th>Data Entrada</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{textAlign:'center', padding:'30px'}}>Carregando...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="7" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>Nenhum candidato encontrado.</td></tr>
                            ) : filtered.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <span className="priority-highlight">{item.prioridade}</span>
                                    </td>
                                    <td>
                                        <div style={{fontWeight:600}}>{item.candidato_nome}</div>
                                        <div style={{fontSize:'12px', color:'#64748b'}}>{item.candidato_numero}</div>
                                    </td>
                                    <td>{item.curso1 || '-'}</td>
                                    <td>{item.media}</td>
                                    <td>{new Date(item.data_entrada).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge status-${item.status.toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        {item.status === 'Aguardando' && hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                                            <button 
                                                className="btn-action" 
                                                style={{padding:'6px 12px', fontSize:'12px'}}
                                                onClick={() => handleCallCandidate(item.id, item.candidato_nome)}
                                            >
                                                <Bell size={14} /> Chamar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Adicionar à Lista</h3>
                            <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}>
                                <X size={24} color="#64748b" />
                            </button>
                        </div>
                        
                        <div className="form-group">
                            <label>ID do Candidato (Do sistema)</label>
                            <input 
                                type="number" 
                                className="form-input"
                                value={newEntry.id_candidato}
                                onChange={e => setNewEntry({...newEntry, id_candidato: e.target.value})}
                                placeholder="Ex: 145"
                            />
                        </div>

                        <div className="form-group">
                            <label>Prioridade (Maior = Mais urgente)</label>
                            <input 
                                type="number" 
                                className="form-input"
                                value={newEntry.prioridade}
                                onChange={e => setNewEntry({...newEntry, prioridade: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label>Observação</label>
                            <textarea 
                                className="form-input"
                                rows="3"
                                value={newEntry.observacao}
                                onChange={e => setNewEntry({...newEntry, observacao: e.target.value})}
                            ></textarea>
                        </div>

                        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                            <button onClick={() => setShowModal(false)} style={{padding:'10px 20px', background:'white', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer'}}>Cancelar</button>
                            <button onClick={handleAdd} className="btn-action">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaEspera;
