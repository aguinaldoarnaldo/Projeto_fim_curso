import React, { useState, useMemo } from 'react';
import './Inscritos.css';
import {
  User,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Calendar,
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
  ChevronLeft,
  GraduationCap
} from 'lucide-react';

const Inscritos = () => {
  const [selectedCandidato, setSelectedCandidato] = useState(null);
  const [rupGenerated, setRupGenerated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Evaluation States
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [candidateToEvaluate, setCandidateToEvaluate] = useState(null);
  const [examGrade, setExamGrade] = useState('');

  // Filters State
  const [filters, setFilters] = useState({
    ano: '',
    status: '',
    curso: ''
  });

  const [inscritos, setInscritos] = useState([
    {
      id: 'INS2024001',
      nome: 'Eduarda Gomes',
      genero: 'Feminino',
      dataNascimento: '2008-05-12',
      nacionalidade: 'Angolana',
      bi: '001234567LA041',
      dataEmissaoBI: '2022-10-15',
      naturalidade: 'Luanda',
      residencia: 'Luanda, Maianga, Cassequel',
      telefone: '923000111',
      email: 'eduarda.gomes@email.com',
      deficiencia: 'Não',
      tipoDeficiencia: '',
      escola9: 'Pública',
      nomeEscola: 'Escola Primária 123',
      municipioEscola: 'Maianga',
      anoConclusao: '2023',
      anoInscricao: '2024',
      nota9: 18,
      notaExame: null, // New field
      curso1: 'Informática',
      curso2: 'Gestão',
      turno: 'Manhã',
      status: 'Pendente',
      dataInscricao: '20 Dez 2024',
      encarregado: {
        nome: 'João Gomes',
        parentesco: 'Pai',
        bi: '001234567LA022',
        telefone: '924000333',
        telefoneAlt: '912000444',
        email: 'joao.gomes@email.com',
        profissao: 'Engenheiro',
        residencia: 'Luanda, Maianga'
      }
    },
    {
      id: 'INS2024002',
      nome: 'Filipe Luís',
      genero: 'Masculino',
      dataNascimento: '2007-11-20',
      nacionalidade: 'Angolana',
      bi: '005554443LA088',
      dataEmissaoBI: '2021-03-10',
      naturalidade: 'Benguela',
      residencia: 'Cazenga, Luanda',
      telefone: '931222333',
      email: '',
      deficiencia: 'Sim',
      tipoDeficiencia: 'Visual parcial',
      escola9: 'Privada',
      nomeEscola: 'Colégio Esperança',
      municipioEscola: 'Cazenga',
      anoConclusao: '2023',
      anoInscricao: '2024',
      nota9: 15,
      notaExame: null,
      curso1: 'Gestão',
      curso2: '',
      turno: 'Tarde',
      status: 'Em Análise',
      dataInscricao: '21 Dez 2024',
      encarregado: {
        nome: 'Maria Luís',
        parentesco: 'Mãe',
        bi: '005554443LA011',
        telefone: '933000222',
        residencia: 'Cazenga, Luanda'
      }
    },
    {
      id: 'INS2024003',
      nome: 'Gina Rocha',
      genero: 'Feminino',
      dataNascimento: '2005-09-15',
      nacionalidade: 'Angolana',
      bi: '009887766LA055',
      dataEmissaoBI: '2020-07-20',
      naturalidade: 'Huambo',
      residencia: 'Viana, Luanda',
      telefone: '944888999',
      deficiencia: 'Não',
      escola9: 'Pública',
      nomeEscola: 'Magister',
      municipioEscola: 'Viana',
      anoConclusao: '2022',
      anoInscricao: '2024',
      nota9: 12,
      notaExame: null,
      curso1: 'Direito',
      curso2: 'Informática',
      turno: 'Noite',
      status: 'Pendente',
      dataInscricao: '22 Dez 2024',
      encarregado: null
    },
    {
      id: 'INS2023004',
      nome: 'Arnaldo Silva',
      genero: 'Masculino',
      dataNascimento: '2006-01-10',
      nacionalidade: 'Angolana',
      bi: '001122334LA001',
      dataEmissaoBI: '2020-01-15',
      naturalidade: 'Luanda',
      residencia: 'Viana, Luanda',
      telefone: '923111222',
      deficiencia: 'Não',
      escola9: 'Pública',
      nomeEscola: 'Escola 4040',
      municipioEscola: 'Viana',
      anoConclusao: '2022',
      anoInscricao: '2023',
      nota9: 17,
      notaExame: 16,
      curso1: 'Informática',
      curso2: '',
      turno: 'Manhã',
      status: 'Aprovado',
      dataInscricao: '15 Jan 2023',
      encarregado: null
    }
  ]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleOpenEvaluation = (candidato) => {
    setCandidateToEvaluate(candidato);
    setExamGrade(''); // Reset grade
    setShowEvaluationModal(true);
  };

  const handleCloseEvaluation = () => {
    setShowEvaluationModal(false);
    setCandidateToEvaluate(null);
    setExamGrade('');
  };

  const handleSubmitEvaluation = () => {
    if (!examGrade || isNaN(examGrade) || examGrade < 0 || examGrade > 20) {
      alert("Por favor, insira uma nota válida (0-20).");
      return;
    }

    const grade = parseFloat(examGrade);
    const isApproved = grade >= 10; // Passing grade is 10

    setInscritos(prev => prev.map(i => {
      if (i.id === candidateToEvaluate.id) {
        return {
          ...i,
          notaExame: grade,
          status: isApproved ? 'Aprovado' : 'Não Admitido'
        };
      }
      return i;
    }));

    handleCloseEvaluation();
  };

  const handleDownloadDoc = (docName) => {
    // Simulation of download
    alert(`Iniciando download do documento: ${docName}...\\n(Funcionalidade simulada)`);
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
    setCurrentPage(1); // Reset to first page on filter change
  };

  const resetFilters = () => {
    setFilters({ ano: '', status: '', curso: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filtered and Paginated Data
  const filteredInscritos = useMemo(() => {
    return inscritos.filter(i => {
      const matchesSearch = i.nome.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAno = filters.ano === '' || i.anoInscricao === filters.ano;
      const matchesStatus = filters.status === '' || i.status === filters.status;
      const matchesCurso = filters.curso === '' || i.curso1 === filters.curso;
      return matchesSearch && matchesAno && matchesStatus && matchesCurso;
    }).sort((a, b) => b.nota9 - a.nota9);
  }, [inscritos, searchTerm, filters]);

  const totalPages = Math.ceil(filteredInscritos.length / itemsPerPage);
  const currentData = filteredInscritos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Gestão de Inscrições</h1>
        <p>Acompanhe, avalie e matricule os candidatos inscritos no sistema.</p>
      </header>

      <div className="table-card">
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
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
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
                </select>
              </div>
              <div className="grupo-filtro">
                <label htmlFor="filtro-curso-ins">Curso</label>
                <select id="filtro-curso-ins" name="curso" value={filters.curso} onChange={handleFilterChange} className="selecao-filtro">
                  <option value="">Todos os Cursos</option>
                  <option value="Informática">Informática</option>
                  <option value="Gestão">Gestão</option>
                  <option value="Direito">Direito</option>
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

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Candidato</th>
                <th>Curso</th>
                <th>Exame</th>
                <th>Ano</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? currentData.map((i) => (
                <tr key={i.id} className="clickable-row">
                  <td onClick={() => setSelectedCandidato(i)}>{i.id}</td>
                  <td onClick={() => setSelectedCandidato(i)} style={{ fontWeight: 600 }}>{i.nome}</td>
                  <td onClick={() => setSelectedCandidato(i)}>{i.curso1}</td>
                  <td onClick={() => setSelectedCandidato(i)}>
                    {i.notaExame ? (
                      <span style={{ fontWeight: 800, color: i.notaExame >= 10 ? '#166534' : '#dc2626' }}>
                        {i.notaExame}
                      </span>
                    ) : '-'}
                  </td>
                  <td onClick={() => setSelectedCandidato(i)}>{i.anoInscricao}</td>
                  <td onClick={() => setSelectedCandidato(i)}>
                    <span className={`status-badge ${i.status === 'Pendente' ? 'status-pending' :
                      i.status === 'Em Análise' ? 'status-analysis' :
                        i.status === 'Aprovado' ? 'status-approved' : 'status-rejected'
                      }`}>
                      {i.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button
                        className="btn-action btn-evaluate"
                        onClick={(e) => { e.stopPropagation(); handleOpenEvaluation(i); }}
                      >
                        Avaliar
                      </button>
                      <button
                        className="btn-action btn-enroll"
                        disabled={i.status !== 'Aprovado'}
                        onClick={(e) => { e.stopPropagation(); alert(`Iniciando processo de matrícula para ${i.nome}`); }}
                      >
                        Matricular
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Nenhum candidato encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span className="page-indicator">Página {currentPage} de {totalPages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft size={18} /> Anterior
              </button>
              <button
                className="btn-page"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EVALUATION MODAL */}
      {showEvaluationModal && candidateToEvaluate && (
        <div className="modal-overlay">
          <div className="evaluation-modal-card">
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

      {selectedCandidato && (
        <div className="modal-overlay">
          <div className="detail-modal-card">
            <button className="btn-close-modal" onClick={closeDetail}>
              <X size={24} color="#64748b" />
            </button>

            <div className="modal-header-banner">
              <h2>Ficha de Inscrição Detalhada</h2>
              <p>ID: {selectedCandidato.id} • Data de Inscrição: {selectedCandidato.dataInscricao}</p>
            </div>

            <div className="modal-body">
              {/* BLOCO 1 – Dados do Candidato */}
              <section className="block-section">
                <div className="block-title">
                  <User size={18} /> BLOCO 1 – Dados do Candidato
                </div>
                <div className="block-content">
                  <div className="info-grid">
                    <div className="info-item"><label>Nome Completo</label><p>{selectedCandidato.nome}</p></div>
                    <div className="info-item"><label>Género</label><p>{selectedCandidato.genero}</p></div>
                    <div className="info-item"><label>Data de Nascimento</label><p>{selectedCandidato.dataNascimento}</p></div>
                    <div className="info-item"><label>Idade (Auto)</label><p>{calculateAge(selectedCandidato.dataNascimento)} anos</p></div>
                    <div className="info-item"><label>Nacionalidade</label><p>{selectedCandidato.nacionalidade}</p></div>
                    <div className="info-item"><label>Nº do BI / Passaporte</label><p>{selectedCandidato.bi}</p></div>
                    <div className="info-item"><label>Data de Emissão</label><p>{selectedCandidato.dataEmissaoBI}</p></div>
                    <div className="info-item"><label>Naturalidade</label><p>{selectedCandidato.naturalidade}</p></div>
                    <div className="info-item" style={{ gridColumn: 'span 2' }}>
                      <label>Residência</label><p>{selectedCandidato.residencia}</p>
                    </div>
                    <div className="info-item"><label>Telefone</label><p>{selectedCandidato.telefone}</p></div>
                    <div className="info-item"><label>Email</label><p>{selectedCandidato.email || 'Não fornecido'}</p></div>
                    <div className="info-item"><label>Portador de Deficiência?</label><p>{selectedCandidato.deficiencia}</p></div>
                    {selectedCandidato.deficiencia === 'Sim' && (
                      <div className="info-item"><label>Tipo de Deficiência</label><p>{selectedCandidato.tipoDeficiencia}</p></div>
                    )}
                  </div>
                </div>
              </section>

              {/* BLOCO 2 – Dados Académicos Anteriores */}
              <section className="block-section">
                <div className="block-title">
                  <BookOpen size={18} /> BLOCO 2 – Dados Académicos Anteriores
                </div>
                <div className="block-content">
                  <div className="info-grid">
                    <div className="info-item"><label>Tipo de Escola (9ª)</label><p>{selectedCandidato.escola9}</p></div>
                    <div className="info-item"><label>Nome da Escola</label><p>{selectedCandidato.nomeEscola}</p></div>
                    <div className="info-item"><label>Município da Escola</label><p>{selectedCandidato.municipioEscola}</p></div>
                    <div className="info-item"><label>Ano de Conclusão</label><p>{selectedCandidato.anoConclusao}</p></div>
                    <div className="info-item">
                      <label>Nota Final da 9ª Classe</label>
                      <p style={{ fontSize: '18px', fontWeight: 600 }}>{selectedCandidato.nota9}</p>
                    </div>
                    <div className="info-item">
                      <label>Nota do Exame</label>
                      <p style={{ fontSize: '24px', fontWeight: 900, color: selectedCandidato.notaExame >= 10 ? '#166534' : '#dc2626' }}>
                        {selectedCandidato.notaExame || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* BLOCO 3 – Curso Pretendido */}
              <section className="block-section">
                <div className="block-title">
                  <Award size={18} /> BLOCO 3 – Curso Pretendido
                </div>
                <div className="block-content">
                  <div className="info-grid">
                    <div className="info-item"><label>Curso – 1ª Opção</label><p>{selectedCandidato.curso1}</p></div>
                    <div className="info-item"><label>Curso – 2ª Opção</label><p>{selectedCandidato.curso2 || 'Nenhuma'}</p></div>
                    <div className="info-item"><label>Turno Pretendido</label><p>{selectedCandidato.turno}</p></div>
                  </div>
                </div>
              </section>

              {/* BLOCO 4 – Dados do Encarregado */}
              <section className="block-section">
                <div className="block-title">
                  <ShieldAlert size={18} /> BLOCO 4 – Dados do Encarregado de Educação
                </div>
                <div className="block-content">
                  {calculateAge(selectedCandidato.dataNascimento) < 18 ? (
                    <div className="guardian-alert">
                      <ShieldAlert size={16} /> <strong>Obrigatório:</strong> Os dados do encarregado de educação são obrigatórios para candidatos menores de idade.
                    </div>
                  ) : (
                    <p style={{ marginBottom: '15px', color: '#64748b', fontSize: '13px' }}>Deseja preencher dados de um encarregado? (Opcional para maiores de idade)</p>
                  )}

                  {selectedCandidato.encarregado ? (
                    <div className="info-grid">
                      <div className="info-item"><label>Nome Completo do Encarregado</label><p>{selectedCandidato.encarregado.nome}</p></div>
                      <div className="info-item"><label>Grau de Parentesco</label><p>{selectedCandidato.encarregado.parentesco}</p></div>
                      <div className="info-item"><label>Nº do BI do Encarregado</label><p>{selectedCandidato.encarregado.bi}</p></div>
                      <div className="info-item"><label>Telefone Principal</label><p>{selectedCandidato.encarregado.telefone}</p></div>
                      <div className="info-item"><label>Telefone Alternativo</label><p>{selectedCandidato.encarregado.telefoneAlt || 'N/A'}</p></div>
                      <div className="info-item"><label>Email</label><p>{selectedCandidato.encarregado.email || 'N/A'}</p></div>
                      <div className="info-item"><label>Profissão</label><p>{selectedCandidato.encarregado.profissao || 'N/A'}</p></div>
                      <div className="info-item" style={{ gridColumn: 'span 2' }}><label>Residência do Encarregado</label><p>{selectedCandidato.encarregado.residencia}</p></div>
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Nenhum dado de encarregado fornecido.</p>
                  )}
                </div>
              </section>

              {/* BLOCO 5 – Documentos */}
              <section className="block-section">
                <div className="block-title">
                  <FileText size={18} /> BLOCO 5 – Documentos (Upload)
                </div>
                <div className="block-content">
                  <div className="doc-list">
                    <div className="doc-item">
                      <FileText size={20} color="#2563eb" />
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>DOC. IDENTIFICAÇÃO</label>
                        <p style={{ fontSize: '13px' }}>identificacao_candidato.pdf</p>
                      </div>
                      <button
                        onClick={() => handleDownloadDoc('identificacao_candidato.pdf')}
                        className="btn-download"
                      >
                        <Download size={18} color="#64748b" />
                      </button>
                    </div>
                    <div className="doc-item">
                      <User size={20} color="#2563eb" />
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>FOTO TIPO PASSE</label>
                        <p style={{ fontSize: '13px' }}>foto_perfil.jpg</p>
                      </div>
                      <button
                        onClick={() => handleDownloadDoc('foto_perfil.jpg')}
                        className="btn-download"
                      >
                        <Download size={18} color="#64748b" />
                      </button>
                    </div>
                    <div className="doc-item">
                      <ClipboardCheck size={20} color="#2563eb" />
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>CERTIFICADO 9ª CLASSE</label>
                        <p style={{ fontSize: '13px' }}>certificado_conclusao.pdf</p>
                      </div>
                      <button
                        onClick={() => handleDownloadDoc('certificado_conclusao.pdf')}
                        className="btn-download"
                      >
                        <Download size={18} color="#64748b" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* BLOCO 6 – Confirmação e RUP */}
              <section className="block-section">
                <div className="block-title">
                  <CheckCircle2 size={18} /> BLOCO 6 – Confirmação e RUP
                </div>
                <div className="block-content">
                  {!rupGenerated ? (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                        <input type="checkbox" id="confirmData" style={{ width: '18px', height: '18px' }} />
                        <label htmlFor="confirmData" style={{ color: '#475569', fontSize: '14px', cursor: 'pointer' }}>
                          Confirmo que os dados fornecidos são verdadeiros
                        </label>
                      </div>
                      <button className="btn-finish" onClick={handleGenerateRUP}>
                        Gerar RUP e Finalizar Inscrição <ChevronRight size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="rup-container">
                      <div className="rup-header">Inscrição Validada - RUP Gerado! ✅</div>
                      <div className="rup-details">
                        <div className="rup-detail-item">
                          <label>NÚMERO DO RUP</label>
                          <span>2026{Math.floor(1000 + Math.random() * 9000)}</span>
                        </div>
                        <div className="rup-detail-item">
                          <label>VALOR (Kwanza)</label>
                          <span>5.500,00</span>
                        </div>
                        <div className="rup-detail-item">
                          <label>VALIDADE</label>
                          <span>4 Horas</span>
                        </div>
                      </div>
                      <button className="btn-print" onClick={() => window.print()}>
                        <Printer size={18} /> Imprimir Inscrição + RUP
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inscritos;