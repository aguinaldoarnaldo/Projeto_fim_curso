import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ArrowLeft,
    Save,
    User,
    BookOpen,
    FileText,
    ChevronRight,
    Upload,
    CheckCircle,
    ShieldAlert,
    Filter, // Added Filter icon
    MapPin,
    Phone
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { parseApiError } from '../../utils/errorParser';
import FilterModal from '../../components/Common/FilterModal';
 // Added FilterModal import
import { getClasses } from '../../services/classService';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';


import { useCache } from '../../context/CacheContext';
import './Matriculas.css';

const NovaMatricula = () => {
    const { hasPermission } = usePermission();
    const { clearCache } = useCache();

    const navigate = useNavigate();
    const location = useLocation();

    // Permission Check
    useEffect(() => {
        if (!hasPermission(PERMISSIONS.CREATE_MATRICULA)) {
            navigate('/dashboard');
        }
    }, [hasPermission, navigate]);
    const queryParams = new URLSearchParams(location.search);
    const aluno_id_param = queryParams.get('aluno_id');
    const tipo_param = queryParams.get('tipo');

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [turmasDisponiveis, setTurmasDisponiveis] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [turmaFilters, setTurmaFilters] = useState({
        sala: ''
    });
    const [classesDisponiveis, setClassesDisponiveis] = useState([]);
    const [anosDisponiveis, setAnosDisponiveis] = useState([]); 
    const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
    
    // State to hold form data
    const [formData, setFormData] = useState({
        candidato_id: '',
        aluno_id: '',
        nome_completo: '',
        data_nascimento: '',
        genero: '',
        numero_bi: '',
        nacionalidade: 'Angolana',
        email: '',
        telefone: '',
        provincia: '',
        municipio: '',
        bairro: '',
        numero_casa: '',
        naturalidade: '',
        deficiencia: 'Não',
        // Encarregado
        nome_encarregado: '',
        telefone_encarregado: '',
        parentesco_encarregado: '',
        numero_bi_encarregado: '',
        profissao_encarregado: '',
        // Academico
        curso: '',
        curso_primario: '',
        curso_secundario: '',
        classe: '',
        turno: '',
        turma_id: '', // Store ID
        sala: '',
        ano_lectivo: '',
        // Arquivos e Extras
        novo_aluno_foto: null,
        doc_certificado: null,
        tipo: 'Novo',
        matricula_id: '',
        numero_matricula: ''
    });

    const [editStepChoice, setEditStepChoice] = useState(null); // 'pessoais', 'academicos', 'documentos'

    const filterButtonRef = useRef(null);

    const filterConfigs = useMemo(() => [
        {
            key: 'sala',
            label: 'Sala',
            icon: MapPin,
            options: [
                ...[...new Set(turmasDisponiveis.map(t => t.sala_numero))].filter(Boolean).map(sala => ({ label: `Sala ${sala}`, value: String(sala) }))
            ]
        }
    ], [turmasDisponiveis]);

    const handleFilterChange = (key, value) => {
        setTurmaFilters({ ...turmaFilters, [key]: value });
    };

    useEffect(() => {
        const loadClassesAndYears = async () => {
            try {
                // Fetch classes and years concurrently
                const [classesRes, yearsRes, cursosRes] = await Promise.all([
                    getClasses(),
                    api.get('anos-lectivos/'),
                    api.get('cursos/')
                ]);
                
                setClassesDisponiveis(Array.isArray(classesRes) ? classesRes : []);
                setCursosDisponiveis(cursosRes.data.results || cursosRes.data || []);
                
                // Process Years
                const yearsData = yearsRes.data.results || yearsRes.data || [];
                setAnosDisponiveis(yearsData);

                // Auto-select active year
                const activeYear = yearsData.find(a => a.activo === true);

                if (activeYear) {
                    setFormData(prev => ({ ...prev, ano_lectivo: activeYear.nome }));
                }

            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        
        loadClassesAndYears();
    }, []);


    // Populate data from candidate if available
    useEffect(() => {
        if (location.state && location.state.candidato) {
            const c = location.state.candidato;

            // Check for photo URL
            let photoUrl = null;
            if (c.foto) {
                 photoUrl = c.foto; 
            } else if (c.files && c.files.foto) {
                 photoUrl = c.files.foto;
            }

            setFormData(prev => ({
                ...prev,
                candidato_id: c.real_id,
                nome_completo: c.nome,
                data_nascimento: c.dataNascimento,
                genero: c.genero === 'Masculino' ? 'M' : 'F',
                numero_bi: c.bi,
                nacionalidade: c.nacionalidade,
                email: c.email !== 'N/A' ? c.email : '',
                telefone: c.telefone !== 'N/A' ? c.telefone : '',
                provincia: c.provincia || '',
                municipio: c.municipio || '',
                bairro: (c.residencia && c.residencia !== 'N/A') ? c.residencia : '',
                naturalidade: c.naturalidade || '',
                deficiencia: c.deficiencia || 'Não',
                curso: c.curso1,
                curso_primario: c.curso1,
                curso_secundario: c.curso2,
                turno: c.turno,
                novo_aluno_foto: photoUrl, // Set photo URL
                
                // Encarregado
                nome_encarregado: (c.encarregado?.nome && c.encarregado.nome !== 'N/A') ? c.encarregado.nome : '',
                telefone_encarregado: (c.encarregado?.telefone && c.encarregado.telefone !== 'N/A') ? c.encarregado.telefone : '',
                parentesco_encarregado: (c.encarregado?.parentesco && c.encarregado.parentesco !== 'N/A') ? c.encarregado.parentesco : '',
                numero_bi_encarregado: c.encarregado?.bi || '',
                profissao_encarregado: c.encarregado?.profissao || '',

                // Documentos (URLs vindas da Inscrição)
                doc_bi_url: c.files?.bi || null,
                doc_certificado_url: c.files?.certificado || null
            }));
            
            // Fetch turmas relevant to this course/turn
            fetchTurmas(c.curso1, c.turno);
        } else if (location.state && location.state.matricula) {
            const m = location.state.matricula;
            const d = m.detalhes;

            setFormData(prev => ({
                ...prev,
                aluno_id: m.alunoId,
                nome_completo: m.aluno,
                data_nascimento: d.dataNascimento,
                genero: d.genero === 'Masculino' || d.genero === 'M' ? 'M' : 'F',
                numero_bi: d.bi,
                nacionalidade: d.nacionalidade || 'Angolana',
                email: d.email !== 'N/A' ? d.email : '',
                telefone: d.telefoneEncarregado !== 'N/A' ? d.telefoneEncarregado : '', // Use guardian phone as fallback
                provincia: d.provincia || '',
                municipio: d.municipio || '',
                bairro: d.bairro || '',
                numero_casa: d.numero_casa || '',
                naturalidade: d.naturalidade || '',
                deficiencia: d.deficiencia || 'Não',
                curso: m.curso || '',
                tipo: location.state.tipo || 'Confirmacao',
                matricula_id: m.real_id || '',
                novo_aluno_foto: m.foto || null,

                // Encarregado
                nome_encarregado: d.encarregado !== 'N/A' ? (d.encarregado || '') : '',
                telefone_encarregado: d.telefoneEncarregado !== 'N/A' ? (d.telefoneEncarregado || '') : '',
                parentesco_encarregado: d.parentesco !== 'N/A' ? (d.parentesco || '') : '',
                numero_bi_encarregado: d.bi_encarregado || '',
                profissao_encarregado: d.profissao_encarregado || '',

                // Academico
                classe: m.id_classe || d.id_classe || '',
                turma_id: m.id_turma || '',
                turno: m.turno || '',
                ano_lectivo: m.anoLectivo || '',

                // Documentos existentes
                doc_bi_url: d.doc_bi || d.documentos?.find(doc => doc.toLowerCase().includes('bi')) || null,
                doc_certificado_url: d.doc_cert || d.documentos?.find(doc => doc.toLowerCase().includes('certificado')) || null,
                documentos_lista: d.documentos || []
            }));

            // Fetch turmas relevant to this course/turn
            fetchTurmas(m.curso, m.turno, m.detalhes?.id_classe || m.id_classe);
        } else {
             fetchTurmas();
        }
    }, [location.state]); // Removed polling

    // Populate data from student if available
    useEffect(() => {
        const fetchStudentInfo = async () => {
            if (aluno_id_param) {
                try {
                    const res = await api.get(`alunos/${aluno_id_param}/`);
                    const s = res.data;
                    
                    // Logic for next class if it's a confirmation
                    let suggestedClasseId = s.id_turma?.id_classe?.id_classe || s.id_turma?.id_classe || '';
                    if (tipo_param === 'Confirmacao') {
                        // Find current class index and suggest next one
                        const currentClasseName = s.id_turma?.id_classe?.nome_classe || '';
                        const match = currentClasseName.match(/(\d+)/);
                        if (match) {
                            const currentLevel = parseInt(match[1]);
                            const nextLevel = currentLevel + 1;
                            const nextClasse = classesDisponiveis.find(c => c.nome_classe.includes(String(nextLevel)));
                            if (nextClasse) suggestedClasseId = nextClasse.id_classe;
                        }
                    }

                    setFormData(prev => ({
                        ...prev,
                        candidato_id: '',
                        aluno_id: s.id_aluno,
                        nome_completo: s.nome_completo,
                        data_nascimento: s.data_nascimento,
                        genero: s.genero === 'M' || s.genero === 'Masculino' ? 'M' : 'F',
                        numero_bi: s.numero_bi,
                        numero_matricula: s.numero_matricula || '',
                        email: s.email || '',
                        telefone: s.telefone || '',
                        provincia: s.provincia_residencia || '',
                        municipio: s.municipio_residencia || '',
                        bairro: s.bairro_residencia || '',
                        numero_casa: s.numero_casa || '',
                        curso: s.id_turma?.id_curso?.nome_curso || '',
                        classe: suggestedClasseId,
                        turno: s.id_turma?.id_periodo?.periodo || '',
                        tipo: tipo_param || 'Confirmacao',
                        novo_aluno_foto: s.img_path,
                        // Guardian info
                        nome_encarregado: s.encarregados?.[0]?.nome_completo || '',
                        telefone_encarregado: s.encarregados?.[0]?.telefone || '',
                        parentesco_encarregado: s.encarregados?.[0]?.grau_parentesco || '',
                    }));
                    
                    if (s.id_turma?.id_curso?.nome_curso) {
                        fetchTurmas(s.id_turma.id_curso.nome_curso, s.id_turma.id_periodo?.periodo, suggestedClasseId);
                    }
                } catch (err) {
                    console.error("Erro ao carregar dados do aluno:", err);
                }
            }
        };
        fetchStudentInfo();
    }, [aluno_id_param, tipo_param, classesDisponiveis]);

    const fetchTurmas = async (cursoFilter = null, turnoFilter = null, classeFilter = null) => {
        try {
            const response = await api.get('turmas/');
            let data = response.data.results || response.data;
            
            // Filter by Active Status (Critical: Hide concluded classes from past years)
            data = data.filter(t => t.status === 'Ativa');
            
            // Filter by the selected course
            const currentCourse = cursoFilter || formData.curso;
            if (currentCourse) {
                data = data.filter(t => t.curso_nome === currentCourse);
            }

            // Filter by Turn
            const currentTurno = turnoFilter !== null ? turnoFilter : formData.turno;
            if (currentTurno && currentTurno !== 'N/A') {
                data = data.filter(t => t.periodo_nome === currentTurno);
            }

            // Filter by Grade (Classe)
            const currentClasse = classeFilter !== null ? classeFilter : formData.classe;
            if (currentClasse) {
                data = data.filter(t => t.id_classe == currentClasse || t.classe_nivel == currentClasse);
            }
            
            setTurmasDisponiveis(data);
        } catch (error) {
            console.error("Erro ao carregar turmas", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'turno') {
             fetchTurmas(formData.curso, value, formData.classe);
        } else if (name === 'classe') {
             fetchTurmas(formData.curso, formData.turno, value);
        } else if (name === 'curso') {
             fetchTurmas(value, formData.turno, formData.classe);
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleTurmaChange = (e) => {
        const turmaId = e.target.value;
        const turmaObj = turmasDisponiveis.find(t => t.id_turma == turmaId);
        
        if (turmaObj) {
            setFormData(prev => ({
                ...prev,
                turma_id: turmaId,
                sala: turmaObj.sala_numero || '',
                classe: turmaObj.id_classe || '',
                turno: turmaObj.periodo_nome || ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                turma_id: turmaId,
                sala: '',
            }));
        }
    };

    const [isTransferido, setIsTransferido] = useState(false);
    const [historicoEscolar, setHistoricoEscolar] = useState([]);
    const [historicoForm, setHistoricoForm] = useState({
        escola: '',
        ano: '',
        classe: '',
        media: '',
        obs: ''
    });

    const addHistorico = () => {
        if (!historicoForm.escola || !historicoForm.classe || !historicoForm.ano) {
            alert("Preencha Escola, Classe e Ano.");
            return;
        }
        setHistoricoEscolar([...historicoEscolar, { ...historicoForm, id: Date.now() }]);
        setHistoricoForm({ escola: '', ano: '', classe: '', media: '', obs: '' });
    };

    const removeHistorico = (id) => {
        setHistoricoEscolar(historicoEscolar.filter(h => h.id !== id));
    };

    const handleSubmit = async () => {
        if (!formData.turma_id) {
            alert("Por favor, selecione uma turma.");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            
            // Append generic text fields
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined && key !== 'novo_aluno_foto' && key !== 'doc_bi' && key !== 'doc_certificado') {
                     data.append(key, formData[key]);
                }
            });

            // Append Files specifically
            if (formData.novo_aluno_foto && typeof formData.novo_aluno_foto !== 'string') {
                 data.append('novo_aluno_foto', formData.novo_aluno_foto);
            }
            if (formData.doc_bi) data.append('doc_bi', formData.doc_bi);
            if (formData.doc_certificado) data.append('doc_certificado', formData.doc_certificado);

            // Handle Transferido flag and history
            if (isTransferido) {
                 data.append('tipo', 'Transferencia');
                 data.append('historico_escolar', JSON.stringify(historicoEscolar));
            } else if (formData.aluno_id) {
                 data.append('tipo', formData.tipo);
                 data.append('id_aluno', formData.aluno_id);
                 if (formData.matricula_id) {
                     data.append('matricula_id', formData.matricula_id);
                 }
            } else {
                 data.append('tipo', 'Novo');
            }

            const isNewStudent = !formData.aluno_id;
            const hasBi = (formData.doc_bi || formData.doc_bi_url);
            const hasCert = (formData.doc_certificado || formData.doc_certificado_url);
            
            // For new students, documents ARE mandatory.
            // For existing students (aluno_id exists), they are OPTIONAL as they inherit from previous years.
            if (isNewStudent && (!hasBi || !hasCert)) {
                alert("Atenção: A documentação obrigatória (BI e Certificado) é necessária para registrar um novo aluno.");
                setIsSubmitting(false);
                return;
            }

            data.append('status', 'Ativa');

            // Backend Expects different keys sometimes, let's align
            // Backed "matriculas/matricular_novo_aluno/" expects fields like:
            // nome_completo, numero_bi, genero, id_turma (as turma_id in payload), etc.
            // Our payload builder above does most of it.
            
            const response = await api.post('matriculas/matricular_novo_aluno/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            const successMsg = response.data?.mensagem || "Operação realizada com sucesso!";
            
            const turmaObj = turmasDisponiveis.find(t => t.id_turma == formData.turma_id);
            const statusFinal = 'Ativa';

            alert(`✅ ${successMsg}\n\n` + 
                  `👤 Aluno: ${formData.nome_completo}\n` +
                  `🏫 Turma: ${turmaObj ? turmaObj.codigo_turma : 'N/A'}\n` + 
                  `📊 Estado: ${statusFinal}`);
            
            // Invalida o cache para forçar atualização na lista
            clearCache('matriculas');
                  
            navigate('/matriculas');
        } catch (error) {
            console.error("Erro na matrícula:", error);
            const msg = parseApiError(error, "Erro ao realizar matrícula. Tente novamente.");
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        // We allow editing logic:
        // If type is 'Confirmacao', we generally allow editing personal/academic info, 
        // but documents might be locked if they already exist.
        // The original isReadOnly blocked EVERYTHING. We want to unblock everything except specific logic.
        // So we won't use a global isReadOnly for the inputs.
        const isConfirming = tipo_param === 'Confirmacao' || (location.state && location.state.tipo === 'Confirmacao');
        const isEditing = formData.tipo === 'Edicao' || (location.state && location.state.tipo === 'Edicao');
        const isStrictlyReadOnly = isConfirming && !isEditing; 
        const isReadOnly = isStrictlyReadOnly;

        // Se for edição e ainda não escolheu o que editar, mostra o menu de escolha
        if (isEditing && !editStepChoice && step === 1) {
            return (
                <div className="table-card" style={{ padding: '20px', textAlign: 'center', animation: 'fadeIn 0.4s' }}>
                    <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>O que deseja editar?</h2>
                    <p style={{ color: '#64748b', marginBottom: '30px' }}>Selecione a secção que pretende atualizar para {formData.nome_completo}</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
                        <div 
                            onClick={() => { setEditStepChoice('pessoais'); setStep(1); }}
                            className="edit-choice-card"
                            style={{ 
                                padding: '30px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
                                cursor: 'pointer', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' 
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '12px', color: 'var(--primary-color)' }}>
                                <User size={32} />
                            </div>
                            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Dados Pessoais & Encarregado</span>
                        </div>

                        <div 
                            onClick={() => { setEditStepChoice('academicos'); setStep(2); }}
                            className="edit-choice-card"
                            style={{ 
                                padding: '30px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
                                cursor: 'pointer', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' 
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '12px', color: '#16a34a' }}>
                                <BookOpen size={32} />
                            </div>
                            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Dados Académicos & Turma</span>
                        </div>

                        <div 
                            onClick={() => { setEditStepChoice('documentos'); setStep(3); }}
                            className="edit-choice-card"
                            style={{ 
                                padding: '30px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
                                cursor: 'pointer', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' 
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ padding: '15px', background: '#fef2f2', borderRadius: '12px', color: '#dc2626' }}>
                                <FileText size={32} />
                            </div>
                            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Documentos & Anexos</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/matriculas')}
                        style={{ marginTop: '40px', background: 'none', border: 'none', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Cancelar e Voltar
                    </button>
                </div>
            );
        }

        let imagePreview = null;
        if (formData.novo_aluno_foto) {
             if (typeof formData.novo_aluno_foto === 'string') {
                 imagePreview = formData.novo_aluno_foto; 
             } else if (formData.novo_aluno_foto instanceof File || formData.novo_aluno_foto instanceof Blob) {
                 imagePreview = URL.createObjectURL(formData.novo_aluno_foto);
             }
        }

        switch (step) {
            case 1:
                return (
                    <div className="table-card" style={{ padding: '20px 25px', animation: 'fadeIn 0.3s' }}>
                        <h3 className="form-title">
                            <User size={22} /> Dados Pessoais do Aluno 
                            {isReadOnly && <span className="badge-provenience">Proveniente de Candidatura</span>}
                        </h3>

                        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                            {/* Coluna da Foto (Esquerda) */}
                            <div style={{ width: '180px', flexShrink: 0, textAlign: 'center', background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ 
                                    width: '120px', height: '120px', borderRadius: '30px', background: 'white', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    overflow: 'hidden', border: '3px solid white', 
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                                    margin: '0 auto 10px',
                                    position: 'relative'
                                }}>
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    ) : (
                                        <div style={{ textAlign: 'center' }}>
                                            <User size={40} color="#cbd5e1" />
                                            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '5px', fontWeight: '600' }}>SEM FOTO</p>
                                        </div>
                                    )}
                                </div>
                                
                                <label className="photo-upload-btn" style={{ 
                                    fontSize: '13px', 
                                    padding: '10px 15px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                                    transition: 'all 0.2s',
                                    width: '100%'
                                }}>
                                    <Upload size={16} />
                                    {imagePreview ? 'Trocar Foto' : 'Anexar Foto'}
                                    <input type="file" name="novo_aluno_foto" onChange={handleFileChange} accept="image/*" style={{display:'none'}} />
                                </label>
                                <p style={{fontSize:'10px', color:'#64748b', marginTop:'5px', fontWeight: '500'}}>Fundo Branco, 3x4</p>
                            </div>

                            {/* Coluna dos Campos (Direita) - Ocupa o resto */}
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                
                                <div style={{ gridColumn: 'span 3' }}>
                                    <label className="field-label">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        name="nome_completo"
                                        value={formData.nome_completo}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                        placeholder="Nome do Aluno"
                                    />
                                </div>

                                {formData.numero_matricula && (
                                    <div>
                                        <label className="field-label">Nº de Matrícula (Permanente)</label>
                                        <input 
                                            type="text" 
                                            value={formData.numero_matricula}
                                            readOnly
                                            className="field-input read-only"
                                            style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="field-label">Data de Nascimento</label>
                                    <input 
                                        type="date" 
                                        name="data_nascimento"
                                        value={formData.data_nascimento}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Gênero</label>
                                    {isReadOnly ? (
                                        <input 
                                            type="text" 
                                            value={formData.genero === 'M' ? 'Masculino' : (formData.genero === 'F' ? 'Feminino' : formData.genero)} 
                                            readOnly={isStrictlyReadOnly} 
                                            className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                        />
                                    ) : (
                                        <select name="genero" value={formData.genero} onChange={handleInputChange} className="field-select">
                                            <option value="">Selecione...</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Feminino</option>
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="field-label">Naturalidade (Província)</label>
                                    <input 
                                        type="text" 
                                        name="naturalidade"
                                        value={formData.naturalidade || ''}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                        placeholder="Ex: Luanda"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Nacionalidade</label>
                                    <input 
                                        type="text" 
                                        name="nacionalidade"
                                        value={formData.nacionalidade || ''}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Deficiência?</label>
                                    {isReadOnly ? (
                                        <input type="text" value={formData.deficiencia} readOnly={isStrictlyReadOnly} className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`} />
                                    ) : (
                                        <select name="deficiencia" value={formData.deficiencia} onChange={handleInputChange} className="field-select">
                                            <option value="Não">Não</option>
                                            <option value="Sim">Sim</option>
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="field-label">Email</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                        placeholder="exemplo@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Telefone</label>
                                    <input 
                                        type="text" 
                                        name="telefone"
                                        value={formData.telefone || ''}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                        placeholder="923000000"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Nº BI</label>
                                    <input 
                                        type="text" 
                                        name="numero_bi"
                                        value={formData.numero_bi}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                        placeholder="000000000LA000"
                                    />
                                </div>

                                {/* Divisória Visual */}
                                <div style={{ gridColumn: 'span 3', borderTop: '1px dashed #e2e8f0', margin: '5px 0' }}></div>

                                <div>
                                    <label className="field-label">Província</label>
                                    <input 
                                        type="text" 
                                        name="provincia"
                                        value={formData.provincia || ''}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                        placeholder="Huíla"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Município</label>
                                    <input 
                                        type="text" 
                                        name="municipio"
                                        value={formData.municipio || ''}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                        placeholder="Lubango"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Bairro</label>
                                    <input 
                                        type="text" 
                                        name="bairro"
                                        value={formData.bairro || ''}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                        placeholder="Bairro..."
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Nº Casa</label>
                                    <input 
                                        type="text" 
                                        name="numero_casa"
                                        value={formData.numero_casa || ''}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className={`field-input ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                        placeholder="Casa nº..."
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Guardian Section - Compacta */}
                        <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
                                <User size={16} style={{ display: 'inline', marginRight: '5px' }} /> Encarregado de Educação
                            </h4>
                             <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: '10px' }}>
                                 <div>
                                    <label className="field-label">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        name="nome_encarregado"
                                        value={formData.nome_encarregado}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className="field-input small-input" 
                                        style={{ height: '38px' }}
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Nº BI</label>
                                    <input 
                                        type="text" 
                                        name="numero_bi_encarregado"
                                        value={formData.numero_bi_encarregado}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className="field-input small-input"
                                        style={{ height: '38px' }}
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Telefone</label>
                                    <input 
                                        type="text" 
                                        name="telefone_encarregado"
                                        value={formData.telefone_encarregado}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className="field-input small-input"
                                        style={{ height: '38px' }}
                                    />
                                </div>
                                 <div>
                                    <label className="field-label">Parentesco</label>
                                    <input 
                                        type="text" 
                                        name="parentesco_encarregado"
                                        value={formData.parentesco_encarregado}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className="field-input small-input"
                                        style={{ height: '38px' }}
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Profissão</label>
                                    <input 
                                        type="text" 
                                        name="profissao_encarregado"
                                        value={formData.profissao_encarregado}
                                        onChange={handleInputChange}
                                        readOnly={isStrictlyReadOnly}
                                        className="field-input small-input"
                                        style={{ height: '38px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                const turmaSelect = turmasDisponiveis.find(t => t.id_turma == formData.turma_id);

                return (
                    <div className="table-card" style={{ padding: '20px 25px', animation: 'fadeIn 0.3s' }}>
                        <h3 className="form-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span><BookOpen size={22} /> Dados Académicos & Turma</span>
                            {!isStrictlyReadOnly && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'normal', background: '#f1f5f9', padding: '5px 15px', borderRadius: '20px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={isTransferido} 
                                        onChange={(e) => setIsTransferido(e.target.checked)}
                                        style={{ accentColor: 'var(--primary-color)' }}
                                    />
                                    <span>Aluno Transferido?</span>
                                </label>
                            )}
                        </h3>

                        {/* Grid Principal: Curso, Tipo, Turno, Ano, Classe */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                            
                            {/* Coluna 1: Curso */}
                            <div style={{ gridColumn: (formData.curso_primario && formData.curso_secundario) ? 'span 2' : 'span 1' }}>
                                <label className="field-label">Curso</label>
                                {formData.curso_primario && formData.curso_secundario ? (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            type="button"
                                            onClick={() => { 
                                                setFormData(prev => ({...prev, curso: formData.curso_primario, turma_id: '', classe: '', turno: ''})); 
                                                fetchTurmas(formData.curso_primario, null, null); 
                                            }}
                                            className={`btn-choice ${formData.curso === formData.curso_primario ? 'active' : ''}`}
                                            style={{
                                                flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid',
                                                borderColor: formData.curso === formData.curso_primario ? '#1e3a8a' : '#cbd5e1',
                                                background: formData.curso === formData.curso_primario ? '#eff6ff' : 'white',
                                                color: formData.curso === formData.curso_primario ? '#1e3a8a' : '#64748b',
                                                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            1ª: {formData.curso_primario}
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => { 
                                                setFormData(prev => ({...prev, curso: formData.curso_secundario, turma_id: '', classe: '', turno: ''})); 
                                                fetchTurmas(formData.curso_secundario, null, null); 
                                            }}
                                            className={`btn-choice ${formData.curso === formData.curso_secundario ? 'active' : ''}`}
                                            style={{
                                                flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid',
                                                borderColor: formData.curso === formData.curso_secundario ? '#1e3a8a' : '#cbd5e1',
                                                background: formData.curso === formData.curso_secundario ? '#eff6ff' : 'white',
                                                color: formData.curso === formData.curso_secundario ? '#1e3a8a' : '#64748b',
                                                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            2ª: {formData.curso_secundario}
                                        </button>
                                    </div>
                                ) : (
                                    <select name="curso" value={formData.curso} onChange={handleInputChange} className="field-select">
                                        <option value="">Selecione o Curso...</option>
                                        {cursosDisponiveis.map(c => (
                                            <option key={c.id_curso} value={c.nome_curso}>{c.nome_curso}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Coluna 2: Tipo de Matrícula */}
                            <div>
                                <label className="field-label">Tipo de Matrícula</label>
                                <select 
                                    name="tipo" 
                                    value={formData.tipo} 
                                    onChange={handleInputChange} 
                                    className={`field-select ${isStrictlyReadOnly ? 'read-only' : ''}`}
                                    style={{ fontWeight: '600', color: 'var(--primary-color)' }}
                                    disabled={isStrictlyReadOnly}
                                >
                                    <option value="Novo">Novo Ingresso</option>
                                    <option value="Confirmacao">Confirmação</option>
                                    <option value="Repetente">Repetente</option>
                                    <option value="Transferencia">Transferência</option>
                                    <option value="Reenquadramento">Reenquadramento</option>
                                </select>
                            </div>

                            {/* Coluna 3: Classe */}
                            <div>
                                <label className="field-label">Classe (Ano Curricular)</label>
                                <select 
                                    name="classe" 
                                    value={formData.classe} 
                                    onChange={handleInputChange} 
                                    className="field-select"
                                >
                                    <option value="">Selecione a Classe...</option>
                                    {classesDisponiveis.map(c => (
                                        <option key={c.id_classe} value={c.id_classe}>{c.descricao || `${c.nivel}ª Classe`}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Coluna 4: Turno */}
                            <div>
                                <label className="field-label">Turno</label>
                                <select 
                                    name="turno" 
                                    value={formData.turno || ''} 
                                    onChange={handleInputChange} 
                                    className="field-select"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Manhã">Manhã</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Noite">Noite</option>
                                </select>
                            </div>

                             {/* Coluna 5: Ano Lectivo */}
                            <div>
                                <label className="field-label">Ano Lectivo</label>
                                <select 
                                    name="ano_lectivo" 
                                    value={formData.ano_lectivo} 
                                    onChange={handleInputChange} 
                                    className={`field-select ${isReadOnly ? 'read-only' : ''}`}
                                    disabled={isReadOnly}
                                >
                                    <option value="">Selecione...</option>
                                    {anosDisponiveis.map(a => (
                                        <option key={a.id || a.id_ano} value={a.nome}>{a.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Seleção de Turma (Destaque) */}
                        <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label className="field-label" style={{ color: '#0369a1', fontWeight: 700, marginBottom: 0 }}>TURMA (Obrigatório)</label>
                                <div style={{ position: 'relative' }}>
                                    <button 
                                        type="button"
                                        ref={filterButtonRef}
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="btn-filter-turma"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            background: 'white', border: '1px solid #bae6fd',
                                            padding: '4px 12px', borderRadius: '6px', fontSize: '13px',
                                            color: '#0369a1', cursor: 'pointer'
                                        }}
                                    >
                                        <Filter size={14} />
                                        {turmaFilters.sala ? `Filtrando por Sala ${turmaFilters.sala}` : 'Filtrar por Sala'}
                                    </button>

                                    <FilterModal
                                        isOpen={showFilters}
                                        onClose={() => setShowFilters(false)}
                                        filterConfigs={filterConfigs}
                                        activeFilters={turmaFilters}
                                        onFilterChange={handleFilterChange}
                                        onClearFilters={() => setTurmaFilters({ sala: '' })}
                                        triggerRef={filterButtonRef}
                                    />
                                </div>
                            </div>


                            <select 
                                name="turma_id" 
                                value={formData.turma_id} 
                                onChange={handleTurmaChange} 
                                className="field-select"
                                style={{ borderColor: '#0ea5e9', borderWidth: '2px', fontSize: '15px', padding: '10px' }}
                            >
                                <option value="">-- Selecione uma Turma --</option>
                                {turmasDisponiveis
                                    .filter(t => !turmaFilters.sala || String(t.sala_numero) === String(turmaFilters.sala))
                                    .map(t => (
                                        <option key={t.id_turma} value={t.id_turma}>
                                            {t.codigo_turma} - {t.curso_nome} ({t.sala_numero ? `Sala ${t.sala_numero}` : 'Sem Sala'}) - {t.periodo_nome}
                                        </option>
                                    ))}
                            </select>
                            {turmaSelect && (() => {
                                const cap = turmaSelect.sala_capacidade || 40;
                                const ocup = turmaSelect.total_alunos || 0;
                                const rest = cap - ocup;
                                const isCrit = rest <= 5; 
                                
                                return (
                                    <div style={{ marginTop: '10px', fontSize: '13px', color: '#0284c7', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <span><strong>Sala:</strong> {turmaSelect.sala_numero || 'N/A'}</span>
                                        <span style={{ 
                                            color: isCrit ? '#dc2626' : '#15803d', 
                                            fontWeight: 'bold',
                                            background: isCrit ? '#fef2f2' : '#f0fdf4',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            border: isCrit ? '1px solid #fee2e2' : '1px solid #bbf7d0'
                                        }}>
                                            {ocup}/{cap} Ocupados ({rest} vagas)
                                        </span>
                                        {isCrit && <span style={{color:'#dc2626', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}><ShieldAlert size={14}/> Poucas Vagas!</span>}
                                    </div>
                                );
                            })()}
                        </div>

                         {/* Historico Section (Expandable) */}
                        {isTransferido && (
                            <div style={{ marginTop: '20px', borderTop: '2px dashed #cbd5e1', paddingTop: '20px', animation: 'slideDown 0.3s' }}>
                                <h4 style={{ marginBottom: '15px', color: '#334155', fontSize: '15px' }}>Histórico Escolar (Anos Anteriores)</h4>
                                
                                {/* Formulario Horizontal */}
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ flex: 2 }}>
                                        <label className="field-label" style={{fontSize:'11px'}}>Escola de Origem</label>
                                        <input type="text" className="field-input" placeholder="Ex: Escola 123" style={{height:'36px'}}
                                            value={historicoForm.escola} onChange={e => setHistoricoForm({...historicoForm, escola: e.target.value})} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="field-label" style={{fontSize:'11px'}}>Classe</label>
                                        <input type="text" className="field-input" placeholder="Ex: 9ª" style={{height:'36px'}}
                                            value={historicoForm.classe} onChange={e => setHistoricoForm({...historicoForm, classe: e.target.value})} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="field-label" style={{fontSize:'11px'}}>Ano</label>
                                        <input type="text" className="field-input" placeholder="Ex: 2024" style={{height:'36px'}}
                                            value={historicoForm.ano} onChange={e => setHistoricoForm({...historicoForm, ano: e.target.value})} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="field-label" style={{fontSize:'11px'}}>Média</label>
                                        <input type="number" className="field-input" placeholder="0-20" style={{height:'36px'}}
                                            value={historicoForm.media} onChange={e => setHistoricoForm({...historicoForm, media: e.target.value})} />
                                    </div>
                                    <button type="button" onClick={addHistorico} className="btn-primary-action" style={{ height: '36px', padding: '0 20px', marginBottom: '1px' }}>
                                        Adicionar
                                    </button>
                                </div>

                                {/* Tabela Compacta */}
                                {historicoEscolar.length > 0 && (
                                    <div style={{ marginTop: '15px', overflowX: 'auto' }}>
                                        <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{background:'#f1f5f9'}}>
                                                    <th style={{padding:'8px', textAlign:'left'}}>Ano</th>
                                                    <th style={{padding:'8px', textAlign:'left'}}>Classe</th>
                                                    <th style={{padding:'8px', textAlign:'left'}}>Escola</th>
                                                    <th style={{padding:'8px', textAlign:'left'}}>Média</th>
                                                    <th style={{padding:'8px', textAlign:'center'}}>Remover</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historicoEscolar.map(h => (
                                                    <tr key={h.id} style={{borderBottom:'1px solid #e2e8f0'}}>
                                                        <td style={{padding:'8px'}}>{h.ano}</td>
                                                        <td style={{padding:'8px'}}>{h.classe}</td>
                                                        <td style={{padding:'8px'}}>{h.escola}</td>
                                                        <td style={{padding:'8px'}}>{h.media || '-'}</td>
                                                        <td style={{padding:'8px', textAlign:'center'}}>
                                                            <button type="button" onClick={() => removeHistorico(h.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 3:
                const turmaSelecionada = turmasDisponiveis.find(t => t.id_turma == formData.turma_id);

                return (
                    <div className="table-card" style={{ padding: '20px 25px', animation: 'fadeIn 0.3s' }}>
                        <h3 className="form-title">
                            <FileText size={22} /> Revisão e Documentação
                        </h3>

                        {/* Summary Card */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle size={18} color="#16a34a" /> Resumo da Matrícula
                                </h4>
                                {isEditing && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>MODO EDIÇÃO</span>}
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '30px', fontSize: '14px' }}>
                                {/* Foto no Resumo */}
                                <div style={{ 
                                    width: '100px', height: '100px', borderRadius: '16px', background: '#fff', 
                                    border: '2px solid #e2e8f0', overflow: 'hidden', display: 'flex', 
                                    alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                                }}>
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Final" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    ) : (
                                        <User size={40} color="#cbd5e1" />
                                    )}
                                </div>

                                {/* Dados Pessoais & Contactos */}
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Identificação & Contacto</p>
                                    <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '17px', marginBottom: '2px' }}>{formData.nome_completo}</p>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>BI: {formData.numero_bi}</p>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                                            <User size={14} color="#94a3b8" /> {formData.nome_encarregado || 'N/A'} (Encarregado)
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                                            <Phone size={14} color="#94a3b8" /> {formData.telefone_encarregado || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {/* Dados Académicos */}
                                <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '25px' }}>
                                    <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Vínculo Académico</p>
                                    
                                    {turmaSelecionada || (location.state?.matricula) ? (
                                        <>
                                            <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
                                                {turmaSelecionada?.codigo_turma || location.state?.matricula?.turma || 'Carregando...'}
                                            </p>
                                            <p style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                                                {formData.curso} • {formData.turno}
                                            </p>
                                            <p style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '6px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPin size={14} /> Sala: {turmaSelecionada?.sala_numero || location.state?.matricula?.sala || 'N/A'}
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                                Ano Lectivo: {formData.ano_lectivo}
                                            </p>
                                        </>
                                    ) : (
                                        <p style={{ color: '#ef4444', fontWeight: 'bold' }}>Nenhuma turma selecionada!</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Aviso de Bloqueio se Documentos Faltantes */}
                        {(!isConfirming && !formData.aluno_id && !formData.doc_bi_url && !formData.doc_certificado_url && !formData.doc_bi && !formData.doc_certificado) && (
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', display: 'flex', gap: '10px' }}>
                                <ShieldAlert size={20} color="#dc2626" />
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b', marginBottom: '2px' }}>Documentação Obrigatória Pendente</p>
                                    <p style={{ fontSize: '13px', color: '#b91c1c' }}>Não é possível finalizar a matrícula sem o <strong>BI</strong> e o <strong>Certificado</strong>. Por favor, anexe os documentos abaixo.</p>
                                </div>
                            </div>
                        )}

                        <div className="form-grid-2col">
                            {/* Documentos */}
                            <div style={{gridColumn:'1 / -1'}}>
                                <h4 style={{fontSize:'16px', color:'#334155', marginBottom:'5px', borderBottom:'1px solid #e2e8f0', paddingBottom:'8px'}}>Anexo de Documentos</h4>
                                {isConfirming ? (
                                    <div style={{padding:'10px', background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'8px', color:'#0369a1', fontSize:'13px'}}>
                                        ℹ️ Modo de Confirmação: Os documentos existentes serão mantidos. Se desejar, pode anexar novos arquivos para atualização (Opcional).
                                    </div>
                                ) : (
                                    formData.aluno_id && (
                                        <p style={{fontSize:'12px', color:'#64748b', marginBottom:'15px'}}>
                                            💡 Este aluno já possui registo. Se não anexar novos documentos, o sistema utilizará os arquivos das matrículas anteriores.
                                        </p>
                                    )
                                )}
                            </div>

                            <div>
                                {formData.doc_bi_url ? (
                                    <div className="file-upload-box" style={{border: '2px solid #bbf7d0', background: '#f0fdf4', padding: '15px', borderRadius: '8px', display:'flex', alignItems:'center', gap:'10px', marginBottom: '10px'}}>
                                        <div style={{background:'#22c55e', borderRadius:'50%', padding:'5px', display:'flex'}}><CheckCircle size={16} color="white"/></div>
                                        <div style={{flex:1}}>
                                            <span style={{display:'block', fontSize:'13px', fontWeight:'600', color:'#15803d'}}>BI / Documento de ID</span>
                                            <a href={formData.doc_bi_url} target="_blank" rel="noreferrer" style={{fontSize:'11px', color:'#166534', textDecoration:'underline'}}>Visualizar Atual</a>
                                        </div>
                                    </div>
                                ) : null}
                                
                                <div className="file-upload-box" style={{border: (!formData.doc_bi) ? '2px dashed #cbd5e1' : '2px dashed #3b82f6', padding: '15px', borderRadius: '8px', textAlign: 'center', background: '#f8fafc'}}>
                                    <Upload size={20} color={formData.doc_bi ? "#3b82f6" : "#64748b"} style={{marginBottom:'5px'}}/>
                                    <input type="file" name="doc_bi" onChange={handleFileChange} accept=".pdf, image/*" style={{width:'100%', fontSize:'12px'}} />
                                    {isConfirming && <p style={{fontSize: '10px', color: '#94a3b8', marginTop: '5px'}}>Anexe apenas se desejar substituir o original</p>}
                                    {formData.doc_bi && <span style={{color: 'green', fontSize:'12px', display:'block', marginTop:'5px'}}><CheckCircle size={12} style={{display:'inline'}}/> Selecionado: {formData.doc_bi.name}</span>}
                                </div>
                            </div>
                            
                            <div>
                                <label className="field-label">Certificado / Declaração {(!formData.doc_certificado && !formData.doc_certificado_url) && <span style={{color: '#ef4444', fontSize:'11px'}}>(Pendente)</span>}</label>
                                {formData.doc_certificado_url ? (
                                    <div className="file-upload-box" style={{border: '2px solid #bbf7d0', background: '#f0fdf4', padding: '15px', borderRadius: '8px', display:'flex', alignItems:'center', gap:'10px', marginBottom: '10px'}}>
                                        <div style={{background:'#22c55e', borderRadius:'50%', padding:'5px', display:'flex'}}><CheckCircle size={16} color="white"/></div>
                                        <div style={{flex:1}}>
                                            <span style={{display:'block', fontSize:'13px', fontWeight:'600', color:'#15803d'}}>Certificado de Habilitações</span>
                                            <a href={formData.doc_certificado_url} target="_blank" rel="noreferrer" style={{fontSize:'11px', color:'#166534', textDecoration:'underline'}}>Visualizar Atual</a>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="file-upload-box" style={{border: (!formData.doc_certificado) ? '2px dashed #cbd5e1' : '2px dashed #3b82f6', padding: '15px', borderRadius: '8px', textAlign: 'center', background: '#f8fafc'}}>
                                    <Upload size={20} color={formData.doc_certificado ? "#3b82f6" : "#64748b"} style={{marginBottom:'5px'}}/>
                                    <input type="file" name="doc_certificado" onChange={handleFileChange} accept=".pdf, image/*" style={{width:'100%', fontSize:'12px'}} />
                                    {isConfirming && <p style={{fontSize: '10px', color: '#94a3b8', marginTop: '5px'}}>Anexe apenas se desejar substituir o original</p>}
                                    {formData.doc_certificado && <span style={{color: 'green', fontSize:'12px', display:'block', marginTop:'5px'}}><CheckCircle size={12} style={{display:'inline'}}/> Selecionado: {formData.doc_certificado.name}</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '20px' }}>
                            <label className="field-checkbox" style={{
                                opacity: (formData.aluno_id || ((formData.doc_bi || formData.doc_bi_url) && (formData.doc_certificado || formData.doc_certificado_url))) ? 1 : 0.6,
                                cursor: (formData.aluno_id || ((formData.doc_bi || formData.doc_bi_url) && (formData.doc_certificado || formData.doc_certificado_url))) ? 'pointer' : 'not-allowed'
                            }}>
                                <input 
                                    type="checkbox" 
                                    defaultChecked={formData.aluno_id || ((formData.doc_bi || formData.doc_bi_url) && (formData.doc_certificado || formData.doc_certificado_url))}
                                    disabled={!(formData.aluno_id || ((formData.doc_bi || formData.doc_bi_url) && (formData.doc_certificado || formData.doc_certificado_url)))} 
                                /> Confirmar que os dados estão corretos e finalizar matrícula.
                            </label>
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="page-container nova-matricula-container">
            <header className="page-header matriculas-header-content">
                <div>
                    <button
                        onClick={() => navigate('/matriculas')}
                        className="btn-back-link"
                    >
                        <ArrowLeft size={16} /> Voltar à lista
                    </button>
                    <h1>{formData.tipo === 'Edicao' ? 'Editar Matrícula' : 'Nova Ficha de Matrícula'}</h1>
                    <p>{formData.tipo === 'Edicao' ? `Atualizando informações de ${formData.nome_completo}` : 'Preencha os dados abaixo com precisão para registrar o novo aluno.'}</p>
                </div>
                <div className="step-header-actions">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="step-indicator">
                            <div className="step-number" style={{ background: step >= s ? '#1e3a8a' : '#9ca3af' }}>{s}</div>
                            <span className="step-label" style={{ color: step >= s ? '#1e3a8a' : '#9ca3af' }}>
                                {s === 1 ? 'Dados' : s === 2 ? 'Académico' : 'Confirmar'}
                            </span>
                        </div>
                    ))}
                </div>
            </header>

            <div className="step-container">
                {renderStep()}

                <div className="step-actions">
                    {editStepChoice ? (
                        <button
                            type="button"
                            onClick={() => { setEditStepChoice(null); setStep(1); }}
                            className="btn-step-prev"
                        >
                            <ArrowLeft size={16} /> Voltar para Opções
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1 || isSubmitting}
                            className="btn-step-prev"
                            style={{ cursor: step === 1 ? 'not-allowed' : 'pointer', opacity: step === 1 ? 0.5 : 1 }}
                        >
                            Anterior
                        </button>
                    )}

                    {editStepChoice ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="btn-step-finish"
                            style={{ background: 'var(--primary-color)' }}
                        >
                            {isSubmitting ? 'Processando...' : <><Save size={18} /> Salvar Alterações</>}
                        </button>
                    ) : step < 3 ? (
                        <button
                            type="button"
                            onClick={() => setStep(s => s + 1)}
                            className="btn-step-next"
                        >
                            Próximo Passo <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!formData.aluno_id && !((formData.doc_bi || formData.doc_bi_url) && (formData.doc_certificado || formData.doc_certificado_url)))}
                            className="btn-step-finish"
                            style={{
                                opacity: (formData.aluno_id || ((formData.doc_bi || formData.doc_bi_url) && (formData.doc_certificado || formData.doc_certificado_url))) ? 1 : 0.5,
                                cursor: (formData.aluno_id || ((formData.doc_bi || formData.doc_bi_url) && (formData.doc_certificado || formData.doc_certificado_url))) ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {isSubmitting ? 'Processando...' : <><Save size={18} /> Finalizar Matrícula</>}
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};

export default NovaMatricula;
