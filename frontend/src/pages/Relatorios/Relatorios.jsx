import React, { useState } from 'react';
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '5px' }}>Total de Relatórios</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 700 }}>{reportsData.length}</h3>
                        </div>
                        <div style={{ background: '#eff6ff', color: '#1e3a8a', padding: '10px', borderRadius: '10px' }}>
                            <FileText size={20} />
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '5px' }}>Gerados hoje</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 700 }}>12</h3>
                        </div>
                        <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '10px' }}>
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '5px' }}>Mais baixado</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 700 }}>Matrículas</h3>
                        </div>
                        <div style={{ background: '#fef3c7', color: '#92400e', padding: '10px', borderRadius: '10px' }}>
                            <Download size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou categoria de relatório..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '10px',
                                border: '1px solid #e5e7eb',
                                outline: 'none',
                                background: '#f9fafb'
                            }}
                        />
                    </div>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: '1px solid #e5e7eb', borderRadius: '10px', background: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        <Filter size={18} /> Filtros
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ background: '#f3f4f6', color: '#374151', padding: '8px', borderRadius: '8px' }}>
                                                {report.formato.includes('Excel') ? <FileSpreadsheet size={16} /> : <File size={16} />}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{report.titulo}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            background: '#f3f4f6',
                                            color: '#4b5563'
                                        }}>
                                            {report.categoria}
                                        </span>
                                    </td>
                                    <td>{report.formato}</td>
                                    <td style={{ color: '#6b7280', fontSize: '13px' }}>{report.ultimaGeracao}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '5px' }} title="Visualizar">
                                                <Eye size={18} />
                                            </button>
                                            <button style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '5px' }} title="Gerar e Baixar">
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
