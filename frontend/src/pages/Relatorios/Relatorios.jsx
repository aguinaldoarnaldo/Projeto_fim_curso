import React, { useState, useEffect } from 'react';
import './Relatorios.css';
import api from '../../services/api';

import {
    FileText,
    Download,
    Eye,
    Filter,
    Search,
    Calendar,
    BarChart,
    Users,
    TrendingUp,
    FileSpreadsheet,
    File,
    ChevronRight,
    Loader2,
    X,
    Info,
    ArrowRight
} from 'lucide-react';

import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';

const Relatorios = () => {
    const { hasPermission } = usePermission();
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        total_alunos: 0,
        total_candidatos: 0,
        total_financeiro: 0,
        relatorios_disponiveis: 0
    });
    const [activeCategory, setActiveCategory] = useState('Todos');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null); // ID do relatório sendo gerado
    
    // Modais e seleções
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedReportTemplate, setSelectedReportTemplate] = useState(null);
    const [configData, setConfigData] = useState({
        turma_id: '',
        ano_id: ''
    });
    const [auxData, setAuxData] = useState({
        turmas: [],
        anos: []
    });

    const reportsData = [
        {
            id: 'relatorio_turmas',
            titulo: 'Relatório Geral de Turmas',
            descricao: 'Lista todas as turmas do sistema com respectivo curso, período e número de alunos.',
            categoria: 'Académico',
            formato: 'PDF',
            requiresConfig: true
        },
        {
            id: 'alunos_por_turma',
            titulo: 'Lista Nominal de Alunos por Turma',
            descricao: 'Gera a pauta nominal completa de uma turma específica com número de processo e status.',
            categoria: 'Académico',
            formato: 'PDF',
            requiresConfig: true
        },
        {
            id: 'financeiro_resumo',
            titulo: 'Relatório Financeiro de Pagamentos',
            descricao: 'Resumo de todas as entradas financeiras recentes e balanço acumulado.',
            categoria: 'Financeiro',
            formato: 'PDF',
            requiresConfig: false,
            permission: PERMISSIONS.VIEW_FINANCEIRO
        },
        {
            id: 'inscritos_por_ano',
            titulo: 'Relatório Geral de Inscritos',
            descricao: 'Lista de todos os candidatos que realizaram inscrição no portal público.',
            categoria: 'Administrativo',
            formato: 'PDF',
            requiresConfig: true,
            permission: PERMISSIONS.VIEW_INSCRITOS
        },
        {
            id: 'relatorio_ano_lectivo',
            titulo: 'Relatório de Anos Lectivos',
            descricao: 'Histórico de anos lectivos registrados, datas de vigência e estado actual.',
            categoria: 'Administrativo',
            formato: 'PDF',
            requiresConfig: false
        },
        {
            id: 'stats_ocupacao',
            titulo: 'Mapa de Ocupação de Salas',
            descricao: 'Visualização da distribuição de alunos por blocos e salas de aula.',
            categoria: 'Infraestrutura',
            formato: 'PDF',
            requiresConfig: false
        }
    ];

    const finalReports = reportsData.filter(r => !r.permission || hasPermission(r.permission));

    useEffect(() => {
        fetchDashboardData();
        fetchAuxData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('relatorios/data_dashboard/');
            setStats(res.data);
        } catch (err) {
            console.error("Erro ao carregar estatísticas:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuxData = async () => {
        try {
            const [turmasRes, anosRes] = await Promise.all([
                api.get('turmas/?page_size=100'),
                api.get('anos-lectivos/?page_size=100')
            ]);
            setAuxData({
                turmas: turmasRes.data.results || turmasRes.data,
                anos: anosRes.data.results || anosRes.data
            });
        } catch (err) {
            console.error("Erro ao carregar dados auxiliares");
        }
    };

    const handleGenerateReport = async (reportId, config = {}) => {
        setGenerating(reportId);
        try {
            const params = new URLSearchParams(config).toString();
            const response = await api.get(`relatorios/${reportId}/?${params}`, {
                responseType: 'blob'
            });
            
            // Abrir PDF em nova aba ou baixar
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
            
            setShowConfigModal(false);
        } catch (err) {
            console.error("Erro ao gerar relatório:", err);
            alert("Não foi possível gerar este relatório no momento. Verifique se os dados estão preenchidos corretamente.");
        } finally {
            setGenerating(null);
        }
    };

    const openConfig = (report) => {
        if (!report.requiresConfig) {
            handleGenerateReport(report.id);
        } else {
            setSelectedReportTemplate(report);
            setConfigData({
                turma_id: '',
                ano_id: 'all'
            });
            setShowConfigModal(true);
        }
    };

    const filteredReports = finalReports.filter(report =>
        (activeCategory === 'Todos' || report.categoria === activeCategory) &&
        (report.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
         report.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="page-container relatorios-page">
            <header className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1>Central de Relatórios</h1>
                        <p>Gere documentos oficiais, listas nominais e analise dados institucionais.</p>
                    </div>
                </div>
            </header>

            <div className="table-card" style={{ marginTop: '24px' }}>
                {/* TOOLBAR */}
                <div className="search-filter-row">
                    <div className="search-box">
                        <Search className="search-icon" size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            className="search-box-input" 
                            placeholder="Pesquisar relatório..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                       {['Todos', 'Académico', 'Financeiro', 'Administrativo', 'Infraestrutura'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`btn-filter-pill ${activeCategory === cat ? 'active' : ''}`}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: activeCategory === cat ? '1px solid #2563eb' : '1px solid #e2e8f0',
                                    background: activeCategory === cat ? '#eff6ff' : 'white',
                                    color: activeCategory === cat ? '#2563eb' : '#64748b',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TABLE */}
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>NOME DO RELATÓRIO</th>
                                <th>CATEGORIA</th>
                                <th>DESCRIÇÃO</th>
                                <th>FORMATO</th>
                                <th style={{ textAlign: 'right' }}>AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map((report) => (
                                <tr key={report.id} className="clickable-row" onClick={() => openConfig(report)}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ 
                                                width: '36px', height: '36px', 
                                                borderRadius: '8px', 
                                                background: '#f1f5f9', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#475569'
                                            }}>
                                                <FileText size={18} />
                                            </div>
                                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{report.titulo}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${report.categoria.toLowerCase()}`} 
                                              style={{ 
                                                  background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569',
                                                  padding: '4px 10px', borderRadius: '6px', fontSize: '12px'
                                              }}>
                                            {report.categoria}
                                        </span>
                                    </td>
                                    <td style={{ color: '#64748b', maxWidth: '400px', whiteSpace: 'normal' }}>
                                        {report.descricao}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ 
                                                background: '#fee2e2', color: '#ef4444', 
                                                padding: '2px 8px', borderRadius: '4px', 
                                                fontSize: '11px', fontWeight: 700 
                                            }}>PDF</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button 
                                            className="btn-action"
                                            onClick={(e) => { e.stopPropagation(); openConfig(report); }}
                                            style={{
                                                background: '#2563eb', color: 'white', border: 'none',
                                                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                                fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px'
                                            }}
                                        >
                                            {generating === report.id ? <Loader2 size={16} className="spinner" /> : <Download size={16} />}
                                            Gerar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredReports.length === 0 && (
                                <tr>
                                    <td colspan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        Nenhum relatório encontrado para esta categoria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CONFIG MODAL */}
            {showConfigModal && (
                <div className="modal-overlay" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999}} onClick={() => setShowConfigModal(false)}>
                    <div className="detail-modal-card" style={{maxWidth: '500px', margin: '20px'}} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Configurar Relatório</h3>
                            <button className="btn-close-modal" onClick={() => setShowConfigModal(false)}><X size={20} color="white" /></button>
                        </div>
                        
                        <div className="modal-body" style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <FileText size={20} color="#3b82f6" />
                                    <h4 style={{ margin: 0, color: '#1e293b' }}>{selectedReportTemplate?.titulo}</h4>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{selectedReportTemplate?.descricao}</p>
                            </div>

                            {selectedReportTemplate?.id === 'relatorio_turmas' && (
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Filtrar por Ano Lectivo</label>
                                    <select 
                                        className="form-select"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        value={configData.ano_id} 
                                        onChange={(e) => setConfigData({...configData, ano_id: e.target.value})}
                                    >
                                        <option value="all">Todos os anos</option>
                                        {auxData.anos.map(a => (
                                            <option key={a.id_ano_lectivo} value={a.id_ano_lectivo}>{a.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedReportTemplate?.id === 'alunos_por_turma' && (
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Selecione a Turma</label>
                                    <select 
                                        className="form-select"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        value={configData.turma_id} 
                                        onChange={(e) => setConfigData({...configData, turma_id: e.target.value})}
                                    >
                                        <option value="">Escolha uma turma...</option>
                                        {auxData.turmas.map(t => (
                                            <option key={t.id_turma} value={t.id_turma}>{t.codigo_turma} - {t.curso_nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                             {selectedReportTemplate?.id === 'inscritos_por_ano' && (
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Ano Lectivo (Opcional)</label>
                                    <select 
                                        className="form-select"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        value={configData.ano_id} 
                                        onChange={(e) => setConfigData({...configData, ano_id: e.target.value})}
                                    >
                                        <option value="all">Todos os anos</option>
                                        {auxData.anos.map(a => (
                                            <option key={a.id_ano_lectivo} value={a.id_ano_lectivo}>{a.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        
                            <button 
                                className="btn-primary" 
                                style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
                                disabled={generating === selectedReportTemplate?.id}
                                onClick={() => handleGenerateReport(selectedReportTemplate.id, configData)}
                            >
                                {generating === selectedReportTemplate?.id ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
                                Gerar Documento PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Relatorios;
