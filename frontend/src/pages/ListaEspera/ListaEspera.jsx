import React, { useState, useEffect, useMemo, useRef } from 'react';
import './ListaEspera.css';
import { 
    Search, Plus, Bell, RefreshCw, X, Filter, BookOpen, Activity, AlertCircle, CheckCircle, UserPlus, ArrowRight, Trash2
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
    const [candidateSearch, setCandidateSearch] = useState('');
    const [availableCandidates, setAvailableCandidates] = useState([]);
    const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
    
    const filterButtonRef = useRef(null);

    const [filters, setFilters] = useState({
        curso: '',
        status: '',
        ano: ''
    });

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'prioridade', direction: 'desc' });

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

    // Search for candidates to add (Rejected or Pending)
    useEffect(() => {
        if (!showModal || candidateSearch.length < 3) {
            setAvailableCandidates([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            try {
                setIsSearchingCandidates(true);
                // Search for candidates that are NOT MATRICULADO and not already in waitlist
                // For simplicity, we search all and filter client side or use a specific endpoint if exists
                const res = await api.get(`candidaturas/?search=${candidateSearch}`);
                const data = res.data.results || res.data || [];
                // Filter out already matriculated ones
                setAvailableCandidates(data.filter(c => c.status !== 'MATRICULADO' && !c.lista_espera_id));
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearchingCandidates(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [candidateSearch, showModal]);


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
            alert("Candidato chamado com sucesso! Uma notificação foi enviada.");
            refresh(); 
        } catch (error) {
            console.error(error);
            alert("Erro ao chamar candidato.");
        }
    };

    const handleDelete = async (id, nome) => {
        if(!window.confirm(`Remover ${nome} da lista de espera?`)) return;
        try {
            await api.delete(`lista-espera/${id}/`);
            alert("Candidato removido da lista.");
            refresh();
        } catch (error) {
            console.error(error);
            alert("Erro ao remover candidato.");
        }
    };

    const handleAdd = async () => {
        if (!newEntry.id_candidato) {
            alert("Selecione um candidato primeiro.");
            return;
        }
        try {
            await api.post('lista-espera/adicionar_candidato_reprovado/', newEntry);
            alert("Candidato adicionado à lista de espera com sucesso!");
            setShowModal(false);
            setNewEntry({ id_candidato: '', prioridade: 0, observacao: '' });
            setCandidateSearch('');
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
                (item.candidato_numero?.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesCurso = filters.curso === '' || (item.curso1 === filters.curso);
            const matchesStatus = filters.status === '' || (item.status === filters.status);
            
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
                { value: 'Expirado', label: 'Expirado' }
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
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%'}}>
                    <div>
                        <h1>Lista de Espera</h1>
                        <p>Gestão de candidatos que aguardam por vagas remanescentes.</p>
                    </div>
                    <div className="page-header-actions" style={{display:'flex', gap:'12px'}}>
                        <button className="btn-action" onClick={() => refresh()} style={{padding:'0 16px', background:'white', color:'#1e293b', border:'1px solid #e2e8f0', borderRadius:'12px', height:'44px'}}>
                            <RefreshCw size={18} /> Atualizar
                        </button>
                        {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                            <button className="btn-action btn-primary" onClick={() => setShowModal(true)} style={{height:'44px', borderRadius:'12px'}}>
                                <UserPlus size={18} /> Adicionar Candidato
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="stats-container" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', marginBottom:'24px'}}>
                <div style={{background:'white', padding:'20px', borderRadius:'20px', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:'16px'}}>
                    <div style={{background:'#eff6ff', padding:'12px', borderRadius:'14px', color:'#2563eb'}}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <p style={{fontSize:'12px', color:'#64748b', fontWeight:700, margin:0, textTransform:'uppercase'}}>Em Espera</p>
                        <h2 style={{fontSize:'24px', fontWeight:900, color:'#1e293b', margin:0}}>{lista.filter(i => i.status === 'Aguardando').length}</h2>
                    </div>
                </div>
                <div style={{background:'white', padding:'20px', borderRadius:'20px', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:'16px'}}>
                    <div style={{background:'#f0fdf4', padding:'12px', borderRadius:'14px', color:'#16a34a'}}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p style={{fontSize:'12px', color:'#64748b', fontWeight:700, margin:0, textTransform:'uppercase'}}>Chamados</p>
                        <h2 style={{fontSize:'24px', fontWeight:900, color:'#1e293b', margin:0}}>{lista.filter(i => i.status === 'Chamado').length}</h2>
                    </div>
                </div>
            </div>

            <div className="table-card">
                <div className="search-filter-header">
                    <div className="search-input-container">
                        <Search className="search-input-icon" size={18} />
                        <input 
                            type="text" 
                            className="search-input"
                            placeholder="Buscar por nome ou número de inscrição..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        ref={filterButtonRef}
                        onClick={() => setShowFilters(true)}
                        className={`btn-action ${showFilters ? 'active' : ''}`}
                        style={{background: showFilters ? '#eff6ff' : 'white', border:'1px solid #e2e8f0', color:'#1e293b'}}
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
                                <th onClick={() => requestSort('prioridade')} style={{cursor:'pointer'}}>
                                    Prioridade {sortConfig.key === 'prioridade' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => requestSort('candidato_nome')} style={{cursor:'pointer', minWidth:'250px'}}>
                                    Candidato {sortConfig.key === 'candidato_nome' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Curso (Opção 1)</th>
                                <th>Média Final</th>
                                <th>Entrada</th>
                                <th>Estado</th>
                                <th style={{textAlign:'center'}}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{textAlign:'center', padding:'60px'}}>
                                    <div className="loading-spinner" style={{width:'32px', height:'32px', border:'3px solid #e2e8f0', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spinner 0.8s linear infinite', margin:'0 auto 12px'}}></div>
                                    <span style={{color:'#64748b', fontWeight:500}}>Carregando lista de espera...</span>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="7" style={{textAlign:'center', padding:'80px'}}>
                                    <div style={{background:'#f8fafc', width:'64px', height:'64px', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'#94a3b8'}}>
                                        <AlertCircle size={32} />
                                    </div>
                                    <h3 style={{color:'#1e293b', marginBottom: '4px'}}>Nenhum candidato na lista</h3>
                                    <p style={{color:'#64748b'}}>Tente ajustar os filtros ou pesquisar por outro termo.</p>
                                </td></tr>
                            ) : filtered.map((item, idx) => (
                                <tr key={item.id} style={{animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`}}>
                                    <td data-label="Prioridade">
                                        <span className="priority-pill">{item.prioridade}</span>
                                    </td>
                                    <td data-label="Candidato">
                                        <div style={{fontWeight:700, color:'#1e293b', fontSize:'15px'}}>{item.candidato_nome}</div>
                                        <div style={{fontSize:'12px', color:'#64748b', marginTop:'2px', fontFamily:'monospace', fontWeight:600}}>{item.candidato_numero}</div>
                                    </td>
                                    <td data-label="Curso" style={{fontSize:'14px', color:'#475569'}}>{item.curso1 || '-'}</td>
                                    <td data-label="Média" style={{fontWeight:700, color:'#1e3a8a'}}>{item.media} <small style={{fontSize:'10px', color:'#94a3b8'}}>val</small></td>
                                    <td data-label="Data" style={{fontSize:'13px', color:'#64748b'}}>{new Date(item.data_entrada).toLocaleDateString('pt-PT')}</td>
                                    <td data-label="Estado">
                                        <span className={`status-badge status-${item.status.toLowerCase()}`}>
                                            {item.status === 'Chamado' && <CheckCircle size={12} />}
                                            {item.status === 'Aguardando' && <Activity size={12} />}
                                            {item.status}
                                        </span>
                                    </td>
                                    <td style={{textAlign:'center'}}>
                                        <div style={{display:'flex', gap:'8px', justifyContent:'center'}}>
                                            {item.status === 'Aguardando' && hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                                                <button 
                                                    className="btn-action btn-primary" 
                                                    style={{height:'36px', padding:'0 16px', borderRadius:'10px'}}
                                                    onClick={() => handleCallCandidate(item.id, item.candidato_nome)}
                                                    title="Chamar Candidato"
                                                >
                                                    <Bell size={14} /> Chamar
                                                </button>
                                            )}
                                            {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                                                <button 
                                                    className="btn-action" 
                                                    style={{height:'36px', padding:'0 10px', borderRadius:'10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fee2e2'}}
                                                    onClick={() => handleDelete(item.id, item.candidato_nome)}
                                                    title="Remover da Lista"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Adição */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-card" style={{maxWidth:'600px'}} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{fontSize:'22px', fontWeight:800, color:'#1e293b'}}>Adicionar à Lista de Espera</h3>
                                <p style={{fontSize:'14px', color:'#64748b', margin:'4px 0 0 0'}}>Selecione um candidato para colocar na fila de espera.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{background:'#f1f5f9', border:'none', width:'40px', height:'40px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b'}}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{padding:'32px'}}>
                            <div className="form-group" style={{marginBottom:'24px'}}>
                                <label className="form-label">Pesquisar Candidato (Nome ou BI)</label>
                                <div style={{position:'relative'}}>
                                    <Search style={{position:'absolute', left:'14px', top:'14px', color:'#94a3b8'}} size={18} />
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        style={{width:'100%', paddingLeft:'44px'}}
                                        placeholder="Digite no mínimo 3 caracteres..."
                                        value={candidateSearch}
                                        onChange={e => setCandidateSearch(e.target.value)}
                                    />
                                </div>
                                
                                {isSearchingCandidates ? (
                                    <div style={{padding:'10px', textAlign:'center', color:'#64748b', fontSize:'13px'}}>Pesquisando...</div>
                                ) : availableCandidates.length > 0 ? (
                                    <div className="candidate-selection-list">
                                        {availableCandidates.map(c => (
                                            <div 
                                                key={c.id_candidato} 
                                                className={`candidate-item ${newEntry.id_candidato === c.id_candidato ? 'selected' : ''}`}
                                                onClick={() => setNewEntry({...newEntry, id_candidato: c.id_candidato})}
                                            >
                                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                                    <div>
                                                        <div style={{fontWeight:700, color:'#1e293b'}}>{c.nome_completo}</div>
                                                        <div style={{fontSize:'12px', color:'#64748b'}}>{c.numero_inscricao} | {c.numero_bi}</div>
                                                    </div>
                                                    <div style={{textAlign:'right'}}>
                                                        <span className="status-badge" style={{fontSize:'10px'}}>{c.status}</span>
                                                        <div style={{fontSize:'11px', color:'#3b82f6', marginTop:'4px'}}>{c.curso1_nome}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : candidateSearch.length >= 3 && (
                                    <div style={{padding:'10px', textAlign:'center', color:'#94a3b8', fontSize:'13px'}}>Nenhum candidato encontrado.</div>
                                )}
                            </div>

                            <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px', marginBottom:'24px'}}>
                                <div className="form-group">
                                    <label className="form-label">Prioridade</label>
                                    <input 
                                        type="number" 
                                        className="form-input"
                                        style={{width:'100%'}}
                                        value={newEntry.prioridade}
                                        onChange={e => setNewEntry({...newEntry, prioridade: parseInt(e.target.value) || 0})}
                                        min="0"
                                        max="100"
                                    />
                                    <small style={{color:'#94a3b8', fontSize:'11px'}}>0 - 100 (Maior = Topo)</small>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Observação</label>
                                    <input 
                                        className="form-input"
                                        style={{width:'100%'}}
                                        placeholder="Ex: Nota alta no curso de ADM"
                                        value={newEntry.observacao}
                                        onChange={e => setNewEntry({...newEntry, observacao: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div style={{display:'flex', gap:'16px', marginTop:'40px'}}>
                                <button 
                                    onClick={() => setShowModal(false)} 
                                    style={{flex:1, height:'48px', background:'white', border:'1px solid #e2e8f0', borderRadius:'14px', fontWeight:600, color:'#475569', cursor:'pointer'}}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleAdd} 
                                    className="btn-action btn-primary"
                                    style={{flex:2, height:'48px', justifyContent:'center', fontSize:'16px'}}
                                    disabled={!newEntry.id_candidato}
                                >
                                    Confirmar Inclusão <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaEspera;
