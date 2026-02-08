import React, { useState, useMemo, useEffect, useRef } from 'react';
import './Inscritos.css';
import {
  Calendar,
  Printer,
  Search,
  Filter,
  RotateCcw,
  BookOpen,
  Activity
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/Common/Pagination';
import api from '../../services/api';
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
  const [initialEditData, setInitialEditData] = useState(null);
  
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
  const [callListData, setCallListData] = useState([]);
  const filterButtonRef = useRef(null);
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
          tipo_escola: c.tipo_escola || 'Pública',
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
  const { 
      data: cachedInscritos, 
      loading: isLoading, 
      refresh, 
      update: updateInscrito,
      error: fetchError 
  } = useDataCache('inscritos', fetchCandidatesData);

  const inscritos = Array.isArray(cachedInscritos) ? cachedInscritos : [];

  useEffect(() => {
      // console.log('Inscritos Data:', inscritos);
      if (fetchError) console.error('Fetch Error:', fetchError);
  }, [inscritos, fetchError]);

  // Sync selected candidate with updated list data
  useEffect(() => {
      if (selectedCandidato && inscritos.length > 0) {
          const updated = inscritos.find(i => i.id === selectedCandidato.id);
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

  // Polling (Silent Refresh)
  useEffect(() => {
    const interval = setInterval(() => {
        refresh(true); 
    }, 60000); 
    return () => clearInterval(interval);
  }, [refresh]);

  const handleOpenDetail = (candidato) => {
    setShowEvaluationModal(false);
    setSelectedCandidato(candidato);
  };

  const handleOpenEvaluation = (candidato) => {
    setSelectedCandidato(null);
    setCandidateToEvaluate(candidato);
    setExamGrade(''); 
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
      setInitialEditData({
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
          ano_conclusao: candidato.ano_conclusao,
          media_final: candidato.nota9,
          
          // Encarregado
          enc_nome: candidato.encarregado?.nome || '',
          enc_parentesco: candidato.encarregado?.parentesco || '',
          enc_telefone: candidato.encarregado?.telefone || '',
          enc_email: candidato.encarregado?.email || '',
          enc_residencia: candidato.encarregado?.residencia || '',
          
          // Admin
          notaExame: candidato.notaExame || '',
          status: candidato.status,
          foto: candidato.files?.foto,
          // Extra props used by modal logic but not part of 'candidato' directly
          foto_preview: null,
          foto_file: null
      });
      setShowEditModal(true);
  };

  const handleSaveEdit = async (data) => {
      if (!data.nome || !data.bi) {
          alert("Nome e BI são obrigatórios.");
          return;
      }

      try {
          const toDecimal = (val) => (val && val !== '') ? parseFloat(val) : null;
          const toInt = (val) => (val && val !== '') ? parseInt(val) : null;
          
          const formData = new FormData();
          
          formData.append('nome_completo', data.nome);
          formData.append('numero_bi', data.bi);
          formData.append('genero', data.genero);
          if (data.dataNascimento) formData.append('data_nascimento', data.dataNascimento);
          formData.append('nacionalidade', data.nacionalidade);
          formData.append('naturalidade', data.naturalidade);
          formData.append('provincia', data.provincia);
          formData.append('municipio', data.municipio);
          formData.append('residencia', data.residencia);
          formData.append('telefone', data.telefone);
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

          if (data.foto_file) {
              formData.append('foto_passe', data.foto_file);
          }

          await api.patch(`candidaturas/${data.real_id}/`, formData, {
              headers: {
                  'Content-Type': 'multipart/form-data',
              },
          });
          
          refresh(); 
          
          alert("Dados atualizados com sucesso!");
          setShowEditModal(false);
      } catch (error) {
          alert("Erro ao salvar alterações. Verifique os dados.");
          console.error(error);
      }
  };

  const handleConfirmPayment = async (candidato) => {
      if (!candidato.rupe) return;
      if (!window.confirm(`Confirmar pagamento do RUPE ${candidato.rupe.referencia}?`)) return;

      try {
          await api.post(`candidaturas/${candidato.real_id}/confirmar_pagamento/`);
          alert("Pagamento confirmado com sucesso!");
          
          refresh(); 
          closeDetail(); 
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
    // Logic to actually generate RUP is handled locally in UI as 'validated' state or needs API call?
    // Original code just setRupGenerated(true) to show "Inscrição Validada" and "Atualizar Status".
    // It seems to be a simulation or waiting for backend?
    // Based on original: yes, just sets state.
  };

  const closeDetail = () => {
    setSelectedCandidato(null);
    setRupGenerated(false);
  };

  // UPDATED: Handle Filter Change for Modal
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1); 
  };

  const resetFilters = () => {
    setFilters({ ano: '', status: '', curso: '' });
    setSearchTerm('');
    setCurrentPage(1);
    setShowFilters(false);
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

  const currentData = filteredInscritos.slice((currentPage - 1) * 24, currentPage * 24);

  // Filter Configuration for Modal
  const filterConfigs = useMemo(() => [
    {
      key: 'ano',
      label: 'Ano de Inscrição',
      icon: Calendar,
      options: anosDisponiveis.map(a => ({ value: a.nome, label: a.nome }))
    },
    {
      key: 'status',
      label: 'Estado/Status',
      icon: Activity,
      options: [
        { value: 'Pendente', label: 'Pendente' },
        { value: 'Em Análise', label: 'Em Análise' },
        { value: 'Aprovado', label: 'Aprovado' },
        { value: 'Não Admitido', label: 'Não Admitido' },
        { value: 'Matriculado', label: 'Matriculado' }
      ]
    },
    {
      key: 'curso',
      label: 'Curso',
      icon: BookOpen,
      options: cursosDisponiveis.map(c => ({ value: c.nome_curso, label: c.nome_curso }))
    }
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
                {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
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
            ref={filterButtonRef}
            onClick={() => setShowFilters(true)}
            className="btn-alternar-filtros"
            aria-label="Abrir filtros"
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

        {/* TABLE COMPONENT */}
        <InscritosTable 
            data={currentData}
            loading={isLoading}
            sortConfig={sortConfig}
            requestSort={requestSort}
            onOpenDetail={handleOpenDetail}
            onEdit={handleEditClick}
            onEvaluate={handleOpenEvaluation}
        />

        {/* Pagination */}
        <Pagination 
            totalItems={filteredInscritos.length} 
            itemsPerPage={24} 
            currentPage={currentPage}
            onPageChange={setCurrentPage}
        />
      </div>

      {/* MODALS */}
      <EvaluationModal 
          isOpen={showEvaluationModal}
          onClose={handleCloseEvaluation}
          candidate={candidateToEvaluate}
          examGrade={examGrade}
          setExamGrade={setExamGrade}
          onSubmit={handleSubmitEvaluation}
      />

      <ExamSchedulingModal 
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          inscritos={inscritos}
          examConfig={examConfig}
          setExamConfig={setExamConfig}
          onDistribute={handleDistributeExams}
          isProcessing={isProcessingExams}
      />

      <CallListModal 
          isOpen={showCallListModal}
          onClose={() => setShowCallListModal(false)}
          data={callListData}
      />

      <CandidateDetailModal 
          candidate={selectedCandidato}
          onClose={closeDetail}
          rupGenerated={rupGenerated}
          onGenerateRUP={handleGenerateRUP}
          onRefresh={refresh}
          onConfirmPayment={handleConfirmPayment}
      />

      <EditCandidateModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          initialData={initialEditData}
          onSave={handleSaveEdit}
      />

    </div>
  );
};

export default Inscritos;