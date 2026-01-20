import React, { useState, useEffect } from 'react';
import { User, ClipboardList, BookOpen, GraduationCap, CheckCircle, Send, UploadCloud, CreditCard, Calendar, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Candidatura.css';

// Create a public API instance to bypass the interceptors that add the token.
// This ensures that the public candidacy form works even if the local storage contains an expired/invalid token.
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1/',
    headers: {
        'Content-Type': 'application/json',
    }
});

const Candidatura = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Form, 2: Confirm, 3: Payment, 4: Success
    const [loading, setLoading] = useState(false);
    const [createdCandidate, setCreatedCandidate] = useState(null);
    const [rupeData, setRupeData] = useState(null);
    const [cursosDisponiveis, setCursosDisponiveis] = useState([]);

    const [formData, setFormData] = useState({
        nome_completo: '',
        genero: '',
        data_nascimento: '',
        nacionalidade: 'Angolana',
        numero_bi: '',
        telefone: '',
        email: '',
        residencia: '',
        escola_proveniencia: 'Pública',
        nome_escola_origem: '', // frontend field mapping mismatch check
        municipio_escola: '',
        ano_conclusao: '',
        media_final: '',
        curso_primeira_opcao: '',
        curso_segunda_opcao: '',
        turno_preferencial: '',
        nome_encarregado: '',
        parentesco_encarregado: '',
        telefone_encarregado: ''
    });

    useEffect(() => {
        // Initial fetch
        fetchCourses();

        // Polling every 3 seconds for real-time updates
        const interval = setInterval(fetchCourses, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchCourses = () => {
        api.get('cursos/').then(res => {
            const data = res.data.results || res.data;
            // Only update if length changed or deep comparison (optional simplification here)
            // For now, React's virtual DOM handles the diffing reasonably well for small lists
            setCursosDisponiveis(data);
        }).catch(console.error);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        setStep(step + 1);
        window.scrollTo(0,0);
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData(prev => ({ ...prev, [name]: files[0] }));
    };

    const handleConfirmData = async () => {
        try {
            setLoading(true);
            
            // Create FormData for file upload
            // Create FormData for file upload
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                // Skip empty strings to match backend optional fields
                if (value !== null && value !== "" && value !== undefined) {
                   data.append(key, value);
                }
            });
            // Ensure media_final uses comma or dot correctly expected by backend, or just send as string, backend DecimalField handles it usually.
            
            const response = await api.post('candidaturas/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setCreatedCandidate(response.data);
            setStep(3); // Go to Payment
        } catch (error) {
            console.error("Erro ao enviar candidatura:", error);
            
            if (error.response?.data) {
                const errors = error.response.data;
                if (errors.numero_bi) {
                    alert(`ERRO: Já existe um candidato inscrito com este BI (${formData.numero_bi}).`);
                } else {
                     // Get first error message
                     const firstKey = Object.keys(errors)[0];
                     const msg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : JSON.stringify(errors[firstKey]);
                     alert(`Erro no campo '${firstKey}': ${msg}`);
                }
            } else {
                alert("Erro de conexão. Tente novamente mais tarde.");
            }
            
            setStep(1); // Go back to form to fix
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    const renderForm = () => (
        <form className="candidatura-form" onSubmit={handleNextStep}>
            <div className="form-section">
                <div className="section-title"><User size={24} /> Dados Pessoais</div>
                <div className="form-grid">
                    <div className="form-control full-width">
                        <label>Nome Completo</label>
                        <input name="nome_completo" value={formData.nome_completo} onChange={handleChange} required />
                    </div>
                    <div className="form-control">
                        <label>Género</label>
                        <select name="genero" value={formData.genero} onChange={handleChange} required>
                            <option value="">Selecione</option>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                        </select>
                    </div>
                    <div className="form-control">
                        <label>Data de Nascimento</label>
                        <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} required />
                    </div>
                    <div className="form-control">
                        <label>Nº do Bilhete (BI)</label>
                        <input name="numero_bi" value={formData.numero_bi} onChange={handleChange} required />
                    </div>
                    <div className="form-control">
                        <label>Nacionalidade</label>
                        <input name="nacionalidade" value={formData.nacionalidade} onChange={handleChange} />
                    </div>
                    <div className="form-control">
                        <label>Telefone</label>
                        <input name="telefone" value={formData.telefone} onChange={handleChange} required />
                    </div>
                     <div className="form-control">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-control full-width">
                        <label>Residência</label>
                        <input name="residencia" value={formData.residencia} onChange={handleChange} required />
                    </div>
                    
                    {/* Documents Upload Section */}
                     <div className="form-control full-width" style={{marginTop: '20px'}}>
                        <label className="section-subtitle"><UploadCloud size={16}/> Documentos Obrigatórios</label>
                     </div>
                    <div className="form-control">
                        <label>Foto Tipo Passe {formData.foto_passe && <span style={{color:'green', fontSize:'0.8em'}}>(Anexado)</span>}</label>
                        <input type="file" name="foto_passe" onChange={handleFileChange} accept="image/*" required={!formData.foto_passe} />
                    </div>
                     <div className="form-control">
                        <label>Cópia do BI {formData.comprovativo_bi && <span style={{color:'green', fontSize:'0.8em'}}>(Anexado)</span>}</label>
                        <input type="file" name="comprovativo_bi" onChange={handleFileChange} accept="image/*,application/pdf" required={!formData.comprovativo_bi} />
                    </div>
                     <div className="form-control">
                        <label>Certificado {formData.certificado && <span style={{color:'green', fontSize:'0.8em'}}>(Anexado)</span>}</label>
                        <input type="file" name="certificado" onChange={handleFileChange} accept="image/*,application/pdf" required={!formData.certificado} />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <div className="section-title"><BookOpen size={24} /> Dados Académicos (9ª Classe)</div>
                <div className="form-grid">
                    <div className="form-control">
                        <label>Nome da Escola</label>
                        <input name="escola_proveniencia" value={formData.escola_proveniencia} onChange={handleChange} required />
                    </div>
                    <div className="form-control">
                        <label>Município da Escola</label>
                        <input name="municipio_escola" value={formData.municipio_escola} onChange={handleChange} required />
                    </div>
                    <div className="form-control">
                        <label>Ano de Conclusão</label>
                        <input type="number" name="ano_conclusao" value={formData.ano_conclusao} onChange={handleChange} required />
                    </div>
                    <div className="form-control">
                        <label>Média Final</label>
                        <input type="number" name="media_final" value={formData.media_final} onChange={handleChange} required step="0.1" />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <div className="section-title"><GraduationCap size={24} /> Opções de Curso</div>
                <div className="form-grid">
                    <div className="form-control">
                        <label>1ª Opção</label>
                        <select name="curso_primeira_opcao" value={formData.curso_primeira_opcao} onChange={handleChange} required>
                            <option value="">Selecione</option>
                            {cursosDisponiveis.map(c => <option key={c.id_curso} value={c.id_curso}>{c.nome_curso}</option>)}
                        </select>
                    </div>
                    <div className="form-control">
                        <label>2ª Opção (Opcional)</label>
                        <select name="curso_segunda_opcao" value={formData.curso_segunda_opcao} onChange={handleChange}>
                            <option value="">Nenhuma</option>
                            {cursosDisponiveis.map(c => <option key={c.id_curso} value={c.id_curso}>{c.nome_curso}</option>)}
                        </select>
                    </div>
                    <div className="form-control">
                        <label>Turno</label>
                        <select name="turno_preferencial" value={formData.turno_preferencial} onChange={handleChange} required>
                            <option value="">Selecione</option>
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-section">
                <div className="section-title"><ClipboardList size={24} /> Encarregado</div>
                <div className="form-grid">
                    <div className="form-control full-width">
                        <label>Nome</label>
                        <input name="nome_encarregado" value={formData.nome_encarregado} onChange={handleChange} required />
                    </div>
                    <div className="form-control">
                        <label>Parentesco</label>
                        <input name="parentesco_encarregado" value={formData.parentesco_encarregado} onChange={handleChange} required />
                    </div>
                    <div className="form-control">
                        <label>Telefone</label>
                        <input name="telefone_encarregado" value={formData.telefone_encarregado} onChange={handleChange} required />
                    </div>
                </div>
            </div>

            <button type="submit" className="btn-submit-candidatura">Próximo: Confirmar Dados</button>
        </form>
    );

    const renderConfirm = () => (
        <div className="confirm-step">
            <h2>Confirme os seus dados</h2>
            <div className="review-container">
                <div className="review-section">
                    <h3><User size={18} /> Dados Pessoais</h3>
                    <div className="review-grid">
                        <p><strong>Nome:</strong> {formData.nome_completo}</p>
                        <p><strong>Género:</strong> {formData.genero === 'M' ? 'Masculino' : 'Feminino'}</p>
                        <p><strong>Nascimento:</strong> {formData.data_nascimento}</p>
                        <p><strong>Nacionalidade:</strong> {formData.nacionalidade}</p>
                        <p><strong>BI:</strong> {formData.numero_bi}</p>
                        <p><strong>Telefone:</strong> {formData.telefone}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Residência:</strong> {formData.residencia}</p>
                    </div>
                </div>

                <div className="review-section">
                    <h3><BookOpen size={18} /> Dados Académicos</h3>
                    <div className="review-grid">
                        <p><strong>Escola:</strong> {formData.escola_proveniencia}</p>
                        <p><strong>Município:</strong> {formData.municipio_escola}</p>
                        <p><strong>Ano Conclusão:</strong> {formData.ano_conclusao}</p>
                        <p><strong>Média Final:</strong> {formData.media_final}</p>
                    </div>
                </div>

                <div className="review-section">
                    <h3><GraduationCap size={18} /> Cursos Escolhidos</h3>
                    <div className="review-grid">
                        <p><strong>1ª Opção:</strong> {cursosDisponiveis.find(c => c.id_curso == formData.curso_primeira_opcao)?.nome_curso || 'Não selecionado'}</p>
                        <p><strong>2ª Opção:</strong> {formData.curso_segunda_opcao ? cursosDisponiveis.find(c => c.id_curso == formData.curso_segunda_opcao)?.nome_curso : 'Nenhuma'}</p>
                        <p><strong>Turno:</strong> {formData.turno_preferencial}</p>
                    </div>
                </div>

                <div className="review-section">
                    <h3><ClipboardList size={18} /> Encarregado</h3>
                    <div className="review-grid">
                        <p><strong>Nome:</strong> {formData.nome_encarregado}</p>
                        <p><strong>Parentesco:</strong> {formData.parentesco_encarregado}</p>
                        <p><strong>Telefone:</strong> {formData.telefone_encarregado}</p>
                    </div>
                </div>

                <div className="review-section">
                    <h3><UploadCloud size={18} /> Documentos</h3>
                    <div className="review-docs">
                        <span className={formData.foto_passe ? 'doc-ok' : 'doc-missing'}>Foto Passe: {formData.foto_passe ? 'Anexado' : 'Falta'}</span>
                        <span className={formData.comprovativo_bi ? 'doc-ok' : 'doc-missing'}>Cópia BI: {formData.comprovativo_bi ? 'Anexado' : 'Falta'}</span>
                        <span className={formData.certificado ? 'doc-ok' : 'doc-missing'}>Certificado: {formData.certificado ? 'Anexado' : 'Falta'}</span>
                    </div>
                </div>
            </div>

            <div className="steps-actions">
                <button className="btn-back" onClick={() => setStep(1)}>
                    <User size={16} /> Voltar e Corrigir
                </button>
                <button className="btn-submit-candidatura" onClick={handleConfirmData} disabled={loading}>
                    {loading ? 'Enviando...' : 'Confirmar Tudo e Inscrever'}
                </button>
            </div>
        </div>
    );

    const renderPayment = () => {
        if (!rupeData) {
            // Auto generate RUPE on mount of this step usually, but button for now
            return (
                <div className="payment-step">
                    <h2>Inscrição Realizada: #{createdCandidate?.numero_inscricao}</h2>
                    <p>Para concluir, gere o RUPE e proceda ao pagamento.</p>
                    <button className="btn-submit-candidatura" onClick={handleGenerateRupe} disabled={loading}>
                        {loading ? 'Gerando...' : 'Gerar RUPE'}
                    </button>
                </div>
            );
        }
        return (
            <div className="payment-step">
                <h2>Pagamento do RUPE</h2>
                <div className="rupe-card">
                    <div className="rupe-header">
                        REFERÊNCIA ÚNICA DE PAGAMENTO AO ESTADO
                    </div>
                    <div className="rupe-body">
                        <div className="rupe-row">
                            <span>Referência:</span>
                            <strong>{rupeData.referencia}</strong>
                        </div>
                        <div className="rupe-row">
                            <span>Valor a Pagar:</span>
                            <strong>{rupeData.valor} Kz</strong>
                        </div>
                        <div className="rupe-row">
                            <span>Estado:</span>
                            <span className="badge-pending">Pendente</span>
                        </div>
                    </div>
                </div>
                <p className="payment-hint">Dirija-se a um multicaixa ou use o Internet Banking para pagar.</p>
                
                <button className="btn-pay-simulate" onClick={handleSimulatePayment}>
                    <CreditCard size={18} /> Simular Pagamento (Demo)
                </button>
            </div>
        );
    };

    const renderSuccess = () => (
        <div className="success-step">
            <CheckCircle size={80} className="success-icon" />
            <h2>Tudo Pronto!</h2>
            <p>O seu pagamento foi confirmado.</p>
            
            <div className="exam-card">
                <h3><Calendar size={20}/> Agendamento do Exame</h3>
                <p><strong>Data:</strong> 25 de Janeiro de 2026</p>
                <p><strong>Hora:</strong> 08:00</p>
                <p><strong>Sala:</strong> Sala 12 (Bloco Administrativo)</p>
                <p className="warning-text">Traga o seu Bilhete de Identidade e o Comprovativo de Inscrição.</p>
            </div>

            <button className="btn-home" onClick={() => window.location.reload()}>Nova Inscrição</button>
        </div>
    );

    const [activeTab, setActiveTab] = useState('register'); // 'register' or 'consult'
    const [consultTerm, setConsultTerm] = useState('');
    const [consultResult, setConsultResult] = useState(null);

    const handleConsultStatus = async (e) => {
        e.preventDefault();
        if (!consultTerm) return;
        setLoading(true);
        try {
            const response = await api.get(`candidaturas/consultar_status/?q=${consultTerm}`);
            setConsultResult(response.data);
        } catch (err) {
            console.error("Erro ao consultar:", err);
            setConsultResult(null);
            alert("Candidatura não encontrada. Verifique o número de inscrição ou BI.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRupe = async () => {
        if (!createdCandidate) return;
        setLoading(true);
        try {
            const response = await api.post(`candidaturas/${createdCandidate.id_candidato}/gerar_rupe/`);
            setRupeData(response.data);
        } catch (error) {
            console.error("Erro ao gerar RUPE:", error);
            alert("Erro ao gerar RUPE. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleSimulatePayment = async () => {
        if (!createdCandidate) return;
        setLoading(true);
        try {
            const response = await api.post(`candidaturas/${createdCandidate.id_candidato}/simular_pagamento/`);
            alert(response.data.mensagem);
            setStep(4); // Success
        } catch (error) {
            console.error("Erro no pagamento:", error);
            alert("Erro ao processar pagamento.");
        } finally {
            setLoading(false);
        }
    };

    const renderConsultation = () => (
        <div className="consultation-section">
             <form onSubmit={handleConsultStatus} className="consult-search-box">
                <div className="form-control" style={{flex: 1}}>
                    <input 
                        placeholder="Digite o Nº de Inscrição (ex: INS20260001) ou BI" 
                        value={consultTerm}
                        onChange={(e) => setConsultTerm(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="consult-btn" disabled={loading}>
                    {loading ? 'Buscando...' : <><Search size={18} /> Consultar</>}
                </button>
             </form>

             {consultResult && (
                 <div className="status-result-card">
                     <div className="section-title">
                        <User size={20} /> {consultResult.nome_completo}
                     </div>
                     <div className="form-grid">
                        <div>
                            <label className="field-label">Estado da Candidatura</label>
                            <span className={`status-badge status-${consultResult.status === 'Pendente' ? 'pending' : consultResult.status === 'Aprovado' ? 'approved' : 'rejected'}`} style={{display: 'inline-block', marginTop: '5px'}}>
                                {consultResult.status}
                            </span>
                        </div>
                        <div>
                            <label className="field-label">Número de Inscrição</label>
                            <p style={{fontWeight: 'bold'}}>{consultResult.numero_inscricao}</p>
                        </div>
                        <div>
                            <label className="field-label">Curso (1ª Opção)</label>
                            <p>{consultResult.curso1_nome || 'N/A'}</p>
                        </div>
                        {consultResult.nota_exame && (
                            <div>
                                <label className="field-label">Nota do Exame</label>
                                <p style={{fontWeight: 'bold', color: '#1e3a8a'}}>{consultResult.nota_exame} Val.</p>
                            </div>
                        )}
                     </div>
                     
                     {/* If accepted, show next steps hint */}
                     {consultResult.status === 'Aprovado' && (
                         <div style={{marginTop: '20px', padding: '15px', background: '#dcfce7', borderRadius: '8px', color: '#166534'}}>
                             <CheckCircle size={16} style={{marginRight: '8px', verticalAlign: 'middle'}}/>
                             <strong>Parabéns!</strong> Você foi aprovado. Dirija-se à secretaria para efetuar a matrícula.
                         </div>
                     )}
                 </div>
             )}
        </div>
    );

    return (
        <div className="candidatura-page">
            <div className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <div className="hero-logo">Mutue Education</div>
                    <h1 className="hero-title">Portal de Admissão 2026</h1>
                    <p className="hero-description">Inscreva-se agora para garantir o seu futuro. Processo 100% digital, rápido e seguro.</p>
                    
                    <div className="tab-container">
                        <button 
                            className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                            onClick={() => setActiveTab('register')}
                        >
                            Nova Inscrição
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'consult' ? 'active' : ''}`}
                            onClick={() => setActiveTab('consult')}
                        >
                            Consultar Estado
                        </button>
                    </div>
                </div>
            </div>

            <div className="main-card-container">
                {activeTab === 'register' ? (
                    <>
                        <div className="card-title">
                            {step === 1 && 'Ficha de Inscrição Online'}
                            {step === 2 && 'Confirmação de Dados'}
                            {step === 3 && 'Pagamento e Validação'}
                            {step === 4 && 'Inscrição Concluída'}
                        </div>
                        
                        {/* Stepper only for registration */}
                         <div className="stepper">
                            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                            <div className="step-line"></div>
                            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                            <div className="step-line"></div>
                            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                            <div className="step-line"></div>
                            <div className={`step-dot ${step >= 4 ? 'active' : ''}`}>4</div>
                        </div>

                        {step === 1 && renderForm()}
                        {step === 2 && renderConfirm()}
                        {step === 3 && renderPayment()}
                        {step === 4 && renderSuccess()}
                    </>
                ) : (
                    <>
                        <div className="card-title">Consultar Situação da Candidatura</div>
                        <p style={{marginBottom: '20px', color: '#64748b'}}>
                            Acompanhe o estado da sua inscrição, verifique notas de exame e instruções de matrícula.
                        </p>
                        {renderConsultation()}
                    </>
                )}
            </div>
        </div>
    );
};

export default Candidatura;
