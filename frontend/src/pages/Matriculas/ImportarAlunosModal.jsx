import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import api from '../../services/api';

const ImportarAlunosModal = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile);
            setError(null);
        } else {
            setFile(null);
            setError("Por favor, selecione um arquivo CSV válido.");
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setReport(null);

        const formData = new FormData();
        formData.append('arquivo_csv', file);

        try {
            const response = await api.post('matriculas/importar_csv/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setReport(response.data.relatorio);
        } catch (err) {
            console.error("Erro na importação:", err);
            setError(err.response?.data?.erro || "Ocorreu um erro ao processar o arquivo. Verifique o formato.");
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "nome_completo,numero_bi,data_nascimento,genero,telefone,email,turma_codigo,nacionalidade,naturalidade,provincia,municipio,bairro,numero_casa\n";
        const example = "João Manuel,123456789LA012,2008-05-15,M,923000000,joao@escola.ao,INF10A,Angolana,Luanda,Luanda,Belas,Centralidade,123";
        const csvContent = headers + example;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'modelo_importacao_alunos.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="detail-modal-card" style={{ maxWidth: '700px', height: 'auto', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                <div className="evaluation-header" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Upload size={20} />
                        <h3>Importar Alunos via CSV</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="evaluation-body" style={{ padding: '24px', overflowY: 'auto' }}>
                    {!report ? (
                        <>
                            <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                                    <FileText size={18} /> Instruções de Importação
                                </h4>
                                <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                                    O arquivo deve estar no formato <strong>CSV</strong> com as colunas separadas por vírgula.
                                    Campos obrigatórios: Nome Completo, BI e Código da Turma.
                                </p>
                                <button 
                                    onClick={downloadTemplate}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', gap: '8px', 
                                        padding: '8px 12px', background: 'white', border: '1px solid #cbd5e1',
                                        borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#334155',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Download size={14} /> Baixar Modelo CSV
                                </button>
                            </div>

                            <div 
                                style={{ 
                                    border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px 20px',
                                    textAlign: 'center', background: file ? '#f0f9ff' : '#f8fafc',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onClick={() => document.getElementById('csv-upload').click()}
                            >
                                <input 
                                    type="file" 
                                    id="csv-upload" 
                                    hidden 
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                                <Upload size={32} color={file ? '#0284c7' : '#94a3af'} style={{ marginBottom: '12px' }} />
                                {file ? (
                                    <div>
                                        <p style={{ fontWeight: '600', color: '#0369a1', margin: '0 0 4px 0' }}>{file.name}</p>
                                        <p style={{ fontSize: '12px', color: '#64748b' }}>{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p style={{ fontWeight: '600', color: '#475569', margin: '0 0 4px 0' }}>Clique ou arraste o arquivo aqui</p>
                                        <p style={{ fontSize: '12px', color: '#94a3af' }}>Formatos aceitos: .csv</p>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div style={{ marginTop: '16px', padding: '12px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '13px', display: 'flex', gap: '10px' }}>
                                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="import-report">
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ 
                                    width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdf4',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
                                }}>
                                    <CheckCircle size={32} color="#16a34a" />
                                </div>
                                <h4 style={{ margin: 0, color: '#1e293b' }}>Importação Finalizada</h4>
                                <p style={{ fontSize: '14px', color: '#64748b' }}>{report.total_processado} registros processados</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                                    <p style={{ fontSize: '24px', fontWeight: '700', color: '#15803d', margin: 0 }}>{report.sucessos.length}</p>
                                    <p style={{ fontSize: '12px', color: '#166534', margin: 0, fontWeight: '600' }}>Sucessos</p>
                                </div>
                                <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', textAlign: 'center' }}>
                                    <p style={{ fontSize: '24px', fontWeight: '700', color: '#b91c1c', margin: 0 }}>{report.falhas.length}</p>
                                    <p style={{ fontSize: '12px', color: '#991b1b', margin: 0, fontWeight: '600' }}>Falhas</p>
                                </div>
                            </div>

                            {report.falhas.length > 0 && (
                                <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                            <tr>
                                                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Nome (BI)</th>
                                                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Erro</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.falhas.map((f, i) => (
                                                <tr key={i}>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{f.linha.nome_completo || 'N/A'} ({f.linha.numero_bi || '?'})</td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>{f.erro}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="evaluation-actions">
                    {!report ? (
                        <>
                            <button onClick={onClose} className="btn-cancel" disabled={loading}>Cancelar</button>
                            <button 
                                onClick={handleUpload} 
                                disabled={!file || loading}
                                className="btn-confirm"
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px', 
                                    background: '#4f46e5', color: 'white',
                                    opacity: (!file || loading) ? 0.6 : 1
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Iniciar Importação
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => {
                                onSuccess();
                                onClose();
                            }} 
                            className="btn-confirm"
                            style={{ background: '#4f46e5', color: 'white', width: '100%' }}
                        >
                            Concluir e Atualizar Lista
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportarAlunosModal;
