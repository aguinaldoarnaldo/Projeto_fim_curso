import React, { useState } from 'react';
import './Relatorios.css';

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
    File
} from 'lucide-react';

const Relatorios = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const reportsData = [
        {
            id: 'REP-001',
            titulo: 'Lista Nominal de Alunos por Turma',
            categoria: 'Académico',
            formato: 'PDF / Excel',
            ultimaGeracao: '26 Dez 2024'
        },
        {
            id: 'REP-002',
            titulo: 'Relatório Financeiro de Mensalidades',
            categoria: 'Financeiro',
            formato: 'Excel',
            ultimaGeracao: '24 Dez 2024'
        },
        {
            id: 'REP-003',
            titulo: 'Mapa de Aproveitamento Escolar',
            categoria: 'Académico',
            formato: 'PDF',
            ultimaGeracao: '20 Dez 2024'
        },
        {
            id: 'REP-004',
            titulo: 'Estatísticas de Novas Matrículas',
            categoria: 'Administrativo',
            formato: 'PDF / Gráfico',
            ultimaGeracao: '27 Dez 2024'
        },
        {
            id: 'REP-005',
            titulo: 'Relatório de Ocupação de Salas',
            categoria: 'Infraestrutura',
            formato: 'PDF',
            ultimaGeracao: '15 Dez 2024'
        }
    ];

    const filteredReports = reportsData.filter(report =>
        report.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Relatórios e Estatísticas</h1>
                <p>Gere documentos oficiais e analise os dados da instituição de forma rápida.</p>
            </header>

            <div className="stats-grid" style={{ marginBottom: '30px' }}>
                <div className="stat-card">
                    <div className="stat-card-inner">
                        <div>
                            <p className="stat-label-small">Total de Relatórios</p>
                            <h3 className="stat-value-large">{reportsData.length}</h3>
                        </div>
                        <div className="stat-icon-container icon-bg-blue">
                            <FileText size={20} />
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-inner">
                        <div>
                            <p className="stat-label-small">Gerados hoje</p>
                            <h3 className="stat-value-large">12</h3>
                        </div>
                        <div className="stat-icon-container icon-bg-green">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-inner">
                        <div>
                            <p className="stat-label-small">Mais baixado</p>
                            <h3 className="stat-value-large">Matrículas</h3>
                        </div>
                        <div className="stat-icon-container icon-bg-amber">
                            <Download size={20} />
                        </div>
                    </div>
                </div>
            </div>


            <div className="table-card">
                <div className="search-filter-container">
                    <div className="search-relative-box">
                        <Search className="search-icon-left" size={18} aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou categoria de relatório..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-field"
                            aria-label="Pesquisar relatórios"
                        />
                    </div>
                    <button className="btn-filter-reports" aria-label="Filtros de relatórios">
                        <Filter size={18} aria-hidden="true" /> Filtros
                    </button>
                </div>


                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Título do Relatório</th>
                                <th>Categoria</th>
                                <th>Formato Sugerido</th>
                                <th>Última Geração</th>
                                <th style={{ textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map((report) => (
                                <tr key={report.id}>
                                    <td>
                                        <div className="report-title-cell">
                                            <div className="report-icon-box">
                                                {report.formato.includes('Excel') ? <FileSpreadsheet size={16} /> : <File size={16} />}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{report.titulo}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="report-category-badge">
                                            {report.categoria}
                                        </span>
                                    </td>
                                    <td>{report.formato}</td>
                                    <td className="report-date-cell">{report.ultimaGeracao}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="report-actions-container">
                                            <button className="btn-action-icon btn-view" title="Visualizar">
                                                <Eye size={18} />
                                            </button>
                                            <button className="btn-action-icon btn-download" title="Gerar e Baixar">
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Relatorios;
