import React, { useState } from 'react';
import { HelpCircle, MessageCircle, FileText, ChevronDown, ChevronUp, Phone, Mail } from 'lucide-react';

const Ajuda = () => {
    const [activeAccordion, setActiveAccordion] = useState(null);

    const faqs = [
        {
            question: "Como posso criar uma nova matrícula?",
            answer: "Para criar uma nova matrícula, vá para a secção 'Matrículas' no menu lateral e clique no botão 'Nova Matrícula'. Preencha os dados do estudante, selecione o curso e a turma, e confirme o pagamento."
        },
        {
            question: "Como redefinir a minha senha?",
            answer: "Acesse o seu perfil clicando no avatar no canto superior direito e selecione 'Meu Perfil'. Clique em 'Editar Perfil' e preencha os campos de alteração de senha."
        },
        {
            question: "Como posso gerar um relatório financeiro?",
            answer: "Navegue até a página 'Relatórios' no menu lateral. Selecione o tipo de relatório 'Financeiro', defina o período desejado e clique em 'Gerar'."
        },
        {
            question: "O sistema está lento, o que devo fazer?",
            answer: "Verifique sua conexão com a internet. Se o problema persistir, entre em contato com o suporte técnico através dos canais abaixo."
        }
    ];

    const toggleAccordion = (index) => {
        setActiveAccordion(activeAccordion === index ? null : index);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Ajuda e Suporte</h1>
                <p>Encontre respostas para perguntas frequentes ou entre em contato conosco.</p>
            </div>

            <div className="main-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '10px', color: 'var(--primary-color)' }}>
                                <HelpCircle size={24} />
                            </div>
                            <h3 style={{ margin: 0 }}>Perguntas Frequentes (FAQ)</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {faqs.map((faq, index) => (
                                <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    <button 
                                        onClick={() => toggleAccordion(index)}
                                        style={{
                                            width: '100%',
                                            padding: '15px 20px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: activeAccordion === index ? '#f8fafc' : 'white',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#334155',
                                            textAlign: 'left'
                                        }}
                                    >
                                        {faq.question}
                                        {activeAccordion === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                    {activeAccordion === index && (
                                        <div style={{ padding: '15px 20px', borderTop: '1px solid #e2e8f0', background: 'white', color: '#64748b', lineHeight: '1.6', fontSize: '14px' }}>
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="panel">
                        <h3 style={{ marginBottom: '20px' }}>Canais de Suporte</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                                <div style={{ padding: '10px', background: '#dcfce7', borderRadius: '50%', color: '#166534' }}>
                                    <MessageCircle size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 2px 0', fontSize: '15px' }}>Chat Online</h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Disponível Seg-Sex, 8h às 17h</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                                <div style={{ padding: '10px', background: '#e0f2fe', borderRadius: '50%', color: '#0369a1' }}>
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 2px 0', fontSize: '15px' }}>Email</h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>suporte@escola.com</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                                <div style={{ padding: '10px', background: '#ffedd5', borderRadius: '50%', color: '#c2410c' }}>
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 2px 0', fontSize: '15px' }}>Telefone</h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>+244 923 456 789</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="panel" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <FileText size={20} />
                            <h3 style={{ margin: 0, color: 'white' }}>Manuais</h3>
                        </div>
                        <p style={{ fontSize: '14px', opacity: '0.9', marginBottom: '20px' }}>Baixe o manual completo do utilizador para aprender a usar todas as funcionalidades.</p>
                        <button style={{ 
                            width: '100%', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            background: 'white', 
                            color: 'var(--primary-color)', 
                            fontWeight: '600', 
                            cursor: 'pointer' 
                        }}>
                            Download PDF (2MB)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ajuda;
