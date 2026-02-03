import React, { useState, useMemo, useEffect, useRef } from 'react';
import './Inscritos.css';
import {
  User,
  BookOpen,
  MapPin, // kept for potential usage or remove if unused, but removing might break if used in css/other
  Phone, // kept
  Mail, // kept
  FileText,
  CheckCircle2,
  Calendar, // kept
  ShieldAlert,
  Download,
  Printer,
  X,
  ChevronRight,
  ClipboardCheck,
  Award,
  Search,
  Filter,
  RotateCcw,
  ChevronLeft, // kept
  GraduationCap,
  Eye,

  Edit,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/Common/Pagination';
import api from '../../services/api';
import { useCache } from '../../context/CacheContext';

import { useDataCache } from '../../hooks/useDataCache';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';

const Inscritos = () => {
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const [selectedCandidato, setSelectedCandidato] = useState(null);
  const [rupGenerated, setRupGenerated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

  // Evaluation States
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [candidateToEvaluate, setCandidateToEvaluate] = useState(null);
  const [examGrade, setExamGrade] = useState('');

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
      id: '',
      real_id: '',
      // Pessoais
      nome: '',
      bi: '',
      genero: '',
      dataNascimento: '',
      nacionalidade: '',
      naturalidade: '',
      provincia: '',
      municipio: '',
      residencia: '',
      telefone: '',
      email: '',
      deficiencia: '',
      
      // Acadêmicos
      escola_proveniencia: '',
      municipio_escola: '',
      tipo_escola: '',
      ano_conclusao: '',
      media_final: '',
      
      // Encarregado
      enc_nome: '',
      enc_parentesco: '',
      enc_telefone: '',
      enc_email: '',
      enc_residencia: '',
      
      // Admin
      notaExame: '',
      status: ''
  });
  
  // Collapse State for Edit Modal
  const [expandedSection, setExpandedSection] = useState('pessoais'); // 'pessoais', 'academicos', 'encarregado', 'admin'

  const toggleSection = (section) => {
      setExpandedSection(expandedSection === section ? null : section);
  };

  // Filters State
  const [filters, setFilters] = useState({
    ano: '',
    status: '',
    curso: ''
  });

  const [showExamModal, setShowExamModal] = useState(false);
  const [examConfig, setExamConfig] = useState({
    data_inicio: new Date().toISOString().split('T')[0],
    hora_inicio: '08:00',
    candidatos_por_sala: '',
    limite_candidatos: ''
  });
  const [isProcessingExams, setIsProcessingExams] = useState(false);
  const [showCallListModal, setShowCallListModal] = useState(false);
  const [callListData, setCallListData] = useState({});

  const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
  const [anosDisponiveis, setAnosDisponiveis] = useState([]);

  // Data Fetcher & Formatter
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
          tipo_escola: c.tipo_escola || 'Pública', // NOVO
          escola9: c.tipo_escola || 'Pública',
          nomeEscola: c.escola_proveniencia || 'N/A',
          municipioEscola: c.municipio_escola || 'N/A',
          anoConclusao: c.ano_conclusao,
          anoInscricao: c.ano_lectivo_nome || (c.criado_em ? new Date(c.criado_em).getFullYear().toString() : '2026'),
          nota9: parseFloat(c.media_final) || 0,
          notaExame: c.nota_exame,
          curso1: c.curso1_nome || 'N/A',
          curso2: c.curso2_nome || 'N/A',
          turno: c.turno_preferencial || 'N/A',
          status: c.status || 'Pendente',
          dataInscricao: c.criado_em ? new Date(c.criado_em).toLocaleDateString() : 'N/A',
          encarregado: {
              nome: c.nome_encarregado || 'N/A',
              parentesco: c.parentesco_encarregado || 'N/A',
              bi: c.numero_bi_encarregado || 'N/A',
              telefone: c.telefone_encarregado || 'N/A',
              telefoneAlt: c.telefone_alternativo_encarregado || 'N/A',
              email: c.email_encarregado || 'N/A',
              profissao: c.profissao_encarregado || 'N/A',
              residencia: c.residencia_encarregado || 'N/A'
          },
          files: {
              foto: c.foto_passe,
              bi: c.comprovativo_bi,
              certificado: c.certificado
          },
          rupe: c.rupe_info
      }));
  };

  // USE DATA CACHE HOOK
  // USE DATA CACHE HOOK
  const { 
      data: cachedInscritos, 
      loading: isLoading, 
      refresh, 
      update: updateInscrito,
      error: fetchError 
  } = useDataCache('inscritos', fetchCandidatesData);

  // Ensure inscritos is ALWAYS an array to prevent "is not iterable" or "map is not a function" errors
  const inscritos = Array.isArray(cachedInscritos) ? cachedInscritos : [];

  // Log to debug the iterable error
  useEffect(() => {
      console.log('Inscritos Data:', inscritos);
      console.log('Is Array?', Array.isArray(inscritos));
      if (fetchError) console.error('Fetch Error:', fetchError);
  }, [inscritos, fetchError]);

  // NOVO: Sincronizar o modal com os dados atualizados da lista
  useEffect(() => {
      if (selectedCandidato && inscritos.length > 0) {
          const updated = inscritos.find(i => i.id === selectedCandidato.id);
          // Se encontrou e os dados são diferentes (status mudou, nota mudou, etc)
          if (updated && JSON.stringify(updated) !== JSON.stringify(selectedCandidato)) {
              setSelectedCandidato(updated);
          }
      }
  }, [inscritos, selectedCandidato]);


  const fetchFilters = async () => {
      try {
          const [cursosRes, anosRes] = await Promise.all([
              api.get('cursos/'),
              api.get('anos-lectivos/')
          ]);
          
          if (cursosRes.data.results || Array.isArray(cursosRes.data))
             setCursosDisponiveis(cursosRes.data.results || cursosRes.data);
          
          if (anosRes.data.results || Array.isArray(anosRes.data))
             setAnosDisponiveis(anosRes.data.results || anosRes.data);

      } catch (e) {
          console.error("Error fetching filter options", e);
      }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  // Polling for real-time updates (Silent Refresh)
  useEffect(() => {
    const interval = setInterval(() => {
        refresh(true); // silent = true
    }, 5000); // Increased to 5s to reduce load, given we have cache
    return () => clearInterval(interval);
  }, [refresh]);


  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    try {
        const today = new Date();
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return 0; // Handle invalid date
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
        }
        return age;
    } catch { return 0; }
  };

  const handleOpenDetail = (candidato) => {
    setShowEvaluationModal(false);
    setSelectedCandidato(candidato);
  };

  const handleOpenEvaluation = (candidato) => {
    setSelectedCandidato(null);
    setCandidateToEvaluate(candidato);
    setExamGrade(''); // Reset grade
    setShowEvaluationModal(true);
  };

  const handleCloseEvaluation = () => {
    setShowEvaluationModal(false);
    setCandidateToEvaluate(null);
    setExamGrade('');
  };

  const handleSubmitEvaluation = async () => {
    if (!examGrade || isNaN(examGrade) || examGrade < 0 || examGrade > 20) {
      alert("Por favor, insira uma nota válida (0-20).");
      return;
    }

    try {
        const grade = parseFloat(examGrade);
        const response = await api.post(`candidaturas/${candidateToEvaluate.real_id}/avaliar/`, { nota: grade });
        const { status, nota } = response.data;
        
        // Use Cache Helper to update local state and cache immediately
        updateInscrito(candidateToEvaluate.id, {
            notaExame: nota,
            status: status
        });
        
        alert(`Avaliação registrada com sucesso! Candidato ${status}.`);
    } catch (err) {
        console.error("Erro ao avaliar:", err);
        alert("Erro ao salvar avaliação.");
    }

    handleCloseEvaluation();
  };

  const handleEditClick = (candidato) => {
      setEditFormData({
          id: candidato.id,
          real_id: candidato.real_id,
          
          // Pessoais
          nome: candidato.nome,
          bi: candidato.bi,
          genero: candidato.genero === 'Masculino' ? 'M' : 'F',
          dataNascimento: candidato.dataNascimento,
          nacionalidade: candidato.nacionalidade,
          naturalidade: candidato.naturalidade,
          provincia: candidato.provincia,
          municipio: candidato.municipio,
          residencia: candidato.residencia,
          telefone: candidato.telefone,
          email: candidato.email,
          deficiencia: candidato.deficiencia,
          
          // Acadêmicos
          escola_proveniencia: candidato.nomeEscola,
          municipio_escola: candidato.municipioEscola,
          tipo_escola: candidato.tipo_escola,
          ano_conclusao: candidato.anoConclusao,
          media_final: candidato.nota9,
          
          // Encarregado
          enc_nome: candidato.encarregado?.nome || '',
          enc_parentesco: candidato.encarregado?.parentesco || '',
          enc_telefone: candidato.encarregado?.telefone || '',
          enc_email: candidato.encarregado?.email || '',
          enc_residencia: candidato.encarregado?.residencia || '',
          
          // Admin
          notaExame: candidato.notaExame || '',
          status: candidato.status
      });
      setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
      if (!editFormData.nome || !editFormData.bi) {
          alert("Nome e BI são obrigatórios.");
          return;
      }

      try {
          // Helper to handle empty numeric fields
          const toDecimal = (val) => (val && val !== '') ? parseFloat(val) : null;
          const toInt = (val) => (val && val !== '') ? parseInt(val) : null;
          
          const payload = {
              nome_completo: editFormData.nome,
              numero_bi: editFormData.bi,
              genero: editFormData.genero,
              // Only send date if valid, otherwise keep existing
              ...(editFormData.dataNascimento ? { data_nascimento: editFormData.dataNascimento } : {}),
              nacionalidade: editFormData.nacionalidade,
              naturalidade: editFormData.naturalidade,
              provincia: editFormData.provincia,
              municipio: editFormData.municipio,
              residencia: editFormData.residencia,
              telefone: editFormData.telefone,
              email: editFormData.email || null, // Allow null email
              deficiencia: editFormData.deficiencia || 'Não',
              
              escola_proveniencia: editFormData.escola_proveniencia,
              municipio_escola: editFormData.municipio_escola,
              tipo_escola: editFormData.tipo_escola,
              ano_conclusao: toInt(editFormData.ano_conclusao),
              media_final: toDecimal(editFormData.media_final),
              
              nome_encarregado: editFormData.enc_nome,
              parentesco_encarregado: editFormData.enc_parentesco,
              telefone_encarregado: editFormData.enc_telefone,
              email_encarregado: editFormData.enc_email || null,
              residencia_encarregado: editFormData.enc_residencia,

              nota_exame: toDecimal(editFormData.notaExame),
              status: editFormData.status
          };

          await api.patch(`candidaturas/${editFormData.real_id}/`, payload);
          
          // Since we changed many fields, it is safer to just trigger a full refresh than updating locally partially
          refresh(); 
          
          alert("Dados atualizados com sucesso!");
          setShowEditModal(false);
      } catch (error) {
          alert("Erro ao salvar alterações. Verifique os dados.");
      }
  };

  const handleConfirmPayment = async () => {
      if (!selectedCandidato.rupe) return;
      if (!window.confirm(`Confirmar pagamento do RUPE ${selectedCandidato.rupe.referencia}?`)) return;

      try {
          const response = await api.post(`candidaturas/${selectedCandidato.real_id}/confirmar_pagamento/`);
          alert("Pagamento confirmado com sucesso!");
          
          refresh(); // Refresh list and modal
          closeDetail(); // Close detail to force refresh or we can update local state
      } catch (error) {
          console.error("Erro ao confirmar pagamento:", error);
          alert("Erro ao confirmar pagamento.");
      }
  };

  const handleDistributeExams = async () => {
    if (!examConfig.data_inicio) {
        alert("Selecione a data de início.");
        return;
    }
    
    if (window.confirm("Isso irá distribuir todos os candidatos com status 'Pago' por salas. Continuar?")) {
        try {
            setIsProcessingExams(true);
            const res = await api.post('candidaturas/distribuir_exames/', examConfig);
            alert(res.data.mensagem);
            setShowExamModal(false);
            refresh();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.erro || "Erro ao processar distribuição.");
        } finally {
            setIsProcessingExams(false);
        }
    }
  };

  const handleFetchCallList = async () => {
    try {
        const res = await api.get('candidaturas/lista_chamada/');
        setCallListData(res.data);
        setShowCallListModal(true);
    } catch (err) {
        alert("Erro ao carregar lista de chamada.");
    }
  };

  const handleGenerateRUP = () => {
    setRupGenerated(true);
  };

  const closeDetail = () => {
    setSelectedCandidato(null);
    setRupGenerated(false);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1); 
  };

  const resetFilters = () => {
    setFilters({ ano: '', status: '', curso: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'nota9', direction: 'desc' });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtered and Paginated Data
  const filteredInscritos = useMemo(() => {
    let sortableItems = [...inscritos];
    
    // 1. Filter
    sortableItems = sortableItems.filter(i => {
      const nameMatch = (i.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const idMatch = (i.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || idMatch;
      
      const matchesAno = filters.ano === '' || i.anoInscricao === filters.ano;
      const matchesStatus = filters.status === '' || i.status === filters.status;
      const matchesCurso = filters.curso === '' || i.curso1 === filters.curso;
      return matchesSearch && matchesAno && matchesStatus && matchesCurso;
    });

    // 2. Sort
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric values safely
        if (typeof aValue === 'string' && !isNaN(aValue)) {
            // Keep strictly numeric strings as numbers for correct sorting, but careful with mixed content
            // For now, let's treat known numeric fields explicitly if needed, or rely on JS types
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [inscritos, searchTerm, filters, sortConfig]);

  // Ensure itemsPerPage is a number
  const currentData = filteredInscritos.slice((currentPage - 1) * 24, currentPage * 24);

  return (
    <div className="page-container inscritos-page">
      <header className="page-header">
        <div className="search-filter-header" style={{ border: 'none', padding: 0, background: 'transparent', marginBottom: 0 }}>
            <div>
                <h1>Gestão de Inscrições</h1>
                <p>Acompanhe, avalie e matricule os candidatos inscritos no sistema.</p>
            </div>
            <div style={{display: 'flex', gap: '12px'}}>
                {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                    <>
                        <button onClick={() => setShowExamModal(true)} className="btn-primary" style={{ background: '#4b5563' }}>
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

      <div className="table-card" ref={tableRef}>
        {/* Search and Filters Header */}
        <div className="search-filter-header">
          <div className="search-input-container">
            <Search className="search-input-icon" size={20} aria-hidden="true" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Pesquisar inscritos por nome ou ID"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-alternar-filtros"
            aria-expanded={showFilters}
            aria-label={showFilters ? "Esconder filtros" : "Mostrar filtros"}
            style={{
              background: showFilters ? '#1e3a8a' : 'white',
              color: showFilters ? 'white' : '#374151'
            }}
          >
            <Filter size={18} aria-hidden="true" />
            Filtros
          </button>
        </div>

        {/* Dynamic Filters Panel */}
        {showFilters && (
          <div className="painel-filtros">
            <div className="grade-filtros">
              <div className="grupo-filtro">
                <label htmlFor="filtro-ano-ins">Ano de Inscrição</label>
                <select id="filtro-ano-ins" name="ano" value={filters.ano} onChange={handleFilterChange} className="selecao-filtro">
                  <option value="">Todos os Anos</option>
                  {anosDisponiveis.map(ano => (
                    <option key={ano.id_ano || ano.id} value={ano.nome}>{ano.nome}</option>
                  ))}
                </select>
              </div>
              <div className="grupo-filtro">
                <label htmlFor="filtro-status-ins">Estado/Status</label>
                <select id="filtro-status-ins" name="status" value={filters.status} onChange={handleFilterChange} className="selecao-filtro">
                  <option value="">Todos os Estados</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Não Admitido">Não Admitido</option>
                  <option value="Matriculado">Matriculado</option>
                </select>
              </div>
              <div className="grupo-filtro">
                <label htmlFor="filtro-curso-ins">Curso</label>
                <select id="filtro-curso-ins" name="curso" value={filters.curso} onChange={handleFilterChange} className="selecao-filtro">
                  <option value="">Todos os Cursos</option>
                  {cursosDisponiveis.map(c => (
                     <option key={c.id_curso || c.id} value={c.nome_curso}>{c.nome_curso}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={resetFilters} className="btn-limpar-filtros">
                <RotateCcw size={16} /> Limpar Filtros
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px', color: '#64748b'}}>
                <div className="loading-spinner" style={{width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spinner 0.8s linear infinite'}}></div>
                <span style={{fontWeight: 500}}>A carregar inscritos...</span>
            </div>
        ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th 
                        className={`sticky-col-1 sortable-header ${sortConfig.key === 'id' ? 'active-sort' : ''}`} 
                        onClick={() => requestSort('id')}
                        style={{ width: '60px' }}
                    >
                        ID 
                        <span className="sort-icon">
                            {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                        </span>
                    </th>
                    <th
                    
                        className={`sticky-col-2 sortable-header ${sortConfig.key === 'nome' ? 'active-sort' : ''}`} 
                        onClick={() => requestSort('nome')}
                    >
                        Candidato
                         <span className="sort-icon">
                            {sortConfig.key === 'nome' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                        </span>
                    </th>
                    <th 
                        className={`sortable-header ${sortConfig.key === 'curso1' ? 'active-sort' : ''}`} 
                        onClick={() => requestSort('curso1')}
                    >
                        Curso
                         <span className="sort-icon">
                            {sortConfig.key === 'curso1' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                        </span>
                    </th>
                    <th 
                        className={`sortable-header ${sortConfig.key === 'notaExame' ? 'active-sort' : ''}`} 
                        onClick={() => requestSort('notaExame')}
                    >
                        Exame
                         <span className="sort-icon">
                            {sortConfig.key === 'notaExame' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                        </span>
                    </th>
                    <th 
                        className={`sortable-header ${sortConfig.key === 'anoInscricao' ? 'active-sort' : ''}`} 
                        onClick={() => requestSort('anoInscricao')}
                    >
                        Ano
                         <span className="sort-icon">
                            {sortConfig.key === 'anoInscricao' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                        </span>
                    </th>
                    <th 
                        className={`sortable-header ${sortConfig.key === 'status' ? 'active-sort' : ''}`} 
                        onClick={() => requestSort('status')}
                    >
                        Estado
                         <span className="sort-icon">
                            {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                        </span>
                    </th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? currentData.map((i) => (
                    <tr key={i.id} className="clickable-row animate-fade-in">
                      <td className="sticky-col-1">{i.id}</td>
                      <td className="sticky-col-2" style={{ fontWeight: 600 }}>{i.nome}</td>
                      <td>{i.curso1}</td>
                      <td>
                        {i.notaExame ? (
                          <span style={{ fontWeight: 800, color: i.notaExame >= 10 ? '#166534' : '#dc2626' }}>
                            {i.notaExame}
                          </span>
                        ) : '-'}
                      </td>
                      <td>{i.anoInscricao}</td>
                      <td>
                        <span className={`status-badge ${i.status === 'Pendente' ? 'status-pending' :
                          i.status === 'Em Análise' ? 'status-analysis' :
                            i.status === 'Aprovado' ? 'status-approved' : 
                            i.status === 'Matriculado' ? 'status-confirmed' : 'status-rejected'
                          }`}>
                          {i.status}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn-icon btn-view"
                            onClick={() => handleOpenDetail(i)}
                            title="Ver Detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                            <button
                                className="btn-icon btn-edit"
                                onClick={(e) => { e.stopPropagation(); handleEditClick(i); }}
                                title="Editar Candidato"
                            >
                                <Edit size={16} />
                            </button>
                          )}

                          {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                            <button
                                className="btn-icon btn-evaluate"
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (i.notaExame === null || i.notaExame === undefined || i.notaExame === '') {
                                        handleOpenEvaluation(i); 
                                    }
                                }}
                                disabled={i.notaExame !== null && i.notaExame !== undefined && i.notaExame !== ''}
                                title={ (i.notaExame !== null && i.notaExame !== undefined && i.notaExame !== '') ? "Candidato já avaliado" : "Avaliar Candidato"}
                                style={{
                                    opacity: (i.notaExame !== null && i.notaExame !== undefined && i.notaExame !== '') ? 0.3 : 1,
                                    cursor: (i.notaExame !== null && i.notaExame !== undefined && i.notaExame !== '') ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <ClipboardCheck size={16} />
                            </button>
                          )}

                          {hasPermission(PERMISSIONS.CREATE_MATRICULA) && (
                            <button
                                className={`btn-icon btn-enroll ${i.status === 'Aprovado' ? 'can-enroll' : ''}`}
                                disabled={i.status !== 'Aprovado' || i.status === 'Matriculado'}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    navigate('/matriculas/nova', { state: { candidato: i } });
                                }}
                                title={
                                    i.status === 'Matriculado' ? "Candidato já matriculado" :
                                    i.status === 'Aprovado' ? "Matricular Candidato" : 
                                    "Matrícula indisponível (Candidato não aprovado)"
                                }
                            >
                                <GraduationCap size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Nenhum candidato encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        )}

        {/* Pagination */}
        <Pagination 
            totalItems={filteredInscritos.length} 
            itemsPerPage={24} 
            currentPage={currentPage}
            onPageChange={setCurrentPage}
        />
      </div>

      {/* EVALUATION MODAL */}
      {showEvaluationModal && candidateToEvaluate && (
        <div className="modal-overlay" onClick={handleCloseEvaluation}>
          <div className="evaluation-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="evaluation-header">
              <h3>
                <GraduationCap size={20} color="#1e3a8a" /> Avaliação
              </h3>
              <button onClick={handleCloseEvaluation} className="btn-close-modal" style={{ position: 'static' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div className="evaluation-body">
              <p className="evaluation-info-text">
                Atribuir nota do exame para: <strong>{candidateToEvaluate.nome}</strong>
              </p>

              <div className="evaluation-input-group">
                <label className="evaluation-label">NOTA DO EXAME (0 - 20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={examGrade}
                  onChange={(e) => setExamGrade(e.target.value)}
                  placeholder="0"
                  className="evaluation-input"
                  autoFocus
                />
              </div>

              <p className="evaluation-hint">
                Nota igual ou superior a 10 aprova o candidato.
              </p>
            </div>

            <div className="evaluation-actions">
              <button
                onClick={handleCloseEvaluation}
                className="btn-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitEvaluation}
                className="btn-confirm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXAM SCHEDULING MODAL */}
      {showExamModal && (
        <div className="modal-overlay" onClick={() => setShowExamModal(false)}>
          <div className="evaluation-modal-card" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column'}}>
            <div className="evaluation-header">
              <h3>
                <Calendar size={20} color="#1e3a8a" /> Agendamento Automático
              </h3>
              <button onClick={() => setShowExamModal(false)} className="btn-close-modal" style={{ position: 'static' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div className="evaluation-body" style={{padding: '24px', overflowY: 'auto'}}>
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
                padding: '24px', 
                borderRadius: '20px', 
                marginBottom: '24px', 
                border: '1px solid #bfdbfe', 
                textAlign: 'center',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <p style={{fontSize: '12px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0'}}>
                   Total de Candidatos Aguardando Vaga
                </p>
                <div style={{fontSize: '36px', fontWeight: '900', color: '#1e3a8a', lineHeight: '1'}}>
                    {inscritos.filter(i => i.status === 'Pago').length.toLocaleString()}
                </div>
                <p style={{fontSize: '13px', color: '#60a5fa', marginTop: '8px', fontWeight: '500'}}>
                    Candidatos com inscrição paga e sem sala atribuída
                </p>
              </div>

              <div style={{background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0', textAlign: 'left'}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <label className="evaluation-label" style={{textAlign: 'left', marginBottom: 0, color: '#475569'}}>DEFINIR TAMANHO DESTE LOTE (OPCIONAL)</label>
                    <input 
                        type="number" 
                        placeholder="Ex: 50 (Vazio agendará todos)"
                        value={examConfig.limite_candidatos}
                        onChange={(e) => setExamConfig({...examConfig, limite_candidatos: e.target.value})}
                        className="evaluation-input" 
                        style={{width: '100%', fontSize: '18px', padding: '14px', height: 'auto', border: '2px solid #cbd5e1'}}
                    />
                </div>
              </div>

              <div className="evaluation-input-group" style={{marginBottom: '20px'}}>
                <label className="evaluation-label">DATA DE INÍCIO DOS EXAMES</label>
                <input
                  type="date"
                  value={examConfig.data_inicio}
                  onChange={(e) => setExamConfig({...examConfig, data_inicio: e.target.value})}
                  className="evaluation-input"
                  style={{width: '100%', fontSize: '16px', padding: '12px', height: 'auto'}}
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
                  <div className="evaluation-input-group">
                    <label className="evaluation-label">HORA DE INÍCIO</label>
                    <input
                      type="time"
                      value={examConfig.hora_inicio}
                      onChange={(e) => setExamConfig({...examConfig, hora_inicio: e.target.value})}
                      className="evaluation-input"
                      style={{width: '100%', fontSize: '16px', padding: '12px', height: 'auto'}}
                    />
                  </div>
                  <div className="evaluation-input-group">
                    <label className="evaluation-label">POR SALA (OPCIONAL)</label>
                    <input
                      type="number"
                      placeholder="Capacidade"
                      value={examConfig.candidatos_por_sala}
                      onChange={(e) => setExamConfig({...examConfig, candidatos_por_sala: e.target.value})}
                      className="evaluation-input"
                      style={{width: '100%', fontSize: '16px', padding: '12px', height: 'auto'}}
                    />
                  </div>
              </div>

              <div style={{background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #dbeafe'}}>
                <p style={{fontSize: '12px', color: '#1e40af', margin: 0, textAlign: 'left', lineHeight: '1.5'}}>
                    <strong>ℹ️ Janelas de Horário Configuradas:</strong><br/>
                    Manhã: 08:00 - 12:00 | Tarde: 13:00 - 16:00.<br/>
                    O sistema saltará automaticamente o intervalo de almoço e passará para o dia seguinte após as 16h.
                </p>
              </div>
            </div>

            <div className="evaluation-actions">
              <button onClick={() => setShowExamModal(false)} className="btn-cancel" disabled={isProcessingExams}>
                Cancelar
              </button>
              <button onClick={handleDistributeExams} className="btn-confirm" disabled={isProcessingExams}>
                {isProcessingExams ? 'Processando...' : 'Distribuir Candidatos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALL LIST MODAL */}
      {showCallListModal && (
        <div className="modal-overlay" onClick={() => setShowCallListModal(false)}>
          <div className="detail-modal-card" onClick={(e) => e.stopPropagation()} style={{maxWidth: '1000px'}}>
            <div className="evaluation-header" style={{background: '#1e293b'}}>
              <h3>
                <Printer size={20} color="white" /> Listas de Chamada por Sala
              </h3>
              <div style={{display: 'flex', gap: '12px'}}>
                  <button onClick={() => window.print()} className="btn-confirm" style={{background: '#22c55e'}}>
                    Imprimir Todas
                  </button>
                  <button onClick={() => setShowCallListModal(false)} className="btn-close-modal" style={{ position: 'static', color: 'white' }}>
                    <X size={20} />
                  </button>
              </div>
            </div>

            <div className="modal-body" style={{padding: '32px'}}>
              {Object.keys(callListData).length === 0 ? (
                  <p style={{textAlign: 'center', color: '#64748b'}}>Nenhum exame agendado para exibir.</p>
              ) : (
                  Object.entries(callListData).map(([data, salas]) => (
                    <div key={data} className="print-section">
                        <h2 style={{borderBottom: '2px solid #1e293b', paddingBottom: '8px', marginBottom: '24px', color: '#1e293b'}}>
                            📅 Exames em: {data}
                        </h2>
                        
                        {Object.entries(salas).map(([sala, alunos]) => (
                            <div key={sala} className="page-break" style={{marginBottom: '40px', background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                                    <h3 style={{margin: 0, color: '#2563eb'}}>{sala}</h3>
                                    <span style={{fontWeight: 'bold', color: '#64748b'}}>Total: {alunos.length} Alunos</span>
                                </div>
                                <table className="data-table" style={{maxHeight: 'none'}}>
                                    <thead>
                                        <tr>
                                            <th>Nº INSCRIÇÃO</th>
                                            <th>NOME COMPLETO</th>
                                            <th>BI</th>
                                            <th>CURSO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alunos.map(al => (
                                            <tr key={al.numero_inscricao}>
                                                <td>{al.numero_inscricao}</td>
                                                <td>{al.nome}</td>
                                                <td>{al.bi}</td>
                                                <td>{al.curso}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedCandidato && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="detail-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={closeDetail}>
              <X size={24} color="#64748b" />
            </button>

            <div className="detail-modal-grid">
                {/* SIDEBAR: Profile & Status */}
                <div className="profile-sidebar">
                     <div className="profile-avatar-large" onClick={() => {
                        if (selectedCandidato.files?.foto) {
                             const win = window.open("", "_blank");
                             win.document.write(`<img src="${selectedCandidato.files.foto}" style="max-width:100%; height:auto;">`);
                             win.focus();
                        }
                     }} title="Clique para ampliar" style={{cursor: selectedCandidato.files?.foto ? 'zoom-in' : 'default'}}>
                        {selectedCandidato.files?.foto ? (
                             <img src={selectedCandidato.files.foto} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        ) : (
                             <User size={48} />
                        )}
                     </div>
                     <h2 className="profile-name">{selectedCandidato.nome}</h2>
                     <p className="profile-id">INSCRIÇÃO: {selectedCandidato.id}</p>
                     
                     <div className="profile-status" style={{
                         backgroundColor: 
                            selectedCandidato.status === 'Aprovado' ? '#dcfce7' : 
                            selectedCandidato.status === 'Pendente' ? '#fef9c3' : '#f1f5f9',
                         color:
                            selectedCandidato.status === 'Aprovado' ? '#166534' : 
                            selectedCandidato.status === 'Pendente' ? '#854d0e' : '#475569',
                         border: 'none'
                     }}>
                         {selectedCandidato.status}
                     </div>

                     <div className="profile-footer">
                        <div className="profile-footer-item">
                            <Calendar size={16} />
                            <span>Inscrito em: {selectedCandidato.dataInscricao}</span>
                        </div>
                        <div className="profile-footer-item">
                            <Award size={16} />
                            <span>Média 9ª: {selectedCandidato.nota9}</span>
                        </div>
                        {selectedCandidato.notaExame && (
                            <div className="profile-footer-item">
                                <FileText size={16} />
                                <span>Exame: <strong>{selectedCandidato.notaExame}</strong> Val.</span>
                            </div>
                        )}
                     </div>
                </div>

                {/* CONTENT: Details & Actions */}
                <div className="content-area">
                    
                    {/* 1. Dados Pessoais */}
                    <div className="info-section">
                        <div className="section-title"><User size={18} /> Dados Pessoais</div>
                        <div className="info-grid-2">
                             <div><p className="info-label">Nome Completo</p><p className="info-value">{selectedCandidato.nome}</p></div>
                             <div><p className="info-label">Género</p><p className="info-value">{selectedCandidato.genero}</p></div>
                             <div><p className="info-label">Nascimento</p><p className="info-value">{selectedCandidato.dataNascimento} ({calculateAge(selectedCandidato.dataNascimento)} anos)</p></div>
                             <div><p className="info-label">Nacionalidade</p><p className="info-value">{selectedCandidato.nacionalidade}</p></div>
                             <div><p className="info-label">Naturalidade (Local de Nascimento)</p><p className="info-value">{selectedCandidato.naturalidade}</p></div>
                             <div><p className="info-label">BI / Passaporte</p><p className="info-value">{selectedCandidato.bi}</p></div>
                             <div><p className="info-label">Telefone</p><p className="info-value">{selectedCandidato.telefone}</p></div>
                             <div><p className="info-label">Email</p><p className="info-value">{selectedCandidato.email || 'N/A'}</p></div>
                             <div><p className="info-label">Província</p><p className="info-value">{selectedCandidato.provincia || 'N/A'}</p></div>
                             <div><p className="info-label">Município</p><p className="info-value">{selectedCandidato.municipio || 'N/A'}</p></div>
                             <div><p className="info-label">Residência (Bairro)</p><p className="info-value">{selectedCandidato.residencia}</p></div>
                        </div>
                    </div>

                    {/* 2. Académico & Curso */}
                    <div className="info-section">
                        <div className="section-title"><GraduationCap size={18} /> Dados Académicos & Curso</div>
                         <div className="info-grid-2">
                             <div><p className="info-label">Escola de Origem</p><p className="info-value">{selectedCandidato.nomeEscola}</p></div>
                             <div><p className="info-label">Município da Escola</p><p className="info-value">{selectedCandidato.municipioEscola}</p></div>
                             <div><p className="info-label">Ano Conclusão</p><p className="info-value">{selectedCandidato.anoConclusao}</p></div>
                             
                             <div style={{gridColumn: 'span 2', background: 'var(--primary-light-bg)', padding: '16px', borderRadius: '12px', marginTop: '10px'}}>
                                 <p className="info-label" style={{color: 'var(--primary-color)'}}>OPÇÃO DE CURSO SELECIONADA</p>
                                 <p className="info-value" style={{fontSize: '18px', fontWeight: 700}}>{selectedCandidato.curso1}</p>
                                 {selectedCandidato.curso2 && <p style={{fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px'}}>2ª Opção: {selectedCandidato.curso2}</p>}

                             </div>
                        </div>
                    </div>

                    {/* 3. Encarregado */}
                    <div className="info-section">
                        <div className="section-title"><ShieldAlert size={18} /> Encarregado de Educação</div>
                        {selectedCandidato.encarregado && selectedCandidato.encarregado.nome !== 'N/A' ? (
                            <div className="info-grid-2">
                                <div><p className="info-label">Nome</p><p className="info-value">{selectedCandidato.encarregado.nome}</p></div>
                                <div><p className="info-label">Parentesco</p><p className="info-value">{selectedCandidato.encarregado.parentesco}</p></div>
                                <div><p className="info-label">Telefone</p><p className="info-value">{selectedCandidato.encarregado.telefone}</p></div>
                                <div><p className="info-label">Residência</p><p className="info-value">{selectedCandidato.encarregado.residencia}</p></div>
                            </div>
                        ) : (
                            <p style={{color: '#94a3b8', fontStyle: 'italic'}}>Nenhum encarregado associado (Candidato Maior de Idade ou não informado).</p>
                        )}
                    </div>

                    {/* 4. Documentos */}
                    <div className="info-section">
                        <div className="section-title"><FileText size={18} /> Documentos Anexados</div>
                        <div className="doc-grid">
                            <div className="doc-card">
                                 <FileText size={24} color={selectedCandidato.files?.bi ? '#2563eb' : '#cbd5e1'} />
                                 <div style={{flex: 1}}>
                                     <p className="info-label">BILHETE IDENTIDADE</p>
                                     <p className="info-value" style={{fontSize: '13px'}}>{selectedCandidato.files?.bi ? 'Disponível' : 'Pendente'}</p>
                                 </div>
                                 {selectedCandidato.files?.bi && (
                                     <a href={selectedCandidato.files.bi} target="_blank" rel="noreferrer"><Download size={18} color="#475569"/></a>
                                 )}
                            </div>
                            <div className="doc-card">
                                 <User size={24} color={selectedCandidato.files?.foto ? '#2563eb' : '#cbd5e1'} />
                                 <div style={{flex: 1}}>
                                     <p className="info-label">FOTO PASSE</p>
                                     <p className="info-value" style={{fontSize: '13px'}}>{selectedCandidato.files?.foto ? 'Disponível' : 'Pendente'}</p>
                                 </div>
                                  {selectedCandidato.files?.foto && (
                                     <a href={selectedCandidato.files.foto} target="_blank" rel="noreferrer"><Download size={18} color="#475569"/></a>
                                 )}
                            </div>
                             <div className="doc-card">
                                 <ClipboardCheck size={24} color={selectedCandidato.files?.certificado ? '#2563eb' : '#cbd5e1'} />
                                 <div style={{flex: 1}}>
                                     <p className="info-label">CERTIFICADO</p>
                                     <p className="info-value" style={{fontSize: '13px'}}>{selectedCandidato.files?.certificado ? 'Disponível' : 'Pendente'}</p>
                                 </div>
                                  {selectedCandidato.files?.certificado && (
                                     <a href={selectedCandidato.files.certificado} target="_blank" rel="noreferrer"><Download size={18} color="#475569"/></a>
                                 )}
                            </div>
                        </div>
                    </div>

                    {/* 5. Ações Finais (RUP) */}
                     <div className="info-section">
                        <div className="section-title"><CheckCircle2 size={18} /> Validação e Pagamento</div>
                         
                         {selectedCandidato.rupe ? (
                            <div className="rup-container">
                              <div className="rup-header">
                                  {selectedCandidato.rupe.status === 'Pago' ? 'Pago com Sucesso! ✅' : 'Aguardando Pagamento ⏳'}
                              </div>
                              <div className="rup-details">
                                <div className="rup-detail-item">
                                  <label>REFERÊNCIA</label>
                                  <span>{selectedCandidato.rupe.referencia}</span>
                                </div>
                                <div className="rup-detail-item">
                                  <label>VALOR</label>
                                  <span>{parseFloat(selectedCandidato.rupe.valor).toLocaleString('pt-AO', {style: 'currency', currency: 'AOA'})}</span>
                                </div>
                                <div className="rup-detail-item">
                                  <label>ESTADO</label>
                                  <span style={{color: selectedCandidato.rupe.status === 'Pago' ? '#166534' : '#ca8a04'}}>{selectedCandidato.rupe.status}</span>
                                </div>
                              </div>
                              
                              <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                  <button className="btn-print" onClick={() => window.print()}>
                                    <Printer size={18} /> Imprimir Ficha
                                  </button>
                                  
                                  {/* Admin Button to Confirm Payment */}
                                  {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && selectedCandidato.rupe.status !== 'Pago' && (
                                      <button className="btn-finish" onClick={handleConfirmPayment} style={{width: 'auto', background: '#059669'}}>
                                        <CheckCircle2 size={18} style={{marginRight: '8px'}}/> Confirmar Pagamento
                                      </button>
                                  )}
                              </div>
                            </div>
                         ) : (
                            !rupGenerated ? (
                                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                                  <p style={{marginBottom: '16px', color: '#475569'}}>Este candidato ainda não tem Referência de Pagamento.</p>
                                  <button className="btn-finish" onClick={handleGenerateRUP} style={{maxWidth: '400px', margin: '0 auto'}}>
                                    <CheckCircle2 size={18} style={{marginRight: '8px'}}/> Validar Inscrição e Gerar RUP
                                  </button>
                                </div>
                              ) : (
                                <div className="rup-container">
                                    {/* Fallback local simulation if needed, but fetchRefresh mostly covers it */}
                                  <div className="rup-header">Inscrição Validada - RUP Gerado! ✅</div>
                                  <button onClick={refresh} className="btn-secondary">Atualizar Status</button>
                                </div>
                              )
                         )}
                     </div>

                </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL EXPANDED & COLLAPSIBLE */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="evaluation-modal-card" onClick={(e) => e.stopPropagation()} style={{maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column'}}>
             <div className="evaluation-header">
               <h3>
                 <Edit size={20} color="#1e3a8a" /> Editar Ficha de Inscrição
               </h3>
               <button onClick={() => setShowEditModal(false)} className="btn-close-modal" style={{ position: 'static' }}>
                 <X size={20} color="#64748b" />
               </button>
             </div>

             <div className="evaluation-body" style={{overflowY: 'auto', padding: '20px', flex: 1}}>
                
                {/* SECTION 1: PESSOAL */}
                <div className="form-collapse-section">
                    <button 
                        className={`collapse-header ${expandedSection === 'pessoais' ? 'active' : ''}`}
                        onClick={() => toggleSection('pessoais')}
                    >
                        <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <User size={18} /> Dados Pessoais
                        </span>
                        {expandedSection === 'pessoais' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                    </button>
                    
                    {expandedSection === 'pessoais' && (
                        <div className="collapse-content animate-fade-in">
                            <div className="form-grid-2">
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Nome Completo</label>
                                   <input type="text" value={editFormData.nome} onChange={(e) => setEditFormData({...editFormData, nome: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Nº Bilhete</label>
                                   <input type="text" value={editFormData.bi} onChange={(e) => setEditFormData({...editFormData, bi: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Data Nascimento</label>
                                   <input type="date" value={editFormData.dataNascimento} onChange={(e) => setEditFormData({...editFormData, dataNascimento: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Género</label>
                                   <select value={editFormData.genero} onChange={(e) => setEditFormData({...editFormData, genero: e.target.value})} className="evaluation-input-small">
                                      <option value="M">Masculino</option>
                                      <option value="F">Feminino</option>
                                   </select>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Nacionalidade</label>
                                   <input type="text" value={editFormData.nacionalidade} onChange={(e) => setEditFormData({...editFormData, nacionalidade: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Naturalidade</label>
                                   <input type="text" value={editFormData.naturalidade} onChange={(e) => setEditFormData({...editFormData, naturalidade: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Telefone</label>
                                   <input type="text" value={editFormData.telefone} onChange={(e) => setEditFormData({...editFormData, telefone: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Email</label>
                                   <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Deficiência?</label>
                                   <input type="text" value={editFormData.deficiencia} onChange={(e) => setEditFormData({...editFormData, deficiencia: e.target.value})} className="evaluation-input-small" placeholder="Não ou descreva"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Província de Residência</label>
                                    <input type="text" value={editFormData.provincia} onChange={(e) => setEditFormData({...editFormData, provincia: e.target.value})} className="evaluation-input-small"/>
                                 </div>
                                 <div className="evaluation-input-group">
                                    <label className="evaluation-label">Município de Residência</label>
                                    <input type="text" value={editFormData.municipio} onChange={(e) => setEditFormData({...editFormData, municipio: e.target.value})} className="evaluation-input-small"/>
                                 </div>
                                 <div className="evaluation-input-group">
                                    <label className="evaluation-label">Residência (Bairro/Rua)</label>
                                   <input type="text" value={editFormData.residencia} onChange={(e) => setEditFormData({...editFormData, residencia: e.target.value})} className="evaluation-input-small"/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION 2: ACADÉMICO */}
                <div className="form-collapse-section">
                    <button 
                        className={`collapse-header ${expandedSection === 'academicos' ? 'active' : ''}`}
                        onClick={() => toggleSection('academicos')}
                    >
                        <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <GraduationCap size={18} /> Dados Académicos
                        </span>
                        {expandedSection === 'academicos' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                    </button>
                    
                    {expandedSection === 'academicos' && (
                        <div className="collapse-content animate-fade-in">
                            <div className="form-grid-2">
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Escola Proveniência</label>
                                   <input type="text" value={editFormData.escola_proveniencia} onChange={(e) => setEditFormData({...editFormData, escola_proveniencia: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Município Escola</label>
                                   <input type="text" value={editFormData.municipio_escola} onChange={(e) => setEditFormData({...editFormData, municipio_escola: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Tipo de Escola</label>
                                   <select value={editFormData.tipo_escola} onChange={(e) => setEditFormData({...editFormData, tipo_escola: e.target.value})} className="evaluation-input-small">
                                      <option value="Pública">Pública</option>
                                      <option value="Privada">Privada</option>
                                   </select>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Ano Conclusão</label>
                                   <input type="number" value={editFormData.ano_conclusao} onChange={(e) => setEditFormData({...editFormData, ano_conclusao: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Média Final (9ª)</label>
                                   <input type="number" step="0.1" value={editFormData.media_final} onChange={(e) => setEditFormData({...editFormData, media_final: e.target.value})} className="evaluation-input-small"/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION 3: ENCARREGADO */}
                <div className="form-collapse-section">
                    <button 
                        className={`collapse-header ${expandedSection === 'encarregado' ? 'active' : ''}`}
                        onClick={() => toggleSection('encarregado')}
                    >
                        <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <ShieldAlert size={18} /> Encarregado de Educação
                        </span>
                        {expandedSection === 'encarregado' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                    </button>
                    
                    {expandedSection === 'encarregado' && (
                        <div className="collapse-content animate-fade-in">
                            <div className="form-grid-2">
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Nome Encarregado</label>
                                   <input type="text" value={editFormData.enc_nome} onChange={(e) => setEditFormData({...editFormData, enc_nome: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Parentesco</label>
                                   <input type="text" value={editFormData.enc_parentesco} onChange={(e) => setEditFormData({...editFormData, enc_parentesco: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Telefone Enc.</label>
                                   <input type="text" value={editFormData.enc_telefone} onChange={(e) => setEditFormData({...editFormData, enc_telefone: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Email Enc.</label>
                                   <input type="email" value={editFormData.enc_email} onChange={(e) => setEditFormData({...editFormData, enc_email: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Residência Enc.</label>
                                   <input type="text" value={editFormData.enc_residencia} onChange={(e) => setEditFormData({...editFormData, enc_residencia: e.target.value})} className="evaluation-input-small"/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                 {/* SECTION 4: ADMIN / STATUS */}
                <div className="form-collapse-section">
                    <button 
                        className={`collapse-header ${expandedSection === 'admin' ? 'active' : ''}`}
                        onClick={() => toggleSection('admin')}
                    >
                        <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                             <CheckCircle2 size={18} /> Situação da Candidatura
                        </span>
                        {expandedSection === 'admin' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                    </button>
                    
                    {expandedSection === 'admin' && (
                        <div className="collapse-content animate-fade-in">
                             <div className="form-grid-2">
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Nota Exame (0-20)</label>
                                   <input type="number" value={editFormData.notaExame} onChange={(e) => setEditFormData({...editFormData, notaExame: e.target.value})} className="evaluation-input-small"/>
                                </div>
                                <div className="evaluation-input-group">
                                   <label className="evaluation-label">Estado da Candidatura</label>
                                   <select 
                                      value={editFormData.status}
                                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                                      className="evaluation-input-small"
                                   >
                                      <option value="Pendente">Pendente</option>
                                      <option value="Em Análise">Em Análise</option>
                                      <option value="Pago">Pago (Aguardando Exame)</option>
                                      <option value="Aprovado">Aprovado</option>
                                      <option value="Não Admitido">Não Admitido</option>
                                      <option value="Matriculado">Matriculado</option>
                                   </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

             </div>

             <div className="evaluation-actions" style={{padding: '20px', borderTop: '1px solid #e2e8f0', background: 'white'}}>
               <button onClick={() => setShowEditModal(false)} className="btn-cancel">
                 Cancelar
               </button>
               <button onClick={handleSaveEdit} className="btn-confirm">
                 Salvar Alterações
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inscritos;