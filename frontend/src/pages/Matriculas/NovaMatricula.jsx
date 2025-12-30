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

const NovaMatricula = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
                        <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e3a8a' }}>
                            <User size={22} /> Dados Pessoais do Aluno
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#4b5563' }}>Nome Completo</label>
                                <input type="text" placeholder="Digite o nome completo" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#4b5563' }}>Data de Nascimento</label>
                                <input type="date" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#4b5563' }}>Sexo</label>
                                <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none' }}>
                                    <option>Seleccionar...</option>
                                    <option>Masculino</option>
                                    <option>Feminino</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#4b5563' }}>NIF / BI</label>
                                <input type="text" placeholder="Número de identificação" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#4b5563' }}>Nacionalidade</label>
                                <input type="text" defaultValue="Angolana" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none' }} />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
                        <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e3a8a' }}>
                            <BookOpen size={22} /> Escolha Académica
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#4b5563' }}>Curso</label>
                                <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none' }}>
                                    <option>Seleccionar Curso...</option>
                                    <option>Informática</option>
                                    <option>Gestão de Empresas</option>
                                    <option>Direito</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#4b5563' }}>Classe</label>
                                <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none' }}>
                                    <option>Seleccionar Classe...</option>
                                    <option>10ª Classe</option>
                                    <option>11ª Classe</option>
                                    <option>12ª Classe</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#4b5563' }}>Turno</label>
                                <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none' }}>
                                    <option>Manhã</option>
                                    <option>Tarde</option>
                                    <option>Noite</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#4b5563' }}>Ano Lectivo</label>
                                <input type="text" defaultValue="2024/2025" disabled style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', outline: 'none', background: '#f3f4f6' }} />
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="table-card" style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
                        <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e3a8a' }}>
                            <FileText size={22} /> Documentação Exigida
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ border: '2px dashed #d1d5db', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                <Upload size={32} color="#9ca3af" style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '14px', fontWeight: 600 }}>Cópia do BI / Passaporte</p>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>PDF, JPG ou PNG até 5MB</p>
                            </div>
                            <div style={{ border: '2px dashed #d1d5db', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                <Upload size={32} color="#9ca3af" style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '14px', fontWeight: 600 }}>Certificado de Habilitações</p>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>Documento original digitalizado</p>
                            </div>
                            <div style={{ border: '2px dashed #d1d5db', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                <Upload size={32} color="#9ca3af" style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '14px', fontWeight: 600 }}>Fotografias tipo Passe</p>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>Máximo 2 fotos</p>
                            </div>
                            <div style={{ border: '2px dashed #d1d5db', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                <Upload size={32} color="#9ca3af" style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '14px', fontWeight: 600 }}>Comprovativo de Pagamento</p>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>Taxa de inscrição/matrícula</p>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="page-container">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <button
                        onClick={() => navigate('/matriculas')}
                        style={{ background: 'none', border: 'none', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, cursor: 'pointer', marginBottom: '10px', padding: 0 }}
                    >
                        <ArrowLeft size={16} /> Voltar à lista
                    </button>
                    <h1>Nova Ficha de Matrícula</h1>
                    <p>Preencha os dados abaixo com precisão para registrar o novo aluno.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f3f4f6', padding: '8px 15px', borderRadius: '100px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step >= 1 ? '#1e3a8a' : '#9ca3af', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>1</div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: step >= 1 ? '#1e3a8a' : '#9ca3af' }}>Dados</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f3f4f6', padding: '8px 15px', borderRadius: '100px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step >= 2 ? '#1e3a8a' : '#9ca3af', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>2</div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: step >= 2 ? '#1e3a8a' : '#9ca3af' }}>Curso</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f3f4f6', padding: '8px 15px', borderRadius: '100px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step >= 3 ? '#1e3a8a' : '#9ca3af', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>3</div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: step >= 3 ? '#1e3a8a' : '#9ca3af' }}>Docs</span>
                    </div>
                </div>
            </header>

            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                {renderStep()}

                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        disabled={step === 1}
                        style={{ padding: '12px 25px', borderRadius: '10px', border: '1px solid #d1d5db', background: 'white', fontWeight: 600, cursor: step === 1 ? 'not-allowed' : 'pointer', opacity: step === 1 ? 0.5 : 1 }}
                    >
                        Anterior
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            style={{ padding: '12px 30px', borderRadius: '10px', border: 'none', background: '#1e3a8a', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            Próximo Passo <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                alert('Matrícula registrada com sucesso!');
                                navigate('/matriculas');
                            }}
                            style={{ padding: '12px 30px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
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
