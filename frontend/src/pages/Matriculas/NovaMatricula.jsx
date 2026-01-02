import React, { useState } from 'react';
import {
    ArrowLeft,
    Save,
    User,
    BookOpen,
    FileText,
    Phone,
    CheckCircle,
    ChevronRight,
    Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Matriculas.css';


const NovaMatricula = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
                        <h3 className="form-title">
                            <User size={22} /> Dados Pessoais do Aluno
                        </h3>
                        <div className="form-grid-2col">
                            <div className="form-full-width">
                                <label className="field-label">Nome Completo</label>
                                <input type="text" placeholder="Digite o nome completo" className="field-input" />
                            </div>
                            <div>
                                <label className="field-label">Data de Nascimento</label>
                                <input type="date" className="field-input" />
                            </div>
                            <div>
                                <label className="field-label">Sexo</label>
                                <select className="field-select">
                                    <option>Seleccionar...</option>
                                    <option>Masculino</option>
                                    <option>Feminino</option>
                                </select>
                            </div>
                            <div>
                                <label className="field-label">NIF / BI</label>
                                <input type="text" placeholder="Número de identificação" className="field-input" />
                            </div>
                            <div>
                                <label className="field-label">Nacionalidade</label>
                                <input type="text" defaultValue="Angolana" className="field-input" />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
                        <h3 className="form-title">
                            <BookOpen size={22} /> Escolha Académica
                        </h3>
                        <div className="form-grid-2col">
                            <div>
                                <label className="field-label">Curso</label>
                                <select className="field-select">
                                    <option>Seleccionar Curso...</option>
                                    <option>Informática</option>
                                    <option>Gestão de Empresas</option>
                                    <option>Direito</option>
                                </select>
                            </div>
                            <div>
                                <label className="field-label">Classe</label>
                                <select className="field-select">
                                    <option>Seleccionar Classe...</option>
                                    <option>10ª Classe</option>
                                    <option>11ª Classe</option>
                                    <option>12ª Classe</option>
                                </select>
                            </div>
                            <div>
                                <label className="field-label">Turno</label>
                                <select className="field-select">
                                    <option>Manhã</option>
                                    <option>Tarde</option>
                                    <option>Noite</option>
                                </select>
                            </div>
                            <div>
                                <label className="field-label">Ano Lectivo</label>
                                <input type="text" defaultValue="2024/2025" disabled className="field-input" style={{ background: '#f3f4f6' }} />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
                        <h3 className="form-title">
                            <FileText size={22} /> Documentação Exigida
                        </h3>
                        <div className="upload-grid">
                            <div className="upload-box">
                                <Upload size={32} color="#9ca3af" className="upload-box-icon" />
                                <p className="upload-box-title">Cópia do BI / Passaporte</p>
                                <p className="upload-box-hint">PDF, JPG ou PNG até 5MB</p>
                            </div>
                            <div className="upload-box">
                                <Upload size={32} color="#9ca3af" className="upload-box-icon" />
                                <p className="upload-box-title">Certificado de Habilitações</p>
                                <p className="upload-box-hint">Documento original digitalizado</p>
                            </div>
                            <div className="upload-box">
                                <Upload size={32} color="#9ca3af" className="upload-box-icon" />
                                <p className="upload-box-title">Fotografias tipo Passe</p>
                                <p className="upload-box-hint">Máximo 2 fotos</p>
                            </div>
                            <div className="upload-box">
                                <Upload size={32} color="#9ca3af" className="upload-box-icon" />
                                <p className="upload-box-title">Comprovativo de Pagamento</p>
                                <p className="upload-box-hint">Taxa de inscrição/matrícula</p>
                            </div>
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
                    <div className="step-indicator">
                        <div className="step-number" style={{ background: step >= 1 ? '#1e3a8a' : '#9ca3af' }}>1</div>
                        <span className="step-label" style={{ color: step >= 1 ? '#1e3a8a' : '#9ca3af' }}>Dados</span>
                    </div>
                    <div className="step-indicator">
                        <div className="step-number" style={{ background: step >= 2 ? '#1e3a8a' : '#9ca3af' }}>2</div>
                        <span className="step-label" style={{ color: step >= 2 ? '#1e3a8a' : '#9ca3af' }}>Curso</span>
                    </div>
                    <div className="step-indicator">
                        <div className="step-number" style={{ background: step >= 3 ? '#1e3a8a' : '#9ca3af' }}>3</div>
                        <span className="step-label" style={{ color: step >= 3 ? '#1e3a8a' : '#9ca3af' }}>Docs</span>
                    </div>
                </div>
            </header>

            <div className="step-container">
                {renderStep()}

                <div className="step-actions">
                    <button
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        disabled={step === 1}
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
                            onClick={() => {
                                alert('Matrícula registrada com sucesso!');
                                navigate('/matriculas');
                            }}
                            className="btn-step-finish"
                        >
                            <Save size={18} /> Finalizar Matrícula
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};

export default NovaMatricula;
