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
                <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px'}}>
                    <div className="icon-badge-report">
                        <FileText size={24} />
                    </div>
                    <h1>Central de Relatórios</h1>
                </div>
                <p>Gere documentos oficiais, listas nominais e analise dados institucionais em tempo real.</p>
            </header>

            {/* QUICK STATS */}
            <div className="stats-grid animate-fade-in" style={{ marginBottom: '32px' }}>
                {hasPermission(PERMISSIONS.VIEW_FINANCEIRO) && (
                    <div className="stat-card premium">
                        <div className="stat-card-inner">
                            <div>
                                <p className="stat-label-small">Arrecadação Total</p>
                                <h3 className="stat-value-large">{stats.total_financeiro.toLocaleString('pt-AO', {style: 'currency', currency: 'AOA'})}</h3>
                            </div>
                            <div className="stat-icon-container" style={{background: '#ecfdf5', color: '#059669'}}>
                                <TrendingUp size={20} />
                            </div>
                        </div>
                    </div>
                )}
                <div className="stat-card premium">
                    <div className="stat-card-inner">
                        <div>
                            <p className="stat-label-small">Novos Candidatos</p>
                            <h3 className="stat-value-large">{stats.total_candidatos}</h3>
                        </div>
                        <div className="stat-icon-container" style={{background: '#eff6ff', color: '#2563eb'}}>
                            <Users size={20} />
                        </div>
                    </div>
                </div>
                <div className="stat-card premium">
                    <div className="stat-card-inner">
                        <div>
                            <p className="stat-label-small">Alunos Matriculados</p>
                            <h3 className="stat-value-large">{stats.total_alunos}</h3>
                        </div>
                        <div className="stat-icon-container" style={{background: '#fef3c7', color: '#d97706'}}>
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="reports-main-layout">
                {/* CATEGORIES / FILTER */}
                <div className="reports-sidebar">
                    <div className="sidebar-card">
                        <h3>Categorias</h3>
                        <div className="category-list">
                            {['Todos', 'Académico', 'Financeiro', 'Administrativo', 'Infraestrutura'].map(cat => (
                                <button 
                                    key={cat}
                                    className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="sidebar-card info-box">
                        <div style={{display: 'flex', gap: '10px', color: '#1e3a8a'}}>
                            <Info size={20} />
                            <h4 style={{margin: 0}}>Dica de Uso</h4>
                        </div>
                        <p style={{fontSize: '13px', color: '#475569', marginTop: '10px', lineHeight: '1.5'}}>
                            Relatórios acadêmicos como a "Lista Nominal" exigem que selecione a turma antes de gerar o documento.
                        </p>
                    </div>
                </div>

                {/* REPORTS CONTENT */}
                <div className="reports-content">
                    <div className="search-filter-box">
                        <Search className="search-icon-abs" size={20} />
                        <input 
                            type="text" 
                            placeholder="Pesquisar por nome do relatório..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="reports-grid">
                        {filteredReports.map((report) => (
                            <div key={report.id} className="report-card animate-fade-in" onClick={() => openConfig(report)}>
                                <div className="report-card-header">
                                    <div className={`report-icon-tag ${report.categoria.toLowerCase()}`}>
                                        <FileText size={20} />
                                    </div>
                                    <span className="report-badge-format">{report.formato}</span>
                                </div>
                                
                                <div className="report-card-body">
                                    <h4>{report.titulo}</h4>
                                    <p>{report.descricao}</p>
                                </div>

                                <div className="report-card-footer">
                                    <span className="last-run" style={{color: '#64748b'}}>{report.categoria}</span>
                                    <button className="btn-generate-card">
                                        {generating === report.id ? <Loader2 size={16} className="spinner" /> : <ChevronRight size={18} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CONFIG MODAL */}
            {showConfigModal && (
                <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
                    <div className="modal-content-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Configuração do Relatório</h3>
                            <button onClick={() => setShowConfigModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{marginBottom: '20px', fontSize: '14px', color: '#64748b'}}>
                                {selectedReportTemplate?.titulo}
                            </p>

                            {selectedReportTemplate?.id === 'alunos_por_turma' && (
                                <div className="form-group-report">
                                    <label>Selecione a Turma</label>
                                    <select 
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
                                <div className="form-group-report">
                                    <label>Ano Lectivo (Opcional)</label>
                                    <select 
                                        value={configData.ano_id} 
                                        onChange={(e) => setConfigData({...configData, ano_id: e.target.value})}
                                    >
                                        <option value="">Todos os anos</option>
                                        {auxData.anos.map(a => (
                                            <option key={a.id_ano_lectivo} value={a.id_ano_lectivo}>{a.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel-modal" onClick={() => setShowConfigModal(false)}>Cancelar</button>
                            <button 
                                className="btn-confirm-report" 
                                disabled={generating === selectedReportTemplate?.id}
                                onClick={() => handleGenerateReport(selectedReportTemplate.id, configData)}
                            >
                                {generating === selectedReportTemplate?.id ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
                                Gerar Documento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Relatorios;
