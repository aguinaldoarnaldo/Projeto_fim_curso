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
import { getClasses } from '../../services/classService';


import './Matriculas.css';

const NovaMatricula = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [turmasDisponiveis, setTurmasDisponiveis] = useState([]);
    const [classesDisponiveis, setClassesDisponiveis] = useState([]);
    
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
        classe: '',
        turno: '',
        turma_id: '', // Store ID
        sala: '',
        ano_lectivo: '2025/2026'
    });

    useEffect(() => {
        const loadClasses = async () => {
            try {
                const data = await getClasses();
                setClassesDisponiveis(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to load classes", error);
            }
        };
        loadClasses();
        const interval = setInterval(loadClasses, 3000);
        return () => clearInterval(interval);
    }, []);


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
        
        // Polling for Turmas
        const interval = setInterval(() => {
            // Respect existing filters if any (simplified here to refresh current view)
            fetchTurmas(location.state?.candidato?.curso1); 
        }, 3000);
        return () => clearInterval(interval);

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
            if (location.state && location.state.candidato) {
                // Matrícula via Candidatura (Fluxo Normal)
                await api.post(`candidaturas/${formData.candidato_id}/matricular/`, {
                    id_turma: formData.turma_id
                });
            } else {
                // Matrícula Direta / Transferência
                const payload = {
                    ...formData,
                    turma_id: formData.turma_id,
                    historico_escolar: isTransferido ? historicoEscolar : []
                };
                
                await api.post('matriculas/matricular_novo_aluno/', payload);
            }
            
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
                                    onChange={handleInputChange}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                    placeholder="Nome do Aluno"
                                />
                            </div>
                            <div>
                                <label className="field-label">Data de Nascimento (YYYY-MM-DD)</label>
                                <input 
                                    type="date" 
                                    name="data_nascimento"
                                    value={formData.data_nascimento}
                                    onChange={handleInputChange}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="field-label">Genero</label>
                                {isReadOnly ? (
                                    <input 
                                        type="text" 
                                        value={formData.genero} 
                                        readOnly 
                                        className="field-input read-only" 
                                    />
                                ) : (
                                    <select 
                                        name="genero" 
                                        value={formData.genero} 
                                        onChange={handleInputChange}
                                        className="field-select"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Feminino</option>
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="field-label">Nº BI</label>
                                <input 
                                    type="text" 
                                    name="numero_bi"
                                    value={formData.numero_bi}
                                    onChange={handleInputChange}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                    placeholder="000000000LA000"
                                />
                            </div>
                            <div>
                                <label className="field-label">Email</label>
                                <input 
                                    type="email" 
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleInputChange}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
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
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                    placeholder="923000000"
                                />
                            </div>

                            {/* Campos de Endereço (Novos/Editaveis) */}
                            <div>
                                <label className="field-label">Província</label>
                                <input 
                                    type="text" 
                                    name="provincia"
                                    value={formData.provincia || ''}
                                    onChange={handleInputChange}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
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
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                    placeholder="Lubango"
                                />
                            </div>
                            <div className="form-full-width">
                                <label className="field-label">Bairro / Endereço</label>
                                <input 
                                    type="text" 
                                    name="bairro"
                                    value={formData.bairro || ''}
                                    onChange={handleInputChange}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                    placeholder="Bairro da Mapunda"
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
                                    name="nome_encarregado"
                                    value={formData.nome_encarregado}
                                    onChange={handleInputChange}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="field-label">Telefone Encarregado</label>
                                <input 
                                    type="text" 
                                    name="telefone_encarregado"
                                    value={formData.telefone_encarregado}
                                    onChange={handleInputChange}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                             <div>
                                <label className="field-label">Parentesco</label>
                                <input 
                                    type="text" 
                                    name="parentesco_encarregado"
                                    value={formData.parentesco_encarregado}
                                    onChange={handleInputChange}
                                    readOnly={isReadOnly}
                                    className={`field-input ${isReadOnly ? 'read-only' : ''}`}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                const turmaSelect = turmasDisponiveis.find(t => t.id_turma == formData.turma_id);

                return (
                    <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
                        <h3 className="form-title">
                            <BookOpen size={22} /> Dados Académicos & Turma
                        </h3>

                        {!isReadOnly && (
                            <div className="switch-container" style={{ marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={isTransferido} 
                                        onChange={(e) => setIsTransferido(e.target.checked)}
                                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                                    />
                                    <span style={{ fontSize: '15px', fontWeight: '600' }}>Este aluno vem por transferência?</span>
                                </label>
                                {isTransferido && <p style={{ marginLeft: '28px', fontSize: '13px', color: '#64748b' }}>Habilita o preenchimento do histórico escolar.</p>}
                            </div>
                        )}

                        <div className="form-grid-2col">
                            <div>
                                <label className="field-label">Curso</label>
                                <input type="text" value={formData.curso || (turmaSelect ? turmaSelect.curso_nome : '')} readOnly className="field-input read-only" placeholder="Selecione a turma para definir" />
                            </div>
                            <div>
                                <label className="field-label">Turno ({formData.turno})</label>
                                <input type="text" value={formData.turno || (turmaSelect ? turmaSelect.turno : '')} readOnly className="field-input read-only" />
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
                            </div>

                            <div>
                                <label className="field-label">Ano Lectivo</label>
                                <input type="text" value={formData.ano_lectivo} readOnly className="field-input read-only" />
                            </div>
                        </div>

                        {/* Historico Section */}
                        {isTransferido && (
                            <div style={{ marginTop: '30px', borderTop: '2px dashed #cbd5e1', paddingTop: '20px' }}>
                                <h4 style={{ marginBottom: '15px', color: '#334155' }}>Histórico Escolar (Anos Anteriores)</h4>
                                
                                {/* Formulario de Adição */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr 100px auto', gap: '10px', alignItems: 'end', marginBottom: '15px', background: '#f1f5f9', padding: '15px', borderRadius: '8px' }}>
                                    <div>
                                        <label className="field-label" style={{fontSize:'12px'}}>Escola de Origem</label>
                                        <input type="text" className="field-input" placeholder="Ex: Escola 123" 
                                            value={historicoForm.escola} onChange={e => setHistoricoForm({...historicoForm, escola: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="field-label" style={{fontSize:'12px'}}>Classe</label>
                                        <input type="text" className="field-input" placeholder="Ex: 9ª"
                                            value={historicoForm.classe} onChange={e => setHistoricoForm({...historicoForm, classe: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="field-label" style={{fontSize:'12px'}}>Ano Lectivo</label>
                                        <input type="text" className="field-input" placeholder="Ex: 2024"
                                            value={historicoForm.ano} onChange={e => setHistoricoForm({...historicoForm, ano: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="field-label" style={{fontSize:'12px'}}>Média</label>
                                        <input type="number" className="field-input" placeholder="0-20"
                                            value={historicoForm.media} onChange={e => setHistoricoForm({...historicoForm, media: e.target.value})} />
                                    </div>
                                    <button type="button" onClick={addHistorico} className="btn-primary-action" style={{ padding: '10px', height: '42px' }}>
                                        + Add
                                    </button>
                                </div>

                                {/* Tabela Visual */}
                                {historicoEscolar.length > 0 ? (
                                    <table className="data-table" style={{ marginTop: '10px' }}>
                                        <thead>
                                            <tr>
                                                <th>Ano</th>
                                                <th>Classe</th>
                                                <th>Escola</th>
                                                <th>Média</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historicoEscolar.map(h => (
                                                <tr key={h.id}>
                                                    <td>{h.ano}</td>
                                                    <td>{h.classe}</td>
                                                    <td>{h.escola}</td>
                                                    <td>{h.media || '-'}</td>
                                                    <td>
                                                        <button type="button" onClick={() => removeHistorico(h.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>Nenhum histórico adicionado ainda.</p>
                                )}
                            </div>
                        )}
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
                            <p><strong>Turma:</strong> {turmasDisponiveis.find(t => t.id_turma == formData.turma_id)?.codigo_turma || 'Não selecionada'}</p>
                            <p><strong>Ano Lectivo:</strong> {formData.ano_lectivo}</p>
                            
                            {isTransferido && (
                                <div style={{ marginTop: '10px', padding: '10px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fcd34d' }}>
                                    <p style={{ color: '#b45309', fontWeight: '600', fontSize: '13px' }}>Aluno Transferido - {historicoEscolar.length} registros de histórico anexados.</p>
                                </div>
                            )}
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
