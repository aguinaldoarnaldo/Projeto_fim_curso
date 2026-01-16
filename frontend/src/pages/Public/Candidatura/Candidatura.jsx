import React, { useState } from 'react';
import { User, ClipboardList, BookOpen, GraduationCap, CheckCircle, Send, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Candidatura.css';

const Candidatura = () => {
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        genero: '',
        dataNascimento: '',
        nacionalidade: 'Angolana',
        bi: '',
        telefone: '',
        email: '',
        naturalidade: '',
        residencia: '',
        escola9: 'Pública',
        nomeEscola: '',
        municipioEscola: '',
        anoConclusao: '',
        nota9: '',
        curso1: '',
        curso2: '',
        turno: '',
        encarregadoNome: '',
        encarregadoParentesco: '',
        encarregadoTelefone: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Create new candidate object based on form data
        const newCandidate = {
            id: `INS${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            nome: formData.nome,
            genero: formData.genero,
            dataNascimento: formData.dataNascimento,
            nacionalidade: formData.nacionalidade,
            bi: formData.bi,
            dataEmissaoBI: new Date().toISOString().split('T')[0], // Mock
            naturalidade: formData.naturalidade,
            residencia: formData.residencia,
            telefone: formData.telefone,
            email: formData.email,
            deficiencia: 'Não',
            escola9: formData.escola9,
            nomeEscola: formData.nomeEscola,
            municipioEscola: formData.municipioEscola,
            anoConclusao: formData.anoConclusao,
            anoInscricao: new Date().getFullYear().toString(),
            nota9: Number(formData.nota9),
            notaExame: null,
            curso1: formData.curso1,
            curso2: formData.curso2,
            turno: formData.turno,
            status: 'Pendente',
            dataInscricao: new Date().toLocaleDateString('pt-AO', { day: 'numeric', month: 'short', year: 'numeric' }),
            encarregado: {
                nome: formData.encarregadoNome,
                parentesco: formData.encarregadoParentesco,
                telefone: formData.encarregadoTelefone
            }
        };

        // Save to localStorage
        const existingCandidates = JSON.parse(localStorage.getItem('registeredCandidates') || '[]');
        localStorage.setItem('registeredCandidates', JSON.stringify([...existingCandidates, newCandidate]));

        setSubmitted(true);
        window.scrollTo(0, 0);
    };

    if (submitted) {
        return (
            <div className="candidatura-page">
                <div className="candidatura-container">
                    <div className="success-message">
                        <CheckCircle size={80} className="success-icon" />
                        <h2>Candidatura Enviada com Sucesso!</h2>
                        <p>Os seus dados foram registados. O seu número de inscrição é <strong>#INS{new Date().getFullYear()}XXX</strong>.</p>
                        <p style={{ marginTop: '20px', color: '#64748b' }}>Aguarde a validação dos dados pela secretaria.</p>
                        <button className="btn-submit-candidatura" onClick={() => window.location.reload()}>
                            Fazer Nova Inscrição
                        </button>
                        <button 
                            style={{marginTop: '10px', background: 'transparent', color: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: 600}}
                            onClick={() => navigate('/login')}
                        >
                            Voltar para Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="candidatura-page">
            <div className="candidatura-container">
                <div className="candidatura-header">
                    <h1>Ficha de Inscrição</h1>
                    <p>Preencha os dados abaixo para se candidatar ao Ano Lectivo 2026</p>
                </div>

                <form className="candidatura-form" onSubmit={handleSubmit}>
                    {/* Dados Pessoais */}
                    <div className="form-section">
                        <div className="section-title">
                            <User size={24} className="section-icon" />
                            Dados Pessoais
                        </div>
                        <div className="form-grid">
                            <div className="form-control full-width">
                                <label>Nome Completo</label>
                                <input name="nome" value={formData.nome} onChange={handleChange} required placeholder="Nome conforme o BI" />
                            </div>
                            <div className="form-control">
                                <label>Género</label>
                                <select name="genero" value={formData.genero} onChange={handleChange} required>
                                    <option value="">Selecione</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label>Data de Nascimento</label>
                                <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} required />
                            </div>
                            <div className="form-control">
                                <label>Nº do Bilhete de Identidade</label>
                                <input name="bi" value={formData.bi} onChange={handleChange} required placeholder="000000000LA000" />
                            </div>
                            <div className="form-control">
                                <label>Nacionalidade</label>
                                <input name="nacionalidade" value={formData.nacionalidade} onChange={handleChange} required />
                            </div>
                            <div className="form-control">
                                <label>Telefone</label>
                                <input name="telefone" value={formData.telefone} onChange={handleChange} required placeholder="900 000 000" />
                            </div>
                            <div className="form-control">
                                <label>Email (Opcional)</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="exemplo@email.com" />
                            </div>
                             <div className="form-control full-width">
                                <label>Local de Residência</label>
                                <input name="residencia" value={formData.residencia} onChange={handleChange} required placeholder="Município, Bairro..." />
                            </div>
                        </div>
                    </div>

                    {/* Dados Académicos */}
                    <div className="form-section">
                        <div className="section-title">
                            <BookOpen size={24} className="section-icon" />
                            Dados Académicos (9ª Classe)
                        </div>
                        <div className="form-grid">
                            <div className="form-control">
                                <label>Escola de Proveniência</label>
                                <select name="escola9" value={formData.escola9} onChange={handleChange} required>
                                    <option value="Pública">Pública</option>
                                    <option value="Privada">Privada</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label>Nome da Escola</label>
                                <input name="nomeEscola" value={formData.nomeEscola} onChange={handleChange} required />
                            </div>
                            <div className="form-control">
                                <label>Município da Escola</label>
                                <input name="municipioEscola" value={formData.municipioEscola} onChange={handleChange} required />
                            </div>
                            <div className="form-control">
                                <label>Ano de Conclusão</label>
                                <input type="number" name="anoConclusao" value={formData.anoConclusao} onChange={handleChange} required />
                            </div>
                            <div className="form-control">
                                <label>Média Final (9ª Classe)</label>
                                <input type="number" name="nota9" value={formData.nota9} onChange={handleChange} required min="0" max="20" />
                            </div>
                        </div>
                    </div>

                    {/* Opções de Curso */}
                    <div className="form-section">
                        <div className="section-title">
                            <GraduationCap size={24} className="section-icon" />
                            Opções de Curso
                        </div>
                        <div className="form-grid">
                            <div className="form-control">
                                <label>1ª Opção de Curso</label>
                                <select name="curso1" value={formData.curso1} onChange={handleChange} required>
                                    <option value="">Selecione</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                    <option value="Enfermagem">Enfermagem</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label>2ª Opção de Curso</label>
                                <select name="curso2" value={formData.curso2} onChange={handleChange} required>
                                    <option value="">Selecione</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                    <option value="Enfermagem">Enfermagem</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label>Turno Preferencial</label>
                                <select name="turno" value={formData.turno} onChange={handleChange} required>
                                    <option value="">Selecione</option>
                                    <option value="Manhã">Manhã</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Noite">Noite</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Dados do Encarregado */}
                    <div className="form-section">
                        <div className="section-title">
                            <ClipboardList size={24} className="section-icon" />
                            Dados do Encarregado de Educação
                        </div>
                        <div className="form-grid">
                            <div className="form-control full-width">
                                <label>Nome do Encarregado</label>
                                <input name="encarregadoNome" value={formData.encarregadoNome} onChange={handleChange} required />
                            </div>
                            <div className="form-control">
                                <label>Grau de Parentesco</label>
                                <select name="encarregadoParentesco" value={formData.encarregadoParentesco} onChange={handleChange} required>
                                    <option value="">Selecione</option>
                                    <option value="Pai">Pai</option>
                                    <option value="Mãe">Mãe</option>
                                    <option value="Tio(a)">Tio(a)</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label>Telefone do Encarregado</label>
                                <input name="encarregadoTelefone" value={formData.encarregadoTelefone} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    {/* Documentos */}
                    <div className="form-section">
                        <div className="section-title">
                            <UploadCloud size={24} className="section-icon" />
                            Documentos Obrigatórios
                        </div>
                        <div className="form-grid">
                            <div className="form-control">
                                <label>Cópia do Bilhete de Identidade (PDF ou Imagem)</label>
                                <input type="file" name="docBI" accept="image/*,.pdf" required className="file-input" />
                            </div>
                            <div className="form-control">
                                <label>Certificado de Habilitações (9ª Classe)</label>
                                <input type="file" name="docCertificado" accept="image/*,.pdf" required className="file-input" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-submit-candidatura">
                        <Send size={20} />
                        Submeter Candidatura
                    </button>
                    
                    <div style={{textAlign: 'center', marginTop: '20px'}}>
                        <a href="/login" style={{color: '#64748b', textDecoration: 'none', fontSize: '14px'}}>
                            Já tem conta? Fazer Login
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Candidatura;
