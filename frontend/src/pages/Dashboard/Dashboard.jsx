import React from 'react';
import './Dashboard.css';

import {
  Users,
  GraduationCap,
  UserCheck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MoreVertical
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const data = [
  { name: 'Jan', matriculas: 400, inscritos: 240 },
  { name: 'Fev', matriculas: 300, inscritos: 139 },
  { name: 'Mar', matriculas: 200, inscritos: 980 },
  { name: 'Abr', matriculas: 278, inscritos: 390 },
  { name: 'Mai', matriculas: 189, inscritos: 480 },
  { name: 'Jun', matriculas: 239, inscritos: 380 },
  { name: 'Jul', matriculas: 349, inscritos: 430 },
];

const pieData = [
  { name: 'Confirmadas', value: 400 },
  { name: 'Pendentes', value: 300 },
  { name: 'Canceladas', value: 100 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

const Dashboard = () => {
  const stats = [
    { label: 'Total Alunos', value: '12,478', icon: <GraduationCap />, trend: '+12%', type: 'blue' },
    { label: 'Matrículas Hoje', value: '478', icon: <UserCheck />, trend: '+5%', type: 'green' },
    { label: 'Inscritos Pendentes', value: '156', icon: <Users />, trend: '-2%', type: 'purple' },
    { label: 'Receita Mensal', value: '42,8k $', icon: <DollarSign />, trend: '+18%', type: 'orange' },
  ];

  const recentMatriculas = [
    { id: 1, aluno: 'António J. Silva', turma: '10ª A', data: '22 Dez 2024', status: 'confirmada' },
    { id: 2, aluno: 'Maria José', turma: '12ª B', data: '23 Dez 2024', status: 'pendente' },
    { id: 3, aluno: 'Carlos Bento', turma: '11ª C', data: '24 Dez 2024', status: 'analise' },
    { id: 4, aluno: 'Isabel Santos', turma: '9ª A', data: '24 Dez 2024', status: 'confirmada' },
    { id: 5, aluno: 'Pedro Manuel', turma: '10ª B', data: '25 Dez 2024', status: 'confirmada' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmada': return <span className="status-badge status-confirmed">Confirmada</span>;
      case 'pendente': return <span className="status-badge status-pending">Pendente</span>;
      case 'analise': return <span className="status-badge status-analysis">Em Análise</span>;
      default: return <span className="status-badge status-default">{status}</span>;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <h1>Painel Geral</h1>
        <p>Bem-vindo ao sistema de gestão escolar - SGMatrícula</p>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-card-header">
              <div className={`stat-icon card-${stat.type}`}>
                {stat.icon}
              </div>
              <div className={`stat-badge ${stat.trend.startsWith('+') ? 'trend-up' : 'trend-down'}`}>
                {stat.trend.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.trend}
              </div>
            </div>
            <h3>{stat.label}</h3>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h2>Fluxo de Matrículas</h2>
            <MoreVertical size={20} />
          </div>
          <div className="chart-container-large">
            <ResponsiveContainer debounce={100}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="matriculas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inscritos" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2>Status de Candidaturas</h2>
            <MoreVertical size={20} />
          </div>
          <div className="chart-container-large">
            <ResponsiveContainer debounce={100}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-chart-legend">
              {pieData.map((entry, index) => (
                <div key={index} className="legend-item">
                  <div className="legend-color-dot" style={{ backgroundColor: COLORS[index] }} />
                  <span className="legend-text">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="table-card">
        <h2>Matrículas Recentes</h2>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Estudante</th>
                <th>Turma</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentMatriculas.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="student-info">
                      <div className="student-avatar">
                        {item.aluno.charAt(0)}
                      </div>
                      <span>{item.aluno}</span>
                    </div>
                  </td>
                  <td className="turma-cell">{item.turma}</td>
                  <td className="date-cell">{item.data}</td>
                  <td>{getStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;