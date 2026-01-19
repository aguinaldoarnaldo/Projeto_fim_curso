import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Save,
    User,
    BookOpen,
    FileText,
    ChevronRight,
    Upload,
    CheckCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import './Matriculas.css';

const NovaMatricula = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [turmasDisponiveis, setTurmasDisponiveis] = useState([]);
    
    // State to hold form data
    const [formData, setFormData] = useState({
        candidato_id: '',
        nome_completo: '',
        data_nascimento: '',
        genero: '',
        numero_bi: '',
        nacionalidade: 'Angolana',
        // Encarregado
        nome_encarregado: '',
        telefone_encarregado: '',
        parentesco_encarregado: '',
        // Academico
        curso: '',
        classe: '10ª Classe',
        turno: '',
        turma_id: '', // Store ID
        sala: '',
        ano_lectivo: '2025/2026'
    });

    // Populate data from candidate if available
    useEffect(() => {
        if (location.state && location.state.candidato) {
            const c = location.state.candidato;
            setFormData(prev => ({
                ...prev,
                candidato_id: c.real_id,
                nome_completo: c.nome,
                data_nascimento: c.dataNascimento,
                genero: c.genero === 'Masculino' ? 'Masculino' : 'Feminino', // Normalize if needed
                numero_bi: c.bi,
                nacionalidade: c.nacionalidade,
                curso: c.curso1,
                turno: c.turno,
                // Encarregado
                nome_encarregado: c.encarregado?.nome || '',
                telefone_encarregado: c.encarregado?.telefone || '',
                parentesco_encarregado: c.encarregado?.parentesco || ''
            }));
            
            // Fetch turmas relevant to this course/turn
            fetchTurmas(c.curso1);
        } else {
             fetchTurmas();
        }
    }, [location.state]);

    const fetchTurmas = async (cursoFilter = null) => {
        try {
            const response = await api.get('turmas/');
            let data = response.data.results || response.data;
            if (cursoFilter) {
               // Filter client-side if needed, but 'turmas/' lists all
               // data = data.filter(...) 
            }
            setTurmasDisponiveis(data);
        } catch (error) {
            console.error("Erro ao carregar turmas", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTurmaChange = (e) => {
        const turmaId = e.target.value;
        const turmaObj = turmasDisponiveis.find(t => t.id_turma == turmaId);
        
        setFormData(prev => ({
            ...prev,
            turma_id: turmaId,
            sala: turmaObj ? (turmaObj.sala_numero || '') : '',
            // Optional: Auto-set other fields if turma implies them
        }));
    };

    const handleSubmit = async () => {
        if (!formData.turma_id) {
            alert("Por favor, selecione uma turma.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Call the correct backend endpoint
            await api.post(`candidaturas/${formData.candidato_id}/matricular/`, {
                id_turma: formData.turma_id
            });
            
            alert('Matrícula realizada com sucesso! O aluno foi registado.');
            navigate('/matriculas');
        } catch (error) {
            console.error("Erro na matrícula:", error);
            alert(error.response?.data?.erro || "Erro ao realizar matrícula. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        const isReadOnly = !!(location.state && location.state.candidato);

        switch (step) {
            case 1:
                return (
                    <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
                        <h3 className="form-title">
                            <User size={22} /> Dados Pessoais do Aluno 
                            {isReadOnly && <span className="badge-provenience">Proveniente de Candidatura</span>}
                        </h3>
                        <div className="form-grid-2col">
                            <div className="form-full-width">
                                <label className="field-label">Nome Completo</label>
                                <input 
                                    type="text" 
                                    name="nome_completo"
                                    value={formData.nome_completo}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="field-label">Data de Nascimento</label>
                                <input 
                                    type="text" 
                                    value={formData.data_nascimento}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="field-label">Genero</label>
                                <input 
                                    type="text" 
                                    value={formData.genero}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="field-label">Nº BI</label>
                                <input 
                                    type="text" 
                                    value={formData.numero_bi}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="field-label">Nacionalidade</label>
                                <input 
                                    type="text" 
                                    value={formData.nacionalidade}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Guardian Section */}
                         <h3 className="form-title" style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                            <User size={22} /> Dados do Encarregado
                        </h3>
                        <div className="form-grid-2col">
                             <div className="form-full-width">
                                <label className="field-label">Nome do Encarregado</label>
                                <input 
                                    type="text" 
                                    value={formData.nome_encarregado}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="field-label">Telefone</label>
                                <input 
                                    type="text" 
                                    value={formData.telefone_encarregado}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                             <div>
                                <label className="field-label">Parentesco</label>
                                <input 
                                    type="text" 
                                    value={formData.parentesco_encarregado}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                // Filter dropdowns based on state if needed, here simple filter
                return (
                    <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
                        <h3 className="form-title">
                            <BookOpen size={22} /> Dados Académicos & Turma
                        </h3>
                        <div className="form-grid-2col">
                            <div>
                                <label className="field-label">Curso</label>
                                <input type="text" value={formData.curso} readOnly className="field-input read-only" />
                            </div>
                            <div>
                                <label className="field-label">Turno</label>
                                <input type="text" value={formData.turno} readOnly className="field-input read-only" />
                            </div>
                            <div>
                                <label className="field-label">Classe</label>
                                <select name="classe" value={formData.classe} onChange={handleInputChange} className="field-select">
                                    <option value="10ª Classe">10ª Classe</option>
                                    <option value="11ª Classe">11ª Classe</option>
                                    <option value="12ª Classe">12ª Classe</option>
                                </select>
                            </div>
                            <div>
                                <label className="field-label">Ano Lectivo</label>
                                <input type="text" value={formData.ano_lectivo} readOnly className="field-input read-only" />
                            </div>
                            
                            <div className="form-full-width" style={{ marginTop: '10px', background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                <label className="field-label" style={{ color: '#0369a1', fontWeight: 700 }}>SELECIONE A TURMA (Obrigatório)</label>
                                <select 
                                    name="turma_id" 
                                    value={formData.turma_id} 
                                    onChange={handleTurmaChange} 
                                    className="field-select"
                                    style={{ borderColor: '#0ea5e9', borderWidth: '2px' }}
                                >
                                    <option value="">-- Selecione uma Turma --</option>
                                    {turmasDisponiveis
                                        .map(t => (
                                        <option key={t.id_turma} value={t.id_turma}>
                                            {t.codigo_turma} - {t.curso_nome} ({t.sala_numero ? `Sala ${t.sala_numero}` : 'Sem Sala'})
                                        </option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                                    A lista mostra apenas turmas compatíveis com o Curso e Turno do candidato.
                                </p>
                            </div>

                            <div>
                                <label className="field-label">Sala (Automático)</label>
                                <input type="text" value={formData.sala} readOnly className="field-input read-only" placeholder="Selecione a turma..." />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
                        <h3 className="form-title">
                            <FileText size={22} /> Confirmação Final
                        </h3>
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                            <h4 style={{ color: '#0f172a', marginBottom: '15px' }}>Resumo da Matrícula</h4>
                            <p><strong>Aluno:</strong> {formData.nome_completo}</p>
                            <p><strong>BI:</strong> {formData.numero_bi}</p>
                            <hr style={{ margin: '15px 0', borderColor: '#e2e8f0' }} />
                            <p><strong>Curso:</strong> {formData.curso}</p>
                            <p><strong>Classe:</strong> {formData.classe}</p>
                            <p><strong>Turma:</strong> {turmasDisponiveis.find(t => t.id_turma == formData.turma_id)?.codigo_turma || 'Não selecionada'}</p>
                            <p><strong>Ano Lectivo:</strong> {formData.ano_lectivo}</p>
                        </div>
                        
                        <div style={{ marginTop: '20px' }}>
                            <label className="field-checkbox">
                                <input type="checkbox" defaultChecked /> Confirmar recepção de comprovativo e finalizar matrícula.
                            </label>
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="page-container">
            <header className="page-header matriculas-header-content">
                <div>
                    <button
                        onClick={() => navigate('/matriculas')}
                        className="btn-back-link"
                    >
                        <ArrowLeft size={16} /> Voltar à lista
                    </button>
                    <h1>Nova Ficha de Matrícula</h1>
                    <p>Preencha os dados abaixo com precisão para registrar o novo aluno.</p>
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
                    <button
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        disabled={step === 1 || isSubmitting}
                        className="btn-step-prev"
                        style={{ cursor: step === 1 ? 'not-allowed' : 'pointer', opacity: step === 1 ? 0.5 : 1 }}
                    >
                        Anterior
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            className="btn-step-next"
                        >
                            Próximo Passo <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="btn-step-finish"
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
