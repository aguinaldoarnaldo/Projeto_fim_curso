// SchoolManagementSystem.jsx
import React, { useState } from 'react';
import { Users, GraduationCap, AlertCircle, Home, UserPlus, BookOpen, School, DoorOpen, UsersRound, FileText, Settings, Menu, X, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './SchoolManagementSystem.css';

export default function SchoolManagementSystem() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'inscritos', label: 'Inscritos', icon: UserPlus },
    { id: 'matriculas', label: 'Matrículas', icon: BookOpen },
    { id: 'alunos', label: 'Alunos', icon: Users },
    { id: 'cursos', label: 'Cursos', icon: GraduationCap },
    { id: 'salas', label: 'Salas', icon: DoorOpen },
    { id: 'turmas', label: 'Turmas', icon: UsersRound },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'configuracoes', label: 'Configurações', icon: Settings }
  ];

  const statsCards = [
    { title: 'Total de Alunos', value: '847', icon: Users, change: '+5%', trend: 'up', colorClass: 'card-blue' },
    { title: 'Matrículas Ativas', value: '823', icon: GraduationCap, change: '+3%', trend: 'up', colorClass: 'card-green' },
    { title: 'Turmas Ativas', value: '32', icon: UsersRound, change: '0%', trend: 'neutral', colorClass: 'card-purple' },
    { title: 'Inscrições Pendentes', value: '15', icon: AlertCircle, change: '-2%', trend: 'down', colorClass: 'card-orange' }
  ];

  const enrollmentsByMonth = [
    { mes: 'Jan', alunos: 45 },
    { mes: 'Fev', alunos: 52 },
    { mes: 'Mar', alunos: 78 },
    { mes: 'Abr', alunos: 65 },
    { mes: 'Mai', alunos: 89 },
    { mes: 'Jun', alunos: 95 },
    { mes: 'Jul', alunos: 120 },
    { mes: 'Ago', alunos: 110 },
    { mes: 'Set', alunos: 98 },
    { mes: 'Out', alunos: 105 },
    { mes: 'Nov', alunos: 115 },
    { mes: 'Dez', alunos: 88 }
  ];

  const courseDistribution = [
    { nivel: '7ª Classe', alunos: 145 },
    { nivel: '8ª Classe', alunos: 138 },
    { nivel: '9ª Classe', alunos: 152 },
    { nivel: '10ª Classe', alunos: 128 },
    { nivel: '11ª Classe', alunos: 135 },
    { nivel: '12ª Classe', alunos: 125 }
  ];

  const recentEnrollments = [
    { id: 1, nome: 'João Miguel Silva', classe: '9ª Classe', data: '20/12/2024', status: 'Confirmada', turma: 'A' },
    { id: 2, nome: 'Maria Santos Costa', classe: '10ª Classe', data: '19/12/2024', status: 'Pendente', turma: 'B' },
    { id: 3, nome: 'Pedro António', classe: '8ª Classe', data: '18/12/2024', status: 'Confirmada', turma: 'A' },
    { id: 4, nome: 'Ana Ferreira', classe: '11ª Classe', data: '18/12/2024', status: 'Confirmada', turma: 'C' },
    { id: 5, nome: 'Carlos Mendes', classe: '7ª Classe', data: '17/12/2024', status: 'Em análise', turma: 'B' }
  ];

  const getStatusClass = (status) => {
    switch(status) {
      case 'Confirmada': return 'status-confirmed';
      case 'Pendente': return 'status-pending';
      case 'Em análise': return 'status-analysis';
      default: return 'status-default';
    }
  };

  const renderContent = () => {
    switch(activeMenu) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="page-header">
              <h1>Dashboard</h1>
              <p>Bem-vindo ao sistema de gestão escolar</p>
            </div>

            <div className="stats-grid">
              {statsCards.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-card-header">
                    <div className={`stat-icon ${stat.colorClass}`}>
                      <stat.icon size={24} />
                    </div>
                    <div className={`stat-badge trend-${stat.trend}`}>
                      <TrendingUp size={12} />
                      {stat.change}
                    </div>
                  </div>
                  <h3>{stat.title}</h3>
                  <p className="stat-value">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h2>Matrículas por Mês</h2>
                  <Calendar size={20} />
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={enrollmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="alunos" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h2>Alunos por Classe</h2>
                  <School size={20} />
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={courseDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="nivel" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Bar dataKey="alunos" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="table-card">
              <h2>Matrículas Recentes</h2>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nome do Aluno</th>
                      <th>Classe</th>
                      <th>Turma</th>
                      <th>Data</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEnrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td>
                          <div className="student-info">
                            <div className="student-avatar">
                              {enrollment.nome.charAt(0)}
                            </div>
                            <span>{enrollment.nome}</span>
                          </div>
                        </td>
                        <td>{enrollment.classe}</td>
                        <td className="turma-cell">{enrollment.turma}</td>
                        <td className="date-cell">{enrollment.data}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(enrollment.status)}`}>
                            {enrollment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="empty-state">
            <div className="empty-state-icon">
              {menuItems.find(item => item.id === activeMenu)?.icon && 
                React.createElement(menuItems.find(item => item.id === activeMenu).icon, {
                  size: 80
                })
              }
            </div>
            <h2>{menuItems.find(item => item.id === activeMenu)?.label}</h2>
            <p>Esta seção está em desenvolvimento</p>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && (
            <div className="sidebar-title">
              <h1>Sistema Escolar</h1>
              <p>Gestão Académica</p>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-toggle"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`nav-item ${activeMenu === item.id ? 'nav-item-active' : ''}`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="sidebar-info">
              <p className="info-label">Sistema de Gestão Escolar</p>
              <p className="info-version">Versão 1.0.0</p>
            </div>
          </div>
        )}
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}