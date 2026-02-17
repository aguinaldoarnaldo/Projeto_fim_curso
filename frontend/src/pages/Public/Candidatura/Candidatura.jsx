import React, { useState, useEffect } from 'react';
import { User, ClipboardList, BookOpen, GraduationCap, CheckCircle, Send, UploadCloud, CreditCard, Calendar, Search, AlertTriangle, History, RefreshCcw } from 'lucide-react';
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

import { useConfig } from '../../../context/ConfigContext';

const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        if (!targetDate) return null;
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            return { expired: true };
        }
        return timeLeft;
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft || timeLeft.expired) return null;

    return (
        <div className="countdown-timer" style={{
            display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px',
            background: 'rgba(255, 255, 255, 0.1)', padding: '15px', borderRadius: '12px',
            backdropFilter: 'blur(5px)', border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
            {Object.keys(timeLeft).map((interval) => (
                <div key={interval} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'white' }}>
                        {timeLeft[interval].toString().padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '1px' }}>
                        {interval === 'days' ? 'Dias' : interval === 'hours' ? 'Horas' : interval === 'minutes' ? 'Min' : 'Seg'}
                    </div>
                </div>
            ))}
        </div>
    );
};

const Candidatura = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Form, 2: Confirm, 3: Payment, 4: Success
    const [loading, setLoading] = useState(false);
    const [createdCandidate, setCreatedCandidate] = useState(null);
    const [rupeData, setRupeData] = useState(null);
    const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
    

    
    // Config State (Global)
    const { config, fetchConfig: refreshConfig } = useConfig();
    const [checkingConfig, setCheckingConfig] = useState(false);

    const [formData, setFormData] = useState({
        nome_completo: '',
        genero: '',
        data_nascimento: '',
        nacionalidade: 'Angolana',
        numero_bi: '',
        telefone: '',
        email: '',
        provincia: '',
        municipio: '',
        residencia: '', // Bairro / Endereço
        nome_escola_origem: '', // frontend field mapping mismatch check
        municipio_escola: '',
        ano_conclusao: '',
        media_final: '',
        curso_primeira_opcao: '',
        curso_segunda_opcao: '',
        turno_preferencial: '',
        nome_encarregado: '',
        parentesco_encarregado: '',
        telefone_encarregado: '',
        email_encarregado: '',
        numero_bi_encarregado: ''
    });

    useEffect(() => {
        // Initial fetch

        fetchCourses();
        refreshConfig();

        // Polling every 30 seconds for real-time updates
        const interval = setInterval(() => {
            refreshConfig();
        }, 30000);
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
            // Ensure media_final uses comma or dot correctly expected by backend, or just send as string, backend DecimalField
            
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

    const handleDownloadComprovativo = async (id) => {
        try {
            // Using local 'api' instance which is pre-configured without auth interceptors
            const response = await api.get(`candidaturas/${id}/download_comprovativo/`, {
                responseType: 'blob', // Important for PDF
            });
            
            // Create Blob URL
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Comprovativo_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Erro ao baixar comprovativo", error);
            alert("Erro ao baixar documento. Tente novamente.");
        }
    };

    // Render Steps
    const renderForm = () => {
        if (!config.candidaturas_abertas) {
            return (
                <div style={{textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0'}}>
                    <div style={{marginBottom: '20px', color: '#ef4444'}}>
                        <ClipboardList size={64} />
                    </div>
                    <h2 style={{color: '#1e293b', marginBottom: '16px'}}>Inscrições Encerradas</h2>
                    <p style={{color: '#64748b', fontSize: '18px', maxWidth: '600px', margin: '0 auto'}}>
                        {config.mensagem_candidaturas_fechadas || "As candidaturas não estão disponíveis no momento. Por favor, tente novamente mais tarde."}
                    </p>
                </div>
            );
        }

        return (
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
                        <input name="nacionalidade" value={formData.nacionalidade} onChange={handleChange} placeholder="Ex: Angolana" />
                    </div>

                    {/* Novo Campo Solicitado */}
                    <div className="form-control">
                        <label>Naturalidade (Local de Nascimento)</label>
                        <input name="naturalidade" value={formData.naturalidade || ''} onChange={handleChange} placeholder="Ex: Luanda" />
                    </div>

                    {/* Novo Campo Solicitado */}
                    <div className="form-control">
                        <label>Portador de Deficiência?</label>
                        <select name="deficiencia" value={formData.deficiencia || 'Não'} onChange={handleChange} required>
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                        </select>
                    </div>

                    <div className="form-control">
                        <label>Telefone</label>
                        <input name="telefone" value={formData.telefone} onChange={handleChange} required placeholder="Ex: 946464376"/>
                    </div>
                     <div className="form-control">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Ex: aguinaldoarnaldo5@gmail.com"/>
                    </div>
                    <div className="form-control">
                        <label>Província</label>
                        <input name="provincia" value={formData.provincia} onChange={handleChange} required placeholder="Ex: Luanda" />
                    </div>
                    <div className="form-control">
                        <label>Município</label>
                        <input name="municipio" value={formData.municipio} onChange={handleChange} required placeholder="Ex: Sequele" />
                    </div>
                    <div className="form-control full-width">
                        <label>Bairro / Endereço</label>
                        <input name="residencia" value={formData.residencia} onChange={handleChange} required placeholder="Ex: Bairro Vidrul" />
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
                        <label>Tipo de Escola</label>
                        <select name="tipo_escola" value={formData.tipo_escola || 'Pública'} onChange={handleChange} required>
                            <option value="Pública">Pública</option>
                            <option value="Privada">Privada</option>
                        </select>
                    </div>
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
                    {/* 
                    <div className="form-control">
                        <label>Turno (Período)</label>
                        <select name="turno_preferencial" value={formData.turno_preferencial} onChange={handleChange} required>
                            <option value="">Selecione</option>
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                        </select>
                    </div> 
                    */}
                </div>
            </div>

            <div className="form-section">
                <div className="section-title"><ClipboardList size={24} /> Encarregado de Educação</div>
                <div className="form-grid">
                    <div className="form-control full-width">
                        <label>Nome Completo do Encarregado</label>
                        <input name="nome_encarregado" value={formData.nome_encarregado} onChange={handleChange} required />
                    </div>
                    <div className="form-control">
                        <label>Grau de Parentesco</label>
                        <select name="parentesco_encarregado" value={formData.parentesco_encarregado} onChange={handleChange} required>
                            <option value="">Selecione</option>
                            <option value="Pai">Pai</option>
                            <option value="Mãe">Mãe</option>
                            <option value="Tio(a)">Tio(a)</option>
                            <option value="Irmão(ã)">Irmão(ã)</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div className="form-control">
                        <label>Nº do Bilhete (Encarregado)</label>
                        <input name="numero_bi_encarregado" value={formData.numero_bi_encarregado || ''} onChange={handleChange} required placeholder="Ex: 006475839LA045" />
                    </div>
                    <div className="form-control">
                        <label>Telefone Principal</label>
                        <input name="telefone_encarregado" value={formData.telefone_encarregado} onChange={handleChange} required placeholder="Ex: 923456789" />
                    </div>
                    <div className="form-control">
                        <label>Telefone Alternativo (Opcional)</label>
                        <input name="telefone_alternativo_encarregado" value={formData.telefone_alternativo_encarregado || ''} onChange={handleChange} placeholder="Ex: 998765432" />
                    </div>
                    <div className="form-control">
                        <label>Email (Opcional)</label>
                        <input type="email" name="email_encarregado" value={formData.email_encarregado || ''} onChange={handleChange} placeholder="Ex: encarregado@email.com" />
                    </div>
                    <div className="form-control">
                        <label>Profissão</label>
                        <input name="profissao_encarregado" value={formData.profissao_encarregado || ''} onChange={handleChange} placeholder="Ex: Professor" />
                    </div>
                    <div className="form-control full-width">
                        <label>Residência do Encarregado</label>
                        <input name="residencia_encarregado" value={formData.residencia_encarregado || ''} onChange={handleChange} required placeholder="Ex: Bairro Vidrul, Rua 5" />
                    </div>
                </div>
            </div>

            <button type="submit" className="btn-submit-candidatura">Próximo: Confirmar Dados</button>
        </form>
    );
    };

    const renderConfirm = () => (
        <div className="confirm-step">
            <h2 className="card-title">Confirme os seus dados</h2>
            <div className="review-container">
                <div className="review-section">
                    <h3><User size={18} /> Dados Pessoais</h3>
                    <div className="review-grid">
                        <p><strong>Nome Completo</strong> <span>{formData.nome_completo}</span></p>
                        <p><strong>Género</strong> <span>{formData.genero === 'M' ? 'Masculino' : 'Feminino'}</span></p>
                        <p><strong>Nascimento</strong> <span>{formData.data_nascimento}</span></p>
                        <p><strong>Nacionalidade</strong> <span>{formData.nacionalidade}</span></p>
                        <p><strong>Naturalidade</strong> <span>{formData.naturalidade || 'N/A'}</span></p>
                        <p><strong>Deficiência</strong> <span>{formData.deficiencia || 'Não'}</span></p>
                        <p><strong>Nº Bilhete (BI)</strong> <span>{formData.numero_bi}</span></p>
                        <p><strong>Telefone</strong> <span>{formData.telefone}</span></p>
                        <p><strong>Email</strong> <span>{formData.email}</span></p>
                        <p><strong>Província</strong> <span>{formData.provincia}</span></p>
                        <p><strong>Município</strong> <span>{formData.municipio}</span></p>
                        <p><strong>Endereço</strong> <span>{formData.residencia}</span></p>
                    </div>
                </div>

                <div className="review-section">
                    <h3><BookOpen size={18} /> Dados Académicos</h3>
                    <div className="review-grid">
                        <p><strong>Tipo de Escola</strong> <span>{formData.tipo_escola || 'Pública'}</span></p>
                        <p><strong>Escola</strong> <span>{formData.escola_proveniencia}</span></p>
                        <p><strong>Município Escola</strong> <span>{formData.municipio_escola}</span></p>
                        <p><strong>Ano Conclusão</strong> <span>{formData.ano_conclusao}</span></p>
                        <p><strong>Média Final</strong> <span>{formData.media_final} Val.</span></p>
                    </div>
                </div>

                <div className="review-section">
                    <h3><GraduationCap size={18} /> Opções de Curso</h3>
                    <div className="review-grid">
                        <p><strong>1ª Opção</strong> <span>{cursosDisponiveis.find(c => c.id_curso == formData.curso_primeira_opcao)?.nome_curso || 'Não selecionado'}</span></p>
                        <p><strong>2ª Opção</strong> <span>{formData.curso_segunda_opcao ? cursosDisponiveis.find(c => c.id_curso == formData.curso_segunda_opcao)?.nome_curso : 'Nenhuma'}</span></p>
                        {/* <p><strong>Turno</strong> <span>{formData.turno_preferencial}</span></p> */}
                    </div>
                </div>

                <div className="review-section">
                    <h3><ClipboardList size={18} /> Encarregado de Educação</h3>
                    <div className="review-grid">
                        <p><strong>Nome Completo</strong> <span>{formData.nome_encarregado || 'N/A'}</span></p>
                        <p><strong>Parentesco</strong> <span>{formData.parentesco_encarregado || 'N/A'}</span></p>
                        <p><strong>Nº Bilhete</strong> <span>{formData.numero_bi_encarregado || 'N/A'}</span></p>
                        <p><strong>Telefone Principal</strong> <span>{formData.telefone_encarregado || 'N/A'}</span></p>
                        <p><strong>Email</strong> <span>{formData.email_encarregado || 'N/A'}</span></p>
                        <p><strong>Residência</strong> <span>{formData.residencia_encarregado || 'N/A'}</span></p>
                    </div>
                </div>

                <div className="review-section">
                    <h3><UploadCloud size={18} /> Documentos Anexados</h3>
                    <div className="review-docs">
                        <span className={formData.foto_passe ? 'doc-ok' : 'doc-missing'}>
                            {formData.foto_passe ? <CheckCircle size={14}/> : <X size={14}/>} Foto Passe: {formData.foto_passe ? 'OK' : 'Falta'}
                        </span>
                        <span className={formData.comprovativo_bi ? 'doc-ok' : 'doc-missing'}>
                             {formData.comprovativo_bi ? <CheckCircle size={14}/> : <X size={14}/>} Cópia BI: {formData.comprovativo_bi ? 'OK' : 'Falta'}
                        </span>
                        <span className={formData.certificado ? 'doc-ok' : 'doc-missing'}>
                             {formData.certificado ? <CheckCircle size={14}/> : <X size={14}/>} Certificado: {formData.certificado ? 'OK' : 'Falta'}
                        </span>
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
            return (
                <div className="payment-step" style={{textAlign: 'center', padding: '40px 0'}}>
                    <div style={{
                        width: '80px', height: '80px', background: '#eff6ff', 
                        borderRadius: '50%', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', margin: '0 auto 24px', color: '#2563eb'
                    }}>
                        <ClipboardList size={40}/>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                        Inscrição Iniciada!
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '400px', margin: '0 auto 32px' }}>
                        A sua pré-inscrição sob o nº <strong style={{color: '#0f172a'}}>#{createdCandidate?.numero_inscricao}</strong> foi recebida.
                        Para validar, gere a referência de pagamento e proceda à liquidação.
                    </p>
                    <button 
                        className="btn-submit-candidatura" 
                        onClick={handleGenerateRupe} 
                        disabled={loading}
                        style={{ maxWidth: '300px', margin: '0 auto' }}
                    >
                        {loading ? 'Processando Documento...' : 'Gerar Referência de Pagamento'}
                    </button>
                    <p style={{fontSize: '13px', color: '#94a3b8', marginTop: '16px'}}>
                        Este processo é oficial e gerado pelo sistema.
                    </p>
                </div>
            );
        }

        return (
            <div className="payment-step">
                <div style={{textAlign: 'center', marginBottom: '32px'}}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Pagamento da Taxa</h2>
                    <p style={{ color: '#64748b' }}>Utilize os dados abaixo para efectuar o pagamento via Multicaixa ou Internet Banking.</p>
                </div>

                <div className="rupe-card" style={{
                    background: 'white',
                    borderRadius: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    maxWidth: '450px',
                    margin: '0 auto'
                }}>
                    <div className="rupe-header" style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                        padding: '24px',
                        color: 'white',
                        textAlign: 'center'
                    }}>
                        <div style={{fontSize: '12px', letterSpacing: '2px', opacity: 0.8, marginBottom: '8px'}}>DOCUMENTO DE PAGAMENTO</div>
                        <div style={{fontSize: '20px', fontWeight: '700'}}>RUPE</div>
                    </div>
                    <div className="rupe-body" style={{padding: '32px'}}>
                        <div style={{marginBottom: '24px'}}>
                            <span style={{display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px'}}>ENTIDADE</span>
                            <strong style={{display: 'block', fontSize: '18px', color: '#1e293b'}}>ESCOLA X (SIGLA)</strong>
                        </div>
                        <div style={{marginBottom: '24px'}}>
                            <span style={{display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px'}}>REFERÊNCIA DE PAGAMENTO</span>
                            <div style={{
                                background: '#f1f5f9', 
                                padding: '16px', 
                                borderRadius: '12px', 
                                fontSize: '22px', 
                                fontWeight: '800', 
                                color: '#334155',
                                letterSpacing: '1px',
                                textAlign: 'center',
                                border: '2px dashed #cbd5e1'
                            }}>
                                {rupeData.referencia}
                            </div>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '24px'}}>
                            <span style={{fontSize: '14px', color: '#64748b'}}>Total a Pagar</span>
                            <strong style={{fontSize: '28px', color: '#2563eb', fontWeight: '800'}}>{parseFloat(rupeData.valor).toLocaleString()} Kz</strong>
                        </div>
                    </div>
                    <div style={{background: '#f8fafc', padding: '16px', textAlign: 'center', borderTop: '1px solid #e2e8f0'}}>
                        <div style={{display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#d97706', fontWeight: '600', background: '#fffbeb', padding: '6px 12px', borderRadius: '20px'}}>
                            <div style={{width: '8px', height: '8px', background: '#d97706', borderRadius: '50%'}}></div>
                            Aguardando Pagamento
                        </div>
                    </div>
                </div>

                <div style={{maxWidth: '450px', margin: '32px auto 0', textAlign: 'left', background: '#fffbeb', padding: '20px', borderRadius: '16px', border: '1px solid #fde68a'}}>
                    <div style={{display: 'flex', gap: '12px', marginBottom: '16px'}}>
                        <AlertTriangle size={20} color="#d97706" />
                        <h4 style={{fontSize: '15px', fontWeight: '700', color: '#92400e', margin: 0}}>Atenção ao Prazo e Pagamento</h4>
                    </div>
                    <ul style={{fontSize: '13px', color: '#92400e', paddingLeft: '20px', margin: 0}}>
                        <li style={{marginBottom: '8px'}}>Esta referência <strong>expira em 48 horas</strong>. Se não pagar a tempo, terá de gerar uma nova.</li>
                        <li style={{marginBottom: '8px'}}>Pode pagar no <strong>ATM (Multicaixa)</strong>: Escolha Pagamentos {'>'} Pagamentos ao Estado {'>'} RUPE.</li>
                        <li>Introduza a referência e o montante exatos. O sistema confirma automaticamente.</li>
                    </ul>
                </div>

                <div style={{maxWidth: '450px', margin: '24px auto 0', textAlign: 'center'}}>
                    <p className="payment-hint" style={{fontSize: '14px', color: '#94a3b8', marginBottom: '16px'}}>
                        O sistema irá confirmar automaticamente após a transação.
                    </p>
                    
                    <button 
                        className="btn-pay-simulate" 
                        onClick={handleSimulatePayment}
                        style={{
                            background: 'white',
                            border: '2px solid #2563eb',
                            color: '#2563eb',
                            padding: '16px',
                            fontWeight: '700',
                            borderRadius: '16px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <CreditCard size={20} /> Simular Pagamento em Tempo Real
                    </button>
                </div>
            </div>
        );
    };

    const renderSuccess = () => (
        <div className="success-step" style={{textAlign: 'center', padding: '20px 0'}}>
            <div style={{
                width: '100px', height: '100px', background: '#dcfce7', 
                borderRadius: '50%', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', margin: '0 auto 24px', color: '#16a34a',
                boxShadow: '0 10px 30px -10px rgba(22, 163, 74, 0.4)'
            }}>
                <CheckCircle size={50} strokeWidth={3} />
            </div>
            
            <h2 style={{fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px'}}>Tudo Pronto!</h2>
            <p style={{fontSize: '18px', color: '#64748b', maxWidth: '500px', margin: '0 auto 40px'}}>
                A sua inscrição foi confirmada com sucesso. Prepare-se para o exame de admissão.
            </p>
            
            <div className="exam-card" style={{
                background: 'white',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                maxWidth: '500px',
                margin: '0 auto 40px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)',
                textAlign: 'left'
            }}>
                <div style={{
                    background: '#1e293b', 
                    padding: '24px', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <span style={{color: '#94a3b8', fontSize: '12px', letterSpacing: '1px'}}>CONVOCATÓRIA</span>
                        <h3 style={{color: 'white', margin: 0, fontSize: '20px'}}>Exame de Admissão</h3>
                    </div>
                    <Calendar size={28} color="#60a5fa" />
                </div>
                <div style={{padding: '30px'}}>
                    
                    <div style={{display: 'flex', justifyContent: 'center', marginBottom: '24px'}}>
                         <button 
                            onClick={() => handleDownloadComprovativo(createdCandidate?.id_candidato || createdCandidate?.id)}
                            className="btn-secondary-action"
                            style={{
                                background: 'white',
                                color: '#1e40af',
                                border: '1px solid #1e40af',
                                padding: '12px 24px',
                                borderRadius: '50px',
                                fontWeight: '600',
                                fontSize: '16px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <ClipboardList size={18} /> Baixar Comprovativo
                        </button>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
                        <div>
                            <span style={{fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px'}}>DATA & HORA</span>
                            <strong style={{fontSize: '16px', color: '#334155'}}>
                                {new Date() < new Date(config.data_fim_candidatura) 
                                    ? "Disponível em breve" 
                                    : (createdCandidate?.exame_data ? new Date(createdCandidate.exame_data).toLocaleString() : "A definir")}
                            </strong>
                        </div>
                        <div>
                            <span style={{fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px'}}>LOCAL</span>
                            <strong style={{fontSize: '16px', color: '#334155'}}>
                                {new Date() < new Date(config.data_fim_candidatura) 
                                    ? "Consultar no portal" 
                                    : (createdCandidate?.exame_sala || "A definir")}
                            </strong>
                        </div>
                    </div>
                
                    <div style={{
                        background: '#fff1f2', 
                        border: '1px dashed #fda4af', 
                        borderRadius: '12px', 
                        padding: '16px',
                        display: 'flex',
                        gap: '12px'
                    }}>
                        <div style={{color: '#be123c', marginTop: '2px'}}><ClipboardList size={20} /></div>
                        <div>
                            <span style={{fontWeight: '700', color: '#9f1239', fontSize: '14px'}}>Documentos Obrigatórios</span>
                            <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#be123c'}}>
                                Para aceder à sala de exame, deverá apresentar o seu Bilhete de Identidade original e o comprovativo desta inscrição.
                            </p>
                        </div>
                    </div>
                </div>
                </div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <button 
                    onClick={() => handleDownloadComprovativo(createdCandidate?.id_candidato || createdCandidate?.id)}
                    className="btn-secondary-action"
                    style={{
                        background: 'white',
                        color: '#1e40af',
                        border: '1px solid #1e40af',
                        padding: '12px 24px',
                        borderRadius: '50px',
                        fontWeight: '600',
                        fontSize: '16px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginRight: '12px'
                    }}
                >
                    <ClipboardList size={18} /> Baixar Comprovativo
                </button>
            </div>

            <button 
                className="btn-home" 
                onClick={() => window.location.reload()}
                style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '50px',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                Realizar Nova Inscrição
            </button>
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
                     <div className="section-title" style={{border: 'none', marginBottom: '32px'}}>
                        <div style={{
                            width: '56px', 
                            height: '56px', 
                            background: 'var(--p-primary)', 
                            borderRadius: '16px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'white',
                            boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)'
                        }}>
                             <User size={28} />
                        </div>
                        <div>
                            <h3 style={{fontSize: '22px', margin: 0}}>{consultResult.nome_completo}</h3>
                            <p style={{fontSize: '14px', color: 'var(--p-text-muted)', margin: '4px 0 0 0'}}>Estado atual do processo</p>
                        </div>
                     </div>
                     
                     <div className="review-grid" style={{background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9'}}>
                        <div>
                            <strong>Estado da Candidatura</strong>
                            <span className={`status-badge status-${consultResult.status === 'Pendente' ? 'pending' : consultResult.status === 'Aprovado' ? 'approved' : 'rejected'}`} style={{display: 'inline-block', marginTop: '8px'}}>
                                {consultResult.status}
                            </span>
                        </div>
                        <div>
                            <strong>Número de Inscrição</strong>
                            <p style={{fontWeight: '700', fontSize: '18px', margin: '8px 0 0 0', color: 'var(--p-primary)'}}>{consultResult.numero_inscricao}</p>
                        </div>
                        <div>
                            <strong>Curso Selecionado</strong>
                            <p style={{margin: '8px 0 0 0', fontWeight: '600'}}>{consultResult.curso1_nome || 'N/A'}</p>
                        </div>
                        {consultResult.nota_exame && (
                            <div>
                                <strong>Nota do Exame</strong>
                                <p style={{fontWeight: '800', fontSize: '18px', margin: '8px 0 0 0', color: '#1e3a8a'}}>{consultResult.nota_exame} Val.</p>
                            </div>
                        )}
                        {consultResult.status === 'Agendado' && consultResult.exame_data && (
                            <div style={{gridColumn: 'span 2', background: '#eff6ff', padding: '16px', borderRadius: '16px', border: '1px solid #dbeafe', marginTop: '16px'}}>
                                <strong>📅 Agendamento de Exame</strong>
                                {new Date() < new Date(config.data_fim_candidatura) ? (
                                    <p style={{fontSize: '14px', color: '#1e40af', marginTop: '12px'}}>
                                        A data e sala do exame serão publicadas após o encerramento das inscrições (<strong>{new Date(config.data_fim_candidatura).toLocaleDateString()}</strong>).
                                    </p>
                                ) : (
                                    <>
                                        <div style={{display: 'flex', gap: '24px', marginTop: '12px'}}>
                                            <div>
                                                <p style={{fontSize: '12px', color: '#64748b', margin: 0}}>DATA E HORA</p>
                                                <p style={{fontWeight: '700', color: '#1e40af', margin: 0}}>
                                                    {new Date(consultResult.exame_data).toLocaleDateString()} às {new Date(consultResult.exame_data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{fontSize: '12px', color: '#64748b', margin: 0}}>LOCAL / SALA</p>
                                                <p style={{fontWeight: '700', color: '#1e40af', margin: 0}}>{consultResult.exame_sala || 'A definir'}</p>
                                            </div>
                                        </div>
                                        <p style={{fontSize: '13px', color: '#1e40af', marginTop: '12px', opacity: 0.8}}>
                                            * Compareça com 30 minutos de antecedência portando o seu BI original.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                        
                        <div style={{marginTop: '20px', textAlign: 'center', display: 'flex', gap: '12px', justifyContent: 'center'}}>
                            <button 
                                onClick={() => handleDownloadComprovativo(consultResult.id_candidato || consultResult.id)}
                                className="btn-secondary-action"
                                style={{
                                    background: '#f8fafc',
                                    color: '#0f172a',
                                    border: '1px solid #cbd5e1',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <ClipboardList size={16} /> Baixar Comprovativo
                            </button>
                        </div>

                        {consultResult.rupe_historico && consultResult.rupe_historico.length > 0 && (
                            <div style={{gridColumn: 'span 2', marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '24px'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
                                    <History size={18} color="#64748b" />
                                    <strong style={{color: '#475569'}}>Histórico de Pagamentos (RUPE)</strong>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                    {consultResult.rupe_historico.map((rupe, index) => (
                                        <div key={rupe.id_rupe} style={{
                                            background: index === 0 ? '#f8fafc' : 'white',
                                            border: '1px solid #e2e8f0',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{fontSize: '14px', fontWeight: '700', color: '#1e293b'}}>Ref: {rupe.referencia}</div>
                                                <div style={{fontSize: '12px', color: '#94a3b8'}}>Gerado em: {new Date(rupe.criado_em).toLocaleString()}</div>
                                            </div>
                                            <div style={{textAlign: 'right'}}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    textTransform: 'uppercase',
                                                    background: rupe.status === 'Pago' ? '#dcfce7' : (rupe.is_expired ? '#fee2e2' : '#fff7ed'),
                                                    color: rupe.status === 'Pago' ? '#166534' : (rupe.is_expired ? '#b91c1c' : '#9a3412')
                                                }}>
                                                    {rupe.status === 'Pago' ? 'Pago' : (rupe.is_expired ? 'Expirado' : 'Pendente')}
                                                </span>
                                                <div style={{fontSize: '14px', fontWeight: '700', color: '#1e293b', marginTop: '4px'}}>
                                                    {parseFloat(rupe.valor).toLocaleString()} Kz
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {consultResult.rupe_historico[0].status === 'Pendente' && consultResult.rupe_historico[0].is_expired && consultResult.rupe_historico.length < 2 && (
                                    <div style={{marginTop: '16px', padding: '16px', background: '#fff7ed', borderRadius: '12px', border: '1px solid #fed7aa'}}>
                                        <p style={{fontSize: '14px', color: '#9a3412', margin: '0 0 12px 0'}}>
                                            A sua referência RUPE <strong>expirou</strong>. Pode gerar uma nova (limite de 2).
                                        </p>
                                        <button 
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    const response = await api.post(`candidaturas/${consultResult.id_candidato || consultResult.id}/gerar_rupe/`);
                                                    alert(response.data.mensagem);
                                                    handleConsultStatus(new Event('submit')); // Refresh data
                                                } catch (err) {
                                                    alert(err.response?.data?.erro || "Erro ao gerar nova referência.");
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="btn-primary"
                                            style={{
                                                padding: '10px 16px',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                width: 'auto'
                                            }}
                                            disabled={loading}
                                        >
                                            <RefreshCcw size={16} /> Gerar Nova Referência
                                        </button>
                                    </div>
                                )}
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
                    <div className="hero-logo">Sistema de Gestão de matriculas IPM3050</div>
                    <h1 className="hero-title">{config.nome_escola || "Portal de Admissão 2026"}</h1>
                    <p className="hero-description">Inscreva-se agora para garantir o seu futuro. Processo 100% digital, rápido e seguro.</p>
                    {config.data_fim_candidatura && (
                        <div style={{marginTop: '20px'}}>
                            <p style={{color: 'white', opacity: 0.9, fontSize: '14px', marginBottom: '8px'}}>As candidaturas terminam em:</p>
                            <CountdownTimer targetDate={config.data_fim_candidatura} />
                        </div>
                    )}
                    
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
                        
                        {checkingConfig ? (
                             <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>A verificar disponibilidade...</div>
                        ) : !config.candidaturas_abertas ? (
                             <div style={{textAlign: 'center', padding: '60px 20px', animation: 'fadeIn 0.8s ease-out'}}>
                                 <div style={{
                                     background: 'rgba(239, 68, 68, 0.1)', 
                                     width: '120px', 
                                     height: '120px', 
                                     borderRadius: '40px', 
                                     display: 'flex', 
                                     alignItems: 'center', 
                                     justifyContent: 'center', 
                                     margin: '0 auto 32px', 
                                     color: '#ef4444',
                                     transform: 'rotate(-5deg)',
                                     border: '2px solid rgba(239, 68, 68, 0.2)'
                                 }}>
                                     <Calendar size={60} />
                                 </div>
                                 <h2 style={{color: '#1e293b', fontSize: '32px', fontWeight: '800', marginBottom: '16px'}}>Portal Temporariamente Suspenso</h2>
                                 <p style={{color: '#64748b', fontSize: '18px', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 40px'}}>
                                     {config.mensagem_candidaturas_fechadas || "O período de novas candidaturas para o próximo ano lectivo ainda não foi aberto ou já se encontra encerrado."}
                                 </p>
                                 <div style={{display: 'flex', gap: '16px', justifyContent: 'center'}}>
                                     <button className="btn-submit-candidatura" style={{width: 'auto', padding: '16px 32px'}} onClick={() => setActiveTab('consult')}>
                                         Consultar Inscrição Anterior
                                     </button>
                                 </div>
                             </div>
                        ) : (
                            <>
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
                        )}
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
