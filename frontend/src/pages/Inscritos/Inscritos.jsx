import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Inscritos.css';
import {
  Calendar, Printer, Search, Filter, RotateCcw,
  BookOpen, Activity, CreditCard, Clock, UserPlus,
  Bell, Trash2, ArrowRight, AlertCircle, CheckCircle,
  Users, X, Info, ChevronDown, ChevronUp, GraduationCap, Plus
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/Common/Pagination';
import api from '../../services/api';
import { parseApiError } from '../../utils/errorParser';
import { useDataCache } from '../../hooks/useDataCache';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';

// Sub-components
import InscritosTable from './components/InscritosTable';
import EvaluationModal from './components/EvaluationModal';
import ExamSchedulingModal from './components/ExamSchedulingModal';
import CallListModal from './components/CallListModal';
import CandidateDetailModal from './components/CandidateDetailModal';
import EditCandidateModal from './components/EditCandidateModal';
import FilterModal from '../../components/Common/FilterModal';

// ─────────────────────────────────────────────────────────────
//  LISTA DE ESPERA PANEL (inline, no separate page)
// ─────────────────────────────────────────────────────────────
const ListaEsperaPanel = ({ inscritosList, onRefreshInscritos }) => {
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(23);
  const [sortConfig, setSortConfig] = useState({ key: 'prioridade', direction: 'desc' });

  // Add to waitlist modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [formData, setFormData] = useState({ id_candidato: '', prioridade: 0, observacao: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Lista de espera data
  const { data: cachedLista, loading: loadingLista, refresh: refreshLista } = useDataCache(
    'lista-espera',
    async () => {
      const res = await api.get('lista-espera/');
      return res.data.results || res.data || [];
    }
  );
  const lista = Array.isArray(cachedLista) ? cachedLista : [];

  // Candidates that are in "LISTA_ESPERA" status (from inscritos)
  const listaEsperaCandidates = useMemo(() =>
    inscritosList.filter(i => i.status === 'LISTA_ESPERA'),
    [inscritosList]
  );

  // Candidate search debounce
  useEffect(() => {
    if (!showAddModal || candidateSearch.length < 2) { setAvailableCandidates([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`candidaturas/?search=${candidateSearch}`);
        const data = res.data.results || res.data || [];
        setAvailableCandidates(
          data.filter(c => c.status !== 'MATRICULADO' && c.status !== 'LISTA_ESPERA' && !c.lista_espera_id)
        );
      } catch { setAvailableCandidates([]); }
      finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [candidateSearch, showAddModal]);

  const handleSelectCandidate = (c) => {
    setSelectedCandidate(c);
    setFormData(prev => ({ ...prev, id_candidato: c.id_candidato }));
    setAddStep(2);
  };

  const resetModal = () => {
    setShowAddModal(false); setAddStep(1);
    setSelectedCandidate(null); setCandidateSearch('');
    setAvailableCandidates([]);
    setFormData({ id_candidato: '', prioridade: 0, observacao: '' });
    setFormError('');
  };

  const handleAdd = async () => {
    if (!formData.id_candidato) { setFormError('Selecione um candidato.'); return; }
    setIsSubmitting(true); setFormError('');
    try {
      await api.post('lista-espera/adicionar_candidato_reprovado/', formData);
      refreshLista(); onRefreshInscritos();
      resetModal();
    } catch (err) {
      setFormError(err.response?.data?.erro || 'Erro ao adicionar candidato.');
    } finally { setIsSubmitting(false); }
  };

  const handleCall = async (id, nome) => {
    if (!window.confirm(`Chamar o candidato ${nome} para uma vaga?`)) return;
    try {
      await api.post(`lista-espera/${id}/chamar_candidato/`);
      refreshLista();
    } catch { alert('Erro ao chamar candidato.'); }
  };

  const handleRemove = async (id, nome) => {
    if (!window.confirm(`Remover "${nome}" da lista de espera? O status será revertido para NAO_CLASSIFICADO.`)) return;
    try {
      await api.delete(`lista-espera/${id}/`);
      refreshLista(); onRefreshInscritos();
    } catch { alert('Erro ao remover candidato.'); }
  };

  const handleMatricularEspera = (candidato) => {
    navigate('/matriculas/nova', { state: { candidato } });
  };

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ col }) => sortConfig.key === col
    ? (sortConfig.direction === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
    : null;

  const filteredLista = useMemo(() => {
    let items = lista.filter(item =>
      (item.candidato_nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.candidato_numero || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortConfig.key) {
      items.sort((a, b) => {
        let av = a[sortConfig.key] ?? ''; let bv = b[sortConfig.key] ?? '';
        if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
        if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [lista, searchTerm, sortConfig]);

  const currentData = filteredLista.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => ({
    total: lista.length,
    aguardando: lista.filter(i => i.status === 'Aguardando').length,
    chamados: lista.filter(i => i.status === 'Chamado').length,
  }), [lista]);

  return (
    <div className="le-panel">
      {/* Stats */}
      <div className="le-panel-stats">
        <div className="le-pstat le-pstat-total">
          <Users size={18} />
          <div><span className="le-pstat-val">{stats.total}</span><span className="le-pstat-lbl">Na Lista</span></div>
        </div>
        <div className="le-pstat le-pstat-waiting">
          <Clock size={18} />
          <div><span className="le-pstat-val">{stats.aguardando}</span><span className="le-pstat-lbl">Aguardando</span></div>
        </div>
        <div className="le-pstat le-pstat-called">
          <CheckCircle size={18} />
          <div><span className="le-pstat-val">{stats.chamados}</span><span className="le-pstat-lbl">Chamados</span></div>
        </div>
        <div style={{ flex: 1 }} />
        {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
          <button className="le-add-btn" onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} /> Adicionar à Lista
          </button>
        )}
      </div>

      {/* Info box */}
      <div className="le-info-bar">
        <Info size={14} />
        <span>
          Candidatos nesta lista têm status <strong>LISTA DE ESPERA</strong>. Quando houver vaga disponível,
          use o botão <strong>Matricular</strong> para matriculá-los directamente.
        </span>
      </div>

      {/* Search */}
      <div className="search-filter-header" style={{ borderRadius: '12px 12px 0 0' }}>
        <div className="search-input-container">
          <Search className="search-input-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Pesquisar por nome ou número de inscrição..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table le-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('prioridade')} style={{ cursor: 'pointer', width: '90px' }}>
                Prioridade <SortIcon col="prioridade" />
              </th>
              <th onClick={() => requestSort('candidato_nome')} style={{ cursor: 'pointer', minWidth: '220px' }}>
                Candidato <SortIcon col="candidato_nome" />
              </th>
              <th>Curso (1ª Opção)</th>
              <th onClick={() => requestSort('media')} style={{ cursor: 'pointer' }}>
                Média <SortIcon col="media" />
              </th>
              <th onClick={() => requestSort('data_entrada')} style={{ cursor: 'pointer' }}>
                Data Entrada <SortIcon col="data_entrada" />
              </th>
              <th>Observação</th>
              <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>
                Estado <SortIcon col="status" />
              </th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loadingLista ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                A carregar lista de espera...
              </td></tr>
            ) : currentData.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                <Clock size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                <p style={{ margin: 0 }}>Nenhum candidato na lista de espera.</p>
                {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>
                    Use o botão <strong>"Adicionar à Lista"</strong> para inserir candidatos.
                  </p>
                )}
              </td></tr>
            ) : currentData.map((item, idx) => {
              // Find the full candidate from inscritos list for matricula
              const inscrito = inscritosList.find(i => i.id === item.candidato_numero);
              return (
                <tr key={item.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <td data-label="Prioridade">
                    <span className={`le-prio-badge ${item.prioridade >= 50 ? 'high' : item.prioridade >= 20 ? 'medium' : 'low'}`}>
                      {item.prioridade}
                    </span>
                  </td>
                  <td data-label="Candidato">
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>{item.candidato_nome}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>{item.candidato_numero}</div>
                  </td>
                  <td data-label="Curso" style={{ fontSize: '13px', color: '#475569' }}>{item.curso1 || '—'}</td>
                  <td data-label="Média" style={{ fontWeight: 800, color: '#1e3a8a' }}>{item.media || '—'}</td>
                  <td data-label="Data" style={{ fontSize: '13px', color: '#64748b' }}>
                    {item.data_entrada ? new Date(item.data_entrada).toLocaleDateString('pt-PT') : '—'}
                  </td>
                  <td data-label="Observação" style={{ fontSize: '12px', color: '#64748b', maxWidth: '160px' }}>
                    {item.observacao
                      ? <span title={item.observacao} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{item.observacao}</span>
                      : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>—</span>
                    }
                  </td>
                  <td data-label="Estado">
                    <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                      {item.status === 'Chamado' && <CheckCircle size={11} />}
                      {item.status === 'Aguardando' && <Clock size={11} />}
                      {item.status === 'Expirado' && <AlertCircle size={11} />}
                      {item.status}
                    </span>
                  </td>
                  <td data-label="Ações">
                    <div className="actions-cell">
                      {/* Chamar */}
                      {item.status === 'Aguardando' && hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                        <button
                          className="btn-icon btn-view"
                          onClick={() => handleCall(item.id, item.candidato_nome)}
                          title="Chamar Candidato"
                          style={{ background: '#eff6ff', color: '#2563eb' }}
                        >
                          <Bell size={15} />
                        </button>
                      )}
                      {/* Matricular */}
                      {hasPermission(PERMISSIONS.CREATE_MATRICULA) && inscrito && (
                        <button
                          className="btn-icon btn-enroll can-enroll"
                          onClick={() => handleMatricularEspera(inscrito)}
                          title="Matricular Candidato (vaga disponível)"
                        >
                          <GraduationCap size={15} />
                        </button>
                      )}
                      {/* Remover */}
                      {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleRemove(item.id, item.candidato_nome)}
                          title="Remover da Lista de Espera"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        totalItems={filteredLista.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* ─── ADD TO WAITLIST MODAL ─── via Portal (renders in body) */}
      {showAddModal && createPortal(
        <div
          className="modal-overlay"
          onClick={resetModal}
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div
            className="le-add-modal"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              animation: 'scaleUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div className="modal-header" style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9', padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="le-modal-icon-wrap"><UserPlus size={20} /></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Adicionar à Lista de Espera</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                    Passo {addStep} de 2 — {addStep === 1 ? 'Selecione o candidato' : 'Confirme os detalhes'}
                  </p>
                </div>
              </div>
              <button onClick={resetModal} className="le-close-btn"><X size={18} /></button>
            </div>

            {/* Steps indicator */}
            <div className="le-steps-bar">
              <div className={`le-step-indicator ${addStep >= 1 ? 'active' : ''} ${addStep > 1 ? 'done' : ''}`}>
                <span className="le-step-num">1</span> Candidato
              </div>
              <div className="le-step-connector" />
              <div className={`le-step-indicator ${addStep >= 2 ? 'active' : ''}`}>
                <span className="le-step-num">2</span> Detalhes
              </div>
            </div>

            <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: 'calc(80vh - 180px)' }}>
              {addStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="le-info-note">
                    <Info size={14} />
                    Apenas candidatos com status <strong>NAO_CLASSIFICADO</strong>, <strong>AUSENTE</strong> ou <strong>INSCRITO</strong> podem ser adicionados.
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pesquisar Candidato (Nome, BI ou Nº Inscrição)</label>
                    <div style={{ position: 'relative' }}>
                      <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '42px', width: '100%' }}
                        placeholder="Digite pelo menos 2 caracteres..."
                        value={candidateSearch}
                        onChange={e => setCandidateSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="le-results-box">
                    {isSearching ? (
                      <div className="le-results-state">Pesquisando...</div>
                    ) : availableCandidates.length > 0 ? (
                      availableCandidates.map(c => (
                        <div key={c.id_candidato} className="le-candidate-row" onClick={() => handleSelectCandidate(c)}>
                          <div className="le-cand-avatar">{(c.nome_completo || '?')[0].toUpperCase()}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>{c.nome_completo}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{c.numero_inscricao}</span>
                              <span>•</span>
                              <span>{c.numero_bi}</span>
                              <span>•</span>
                              <span style={{ color: '#2563eb', fontWeight: 600 }}>{c.curso1_nome || 'Sem curso'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span className={`status-badge ${c.status === 'NAO_CLASSIFICADO' ? 'status-rejected' : c.status === 'INSCRITO' ? 'status-pending' : 'status-analysis'}`} style={{ fontSize: '10px' }}>
                              {c.status}
                            </span>
                            <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                          </div>
                        </div>
                      ))
                    ) : candidateSearch.length >= 2 ? (
                      <div className="le-results-state" style={{ color: '#94a3b8' }}>
                        <AlertCircle size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
                        Nenhum candidato elegível encontrado.
                      </div>
                    ) : (
                      <div className="le-results-state" style={{ color: '#cbd5e1' }}>Digite para pesquisar</div>
                    )}
                  </div>
                </div>
              )}

              {addStep === 2 && selectedCandidate && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Selected preview */}
                  <div className="le-selected-box">
                    <div className="le-cand-avatar" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', width: '48px', height: '48px', fontSize: '18px' }}>
                      {(selectedCandidate.nome_completo || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#14532d', fontSize: '15px' }}>{selectedCandidate.nome_completo}</div>
                      <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                        {selectedCandidate.numero_inscricao} • {selectedCandidate.curso1_nome || 'Sem curso'}
                      </div>
                    </div>
                    <button
                      onClick={() => { setAddStep(1); setSelectedCandidate(null); setCandidateSearch(''); }}
                      style={{ background: 'white', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, color: '#16a34a', cursor: 'pointer' }}
                    >
                      Alterar
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Prioridade (0 – 100)</label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: '100%' }}
                        value={formData.prioridade}
                        onChange={e => setFormData(prev => ({ ...prev, prioridade: parseInt(e.target.value) || 0 }))}
                        min="0" max="100"
                      />
                      <small style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Maior número = maior prioridade na fila</small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Observação <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                      <textarea
                        className="form-input"
                        style={{ width: '100%', resize: 'vertical', minHeight: '70px', lineHeight: '1.5', fontFamily: 'inherit' }}
                        placeholder="Ex: Alta nota de exame, preferência pelo turno da manhã..."
                        value={formData.observacao}
                        onChange={e => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>

                  {formError && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', color: '#dc2626', fontSize: '13px' }}>
                      <AlertCircle size={14} /> {formError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer le-modal-footer-btns" style={{ background: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '18px 28px', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
              <button
                onClick={addStep === 1 ? resetModal : () => setAddStep(1)}
                style={{ height: '44px', padding: '0 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                {addStep === 1 ? 'Cancelar' : '← Voltar'}
              </button>
              {addStep === 2 && (
                <button
                  onClick={handleAdd}
                  disabled={isSubmitting || !formData.id_candidato}
                  className="btn-primary"
                  style={{ height: '44px', padding: '0 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Adicionando...' : <><Plus size={16} /> Confirmar Inclusão</>}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  MAIN INSCRITOS PAGE
// ─────────────────────────────────────────────────────────────
const Inscritos = () => {
  const { hasPermission } = usePermission();
  const navigate = useNavigate();

  // TABS
  const [activeTab, setActiveTab] = useState('inscricoes'); // 'inscricoes' | 'lista_espera'

  const [selectedCandidato, setSelectedCandidato] = useState(null);
  const [rupGenerated, setRupGenerated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const tableRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(23);

  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [candidateToEvaluate, setCandidateToEvaluate] = useState(null);
  const [examGrade, setExamGrade] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [initialEditData, setInitialEditData] = useState(null);

  const [filters, setFilters] = useState({ ano: '', status: '', curso: '', status_rup: '' });

  const [showExamModal, setShowExamModal] = useState(false);
  const [examConfig, setExamConfig] = useState({
    data_inicio: new Date().toISOString().split('T')[0],
    hora_inicio: '08:00',
    candidatos_por_sala: '',
    limite_candidatos: ''
  });
  const [isProcessingExams, setIsProcessingExams] = useState(false);
  const [showCallListModal, setShowCallListModal] = useState(false);
  const [callListData, setCallListData] = useState([]);
  const filterButtonRef = useRef(null);
  const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
  const [anosDisponiveis, setAnosDisponiveis] = useState([]);

  const fetchCandidatesData = async () => {
    const response = await api.get('candidaturas/');
    const data = response.data.results || response.data;
    if (!Array.isArray(data)) return [];
    return data.map(c => ({
      id: (c.numero_inscricao || `INS-${c.id_candidato || 'UNKNOWN'}`).toString(),
      real_id: c.id_candidato,
      nome: c.nome_completo || 'Sem Nome',
      genero: c.genero === 'M' ? 'Masculino' : 'Feminino',
      dataNascimento: c.data_nascimento,
      nacionalidade: c.nacionalidade || 'Angolana',
      bi: c.numero_bi || 'N/A',
      dataEmissaoBI: 'N/A',
      naturalidade: c.naturalidade || 'N/A',
      provincia: c.provincia || '',
      municipio: c.municipio || '',
      residencia: c.residencia || 'N/A',
      telefone: c.telefone || 'N/A',
      email: c.email || '',
      deficiencia: c.deficiencia || 'Não',
      tipo_escola: c.tipo_escola || 'Pública',
      escola9: c.tipo_escola || 'Pública',
      nomeEscola: c.escola_proveniencia || 'N/A',
      municipioEscola: c.municipio_escola || 'N/A',
      anoConclusao: c.ano_conclusao,
      anoInscricao: c.ano_lectivo_nome || (c.criado_em ? new Date(c.criado_em).getFullYear().toString() : '2026'),
      anoLectivoAtivo: c.ano_lectivo_ativo,
      nota9: parseFloat(c.media_final) || 0,
      notaExame: c.nota_exame,
      curso1: c.curso1_nome || 'N/A',
      curso2: c.curso2_nome || 'N/A',
      turno: c.turno_preferencial || 'N/A',
      status: c.status || 'INSCRITO',
      exame_data: c.exame_data,
      dataInscricao: c.criado_em ? new Date(c.criado_em).toLocaleDateString() : 'N/A',
      encarregado: {
        nome: c.nome_encarregado || 'N/A', parentesco: c.parentesco_encarregado || 'N/A',
        bi: c.numero_bi_encarregado || 'N/A', telefone: c.telefone_encarregado || 'N/A',
        telefoneAlt: c.telefone_alternativo_encarregado || 'N/A', email: c.email_encarregado || 'N/A',
        profissao: c.profissao_encarregado || 'N/A', residencia: c.residencia_encarregado || 'N/A'
      },
      files: { foto: c.foto_passe, bi: c.comprovativo_bi, certificado: c.certificado },
      rupe: c.rupe_info
    }));
  };

  const {
    data: cachedInscritos, loading: isLoading, refresh, update: updateInscrito, error: fetchError
  } = useDataCache('inscritos', fetchCandidatesData);

  const inscritos = Array.isArray(cachedInscritos) ? cachedInscritos : [];

  useEffect(() => {
    if (selectedCandidato && inscritos.length > 0) {
      const updated = inscritos.find(i => i.id === selectedCandidato.id);
      if (updated && (
        updated.status !== selectedCandidato.status ||
        updated.notaExame !== selectedCandidato.notaExame ||
        (updated.rupe?.status_rup !== selectedCandidato.rupe?.status_rup)
      )) { setSelectedCandidato(updated); }
    }
  }, [inscritos, selectedCandidato?.id]);

  useEffect(() => {
    api.get('cursos/').then(r => setCursosDisponiveis(r.data.results || r.data || [])).catch(() => {});
    api.get('anos-lectivos/').then(r => setAnosDisponiveis(r.data.results || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const syncIfVisible = () => { if (!document.hidden) refresh(true); };
    const interval = setInterval(syncIfVisible, 60000);
    window.addEventListener('focus', syncIfVisible);
    return () => { clearInterval(interval); window.removeEventListener('focus', syncIfVisible); };
  }, [refresh]);

  const [sortConfig, setSortConfig] = useState({ key: 'real_id', direction: 'desc' });
  const requestSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  // Counts for tabs
  const inscricoesCount = useMemo(() =>
    inscritos.filter(i => i.status !== 'LISTA_ESPERA').length, [inscritos]);
  const listaEsperaCount = useMemo(() =>
    inscritos.filter(i => i.status === 'LISTA_ESPERA').length, [inscritos]);

  const filteredInscritos = useMemo(() => {
    let items = [...inscritos]; // Mostrar todos incluindo LISTA_ESPERA
    items = items.filter(i => {
      const nameMatch = (i.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const idMatch = (i.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || idMatch;
      const matchesAno = !filters.ano || i.anoInscricao === filters.ano;
      const matchesStatus = !filters.status || (i.status || '').toUpperCase() === filters.status.toUpperCase();
      const matchesCurso = !filters.curso || i.curso1 === filters.curso;
      const matchesRUP = !filters.status_rup || (i.rupe?.status_rup || '').toUpperCase() === filters.status_rup.toUpperCase();
      return matchesSearch && matchesAno && matchesStatus && matchesCurso && matchesRUP;
    });
    if (sortConfig.key) {
      items.sort((a, b) => {
        let av = a[sortConfig.key]; let bv = b[sortConfig.key];
        if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
        if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [inscritos, searchTerm, filters, sortConfig]);

  const currentData = filteredInscritos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenDetail = (candidato) => { setShowEvaluationModal(false); setSelectedCandidato(candidato); };
  const handleOpenEvaluation = (candidato) => {
    setSelectedCandidato(null); setCandidateToEvaluate(candidato); setExamGrade(''); setShowEvaluationModal(true);
  };
  const handleCloseEvaluation = () => { setShowEvaluationModal(false); setCandidateToEvaluate(null); setExamGrade(''); };
  const handleSubmitEvaluation = async () => {
    if (!examGrade || isNaN(examGrade) || examGrade < 0 || examGrade > 20) { alert("Nota válida: 0-20."); return; }
    try {
      const grade = parseFloat(examGrade);
      const response = await api.post(`candidaturas/${candidateToEvaluate.real_id}/avaliar/`, { nota: grade });
      const { status, nota } = response.data;
      updateInscrito(candidateToEvaluate.id, { notaExame: nota, status });
      alert(`Avaliação registada! Candidato: ${status}.`);
    } catch (err) { alert(parseApiError(err, "Erro ao salvar avaliação.")); }
    handleCloseEvaluation();
  };

  const handleEditClick = (candidato) => {
    setInitialEditData({
      id: candidato.id, real_id: candidato.real_id,
      nome: candidato.nome, bi: candidato.bi, genero: candidato.genero === 'Masculino' ? 'M' : 'F',
      dataNascimento: candidato.dataNascimento, nacionalidade: candidato.nacionalidade,
      naturalidade: candidato.naturalidade, provincia: candidato.provincia,
      municipio: candidato.municipio, residencia: candidato.residencia,
      telefone: candidato.telefone, email: candidato.email, deficiencia: candidato.deficiencia,
      escola_proveniencia: candidato.nomeEscola, municipio_escola: candidato.municipioEscola,
      tipo_escola: candidato.tipo_escola, ano_conclusao: candidato.anoConclusao,
      media_final: candidato.nota9,
      enc_nome: candidato.encarregado?.nome || '', enc_parentesco: candidato.encarregado?.parentesco || '',
      enc_telefone: candidato.encarregado?.telefone || '', enc_email: candidato.encarregado?.email || '',
      enc_residencia: candidato.encarregado?.residencia || '',
      notaExame: candidato.notaExame || '', status: candidato.status,
      foto: candidato.files?.foto, foto_preview: null, foto_file: null,
      anoLectivoAtivo: candidato.anoLectivoAtivo
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data) => {
    if (!data.nome || !data.bi) { alert("Nome e BI são obrigatórios."); return; }
    try {
      const toDecimal = (val) => (val && val !== '') ? parseFloat(val) : null;
      const toInt = (val) => (val && val !== '') ? parseInt(val) : null;
      const formData = new FormData();
      formData.append('nome_completo', data.nome); formData.append('numero_bi', data.bi);
      formData.append('genero', data.genero);
      if (data.dataNascimento) formData.append('data_nascimento', data.dataNascimento);
      formData.append('nacionalidade', data.nacionalidade); formData.append('naturalidade', data.naturalidade);
      formData.append('provincia', data.provincia); formData.append('municipio', data.municipio);
      formData.append('residencia', data.residencia); formData.append('telefone', data.telefone);
      if (data.email) formData.append('email', data.email);
      formData.append('deficiencia', data.deficiencia || 'Não');
      formData.append('escola_proveniencia', data.escola_proveniencia);
      formData.append('municipio_escola', data.municipio_escola);
      formData.append('tipo_escola', data.tipo_escola);
      if (data.ano_conclusao) formData.append('ano_conclusao', toInt(data.ano_conclusao));
      if (data.media_final) formData.append('media_final', toDecimal(data.media_final));
      formData.append('nome_encarregado', data.enc_nome);
      formData.append('parentesco_encarregado', data.enc_parentesco);
      formData.append('telefone_encarregado', data.enc_telefone);
      if (data.enc_email) formData.append('email_encarregado', data.enc_email);
      formData.append('residencia_encarregado', data.enc_residencia);
      if (data.notaExame !== '') formData.append('nota_exame', toDecimal(data.notaExame));
      formData.append('status', data.status);
      if (data.foto_file) formData.append('foto_passe', data.foto_file);
      await api.patch(`candidaturas/${data.real_id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      refresh();
      alert("Dados atualizados com sucesso!");
      setShowEditModal(false);
    } catch (error) { alert(parseApiError(error, "Erro ao salvar alterações.")); }
  };

  const handleConfirmPayment = async (candidato) => {
    if (!candidato.rupe) return;
    if (!window.confirm(`Confirmar pagamento do RUPE ${candidato.rupe.codigo_rup}?`)) return;
    try {
      await api.post(`candidaturas/${candidato.real_id}/confirmar_pagamento/`);
      alert("Pagamento confirmado com sucesso!");
      refresh(); closeDetail();
    } catch (error) { alert(parseApiError(error, "Erro ao confirmar pagamento.")); }
  };

  const handleDistributeExams = async () => {
    if (!examConfig.data_inicio) { alert("Selecione a data de início."); return; }
    if (window.confirm("Distribui candidatos do ano lectivo activo por salas. Continuar?")) {
      try {
        setIsProcessingExams(true);
        const res = await api.post('candidaturas/distribuir_exames/', examConfig);
        alert(res.data.mensagem); setShowExamModal(false); refresh();
      } catch (err) {
        alert(err.response?.data?.erro || "Erro ao processar distribuição.");
      } finally { setIsProcessingExams(false); }
    }
  };

  const handleFetchCallList = async () => {
    try {
      const res = await api.get('candidaturas/lista_chamada/');
      setCallListData(res.data); setShowCallListModal(true);
    } catch { alert("Erro ao carregar lista de chamada."); }
  };

  const closeDetail = () => { setSelectedCandidato(null); setRupGenerated(false); };

  const handleFilterChange = (key, value) => { setFilters({ ...filters, [key]: value }); setCurrentPage(1); };
  const resetFilters = () => { setFilters({ ano: '', status: '', curso: '', status_rup: '' }); setSearchTerm(''); setCurrentPage(1); setShowFilters(false); };

  const filterConfigs = useMemo(() => [
    { key: 'ano', label: 'Ano de Inscrição', icon: Calendar, options: anosDisponiveis.map(a => ({ value: a.nome, label: a.nome })) },
    {
      key: 'status', label: 'Estado/Status', icon: Activity,
      options: [
        { value: 'INSCRITO', label: 'INSCRITO' }, { value: 'AUSENTE', label: 'AUSENTE' },
        { value: 'CLASSIFICADO', label: 'CLASSIFICADO' }, 
        { value: 'NAO_CLASSIFICADO', label: 'NAO_CLASSIFICADO' },
        { value: 'LISTA_ESPERA', label: 'LISTA DE ESPERA' },
        { value: 'MATRICULADO', label: 'MATRICULADO' }
      ]
    },
    { key: 'status_rup', label: 'Estado do Pagamento', icon: CreditCard, options: [{ value: 'PENDENTE', label: 'PENDENTE' }, { value: 'PAGO', label: 'PAGO' }, { value: 'EXPIRADO', label: 'EXPIRADO' }] },
    { key: 'curso', label: 'Curso', icon: BookOpen, options: cursosDisponiveis.map(c => ({ value: c.nome_curso, label: c.nome_curso })) }
  ], [anosDisponiveis, cursosDisponiveis]);

  return (
    <div className="page-container inscritos-page">
      <header className="page-header">
        <div className="page-header-content">
          <div>
            <h1>Gestão de Inscrições</h1>
            <p>Acompanhe, avalie e matricule os candidatos inscritos no sistema.</p>
          </div>
          <div className="page-header-actions">
            {activeTab === 'inscricoes' && hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
              <>
                <button onClick={() => setShowExamModal(true)} className="btn-primary btn-agendar">
                  <Calendar size={18} /> Agendar Exames
                </button>
                <button onClick={handleFetchCallList} className="btn-primary">
                  <Printer size={18} /> Lista de Chamada
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── TABS ─── */}
      <div className="inscritos-tabs">
        <button
          className={`inscritos-tab ${activeTab === 'inscricoes' ? 'active' : ''}`}
          onClick={() => setActiveTab('inscricoes')}
        >
          <UserPlus size={16} />
          Inscrições
          <span className="inscritos-tab-count">{inscricoesCount}</span>
        </button>
        <button
          className={`inscritos-tab ${activeTab === 'lista_espera' ? 'active' : ''}`}
          onClick={() => setActiveTab('lista_espera')}
        >
          <Clock size={16} />
          Lista de Espera
          {listaEsperaCount > 0 && (
            <span className="inscritos-tab-count waiting">{listaEsperaCount}</span>
          )}
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}
      {activeTab === 'inscricoes' && (
        <div className="table-card" ref={tableRef}>
          <div className="search-filter-header">
            <div className="search-input-container">
              <Search className="search-input-icon" size={20} />
              <input
                type="text"
                placeholder="Pesquisar por nome ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button ref={filterButtonRef} onClick={() => setShowFilters(true)} className="btn-alternar-filtros">
              <Filter size={18} /> Filtros
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

          <InscritosTable
            data={currentData} loading={isLoading}
            sortConfig={sortConfig} requestSort={requestSort}
            onOpenDetail={handleOpenDetail} onEdit={handleEditClick}
            onEvaluate={handleOpenEvaluation}
          />

          <Pagination
            totalItems={filteredInscritos.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {activeTab === 'lista_espera' && (
        <div className="table-card">
          <ListaEsperaPanel inscritosList={inscritos} onRefreshInscritos={refresh} />
        </div>
      )}

      {/* ─── MODALS ─── */}
      <EvaluationModal
        isOpen={showEvaluationModal} onClose={handleCloseEvaluation}
        candidate={candidateToEvaluate} examGrade={examGrade}
        setExamGrade={setExamGrade} onSubmit={handleSubmitEvaluation}
      />
      <ExamSchedulingModal
        isOpen={showExamModal} onClose={() => setShowExamModal(false)}
        inscritos={inscritos.filter(i => i.anoLectivoAtivo === true)}
        examConfig={examConfig} setExamConfig={setExamConfig}
        onDistribute={handleDistributeExams} isProcessing={isProcessingExams}
      />
      <CallListModal isOpen={showCallListModal} onClose={() => setShowCallListModal(false)} data={callListData} />
      <CandidateDetailModal
        candidate={selectedCandidato} onClose={closeDetail}
        rupGenerated={rupGenerated} onGenerateRUP={() => setRupGenerated(true)}
        onRefresh={refresh} onConfirmPayment={handleConfirmPayment}
      />
      <EditCandidateModal
        isOpen={showEditModal} onClose={() => setShowEditModal(false)}
        initialData={initialEditData} onSave={handleSaveEdit}
      />
    </div>
  );
};

export default Inscritos;