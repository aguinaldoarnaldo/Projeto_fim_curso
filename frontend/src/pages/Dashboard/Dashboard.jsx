import React, { useState, useMemo, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDataCache } from '../../hooks/useDataCache';
import CalendarWidget from '../../components/Dashboard/CalendarWidget';
import './Dashboard.css';
import { 
    Search, Bell, GraduationCap, Users, Home, Layers, BookOpen, Megaphone 
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';

const Dashboard = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  
  // Get user name for display
  const displayName = (user && (user.nome_completo || user.username || (user.email && user.email.split('@')[0]))) || 'Administrador';
  
  // Get initials
  const getInitials = (name) => {
      if (!name) return 'AD';
      const parts = name.split(' ');
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // 1. GLOBAL DASHBOARD DATA CACHE
  const fetchDashboardStats = async () => {
       const [
           responseCursos,
           responseClasses,
           responseSalas,
           responseAlunoStats, // CHANGED: now fetching stats directly
           responseTurmas,
           responseAnos
       ] = await Promise.all([
           api.get('cursos/').catch(e => ({ data: [] })),
           api.get('classes/').catch(e => ({ data: [] })),
           api.get('salas/').catch(e => ({ data: [] })),
           api.get('alunos/stats/').catch(e => ({ data: { total: 0, ativos: 0, genero: [], cursos: [] } })),
           api.get('turmas/summary/').catch(e => ({ data: { total: 0, ativas: 0, concluidas: 0 } })),
           api.get('anos-lectivos/').catch(e => ({ data: [] }))
       ]);

       // Process Counts
       const dataCursos = responseCursos.data?.results || responseCursos.data || [];
       const dataClasses = responseClasses.data?.results || responseClasses.data || [];
       const dataSalas = responseSalas.data?.results || responseSalas.data || [];
       const alunoStats = responseAlunoStats.data || { total: 0, ativos: 0, genero: [], cursos: [] };
       const turmasStats = responseTurmas.data || { total: 0, ativas: 0, concluidas: 0 };
       const dataAnos = responseAnos.data?.results || responseAnos.data || [];

       // Process Gender from Stats
       let countM = 0;
       let countF = 0;
       if (alunoStats.genero && Array.isArray(alunoStats.genero)) {
           const m = alunoStats.genero.find(g => g.genero === 'M');
           const f = alunoStats.genero.find(g => g.genero === 'F');
           countM = m ? m.total : 0;
           countF = f ? f.total : 0;
       }

       // Process Courses Top 5 from Stats
       const sortedCourses = (alunoStats.cursos || []).map(c => ({
           name: c.nome,
           qnty: c.total
       }));

       // Process Years
       let yearObjs = Array.isArray(dataAnos) ? dataAnos.map(a => ({ 
           id: a.id_ano, 
           nome: a.nome, 
           activo: a.activo 
       })) : [];
       
        if (!yearObjs.find(y => y.nome === '2024')) {
            yearObjs.push({ id: null, nome: '2024', activo: false });
        }
        // Sort ASCENDING (maiores primeiro: 2026, 2025, 2024...)
        yearObjs.sort((a, b) => a.nome.localeCompare(b.nome)).reverse();

       return {
           counts: {
               cursos: Array.isArray(dataCursos) ? dataCursos.length : 0,
               classes: Array.isArray(dataClasses) ? dataClasses.length : 0,
               salas: Array.isArray(dataSalas) ? dataSalas.length : 0,
           },
           kpi: {
               alunos: { total: alunoStats.total, ativos: alunoStats.ativos, trancados: 0 },
               turmas: { total: turmasStats.total, ativas: turmasStats.ativas, concluidas: turmasStats.concluidas }
           },
           gender: [
               { name: 'Masculino', value: countM },
               { name: 'Feminino', value: countF },
           ],
           courses: sortedCourses,
           years: yearObjs
       };
  };

  const { data: dashboardStats, loading: loadingStats, refresh: refreshStats } = useDataCache('dashboard_stats', fetchDashboardStats);

  // Default values from cache or initial
  const kpiData = dashboardStats?.kpi || { alunos: { total: 0, ativos: 0, trancados: 0 }, turmas: { total: 0, ativas: 0, concluidas: 0 } };
  const countCursos = dashboardStats?.counts?.cursos || 0;
  const countClasses = dashboardStats?.counts?.classes || 0;
  const countSalas = dashboardStats?.counts?.salas || 0;
  const genderData = dashboardStats?.gender || [{ name: 'Masculino', value: 0 }, { name: 'Feminino', value: 0 }];
  const courseData = dashboardStats?.courses || [];
  const academicYears = dashboardStats?.years || [];
  const COLORS_GENDER = ['#3b82f6', '#ec4899'];

   const currentYearStr = new Date().getFullYear().toString();
   const [selectedYear, setSelectedYear] = useState(currentYearStr);

   // Auto-select: prioriza ANO ATUAL, depois ano ativo, depois o mais recente
   useEffect(() => {
     if (academicYears.length > 0) {
         // 1. Prioridade: Ano atual (ex: 2026)
         const currentYear = academicYears.find(a => a.nome === currentYearStr);
         if (currentYear) {
             setSelectedYear(currentYear.nome);
             return;
         }
         
         // 2. Se não houver ano atual, tenta o ano marcado como "ativo"
         const activeYear = academicYears.find(a => a.activo);
         if (activeYear) {
             setSelectedYear(activeYear.nome);
             return;
         }
         
         // 3. Fallback: pega o mais recente que NÃO seja futuro
         const currentYearNum = parseInt(currentYearStr);
         const validYear = academicYears.find(a => parseInt(a.nome) <= currentYearNum);
         if (validYear) {
             setSelectedYear(validYear.nome);
         } else {
             // Se todos forem futuros, pega o primeiro mesmo
             setSelectedYear(academicYears[0].nome);
         }
     }
   }, [academicYears, currentYearStr]);



  // 2. CHART DATA CACHE - com carregamento instantâneo
  const fetchChartStats = useMemo(() => {
    return async () => {
      if (!selectedYear || academicYears.length === 0) return [];
      
      const yearObj = academicYears.find(y => y.nome === selectedYear);
      if (!yearObj || !yearObj.id) return [];

      try {
        const response = await api.get(`anos-lectivos/${yearObj.id}/stats_by_year/`);
        return response.data || [];
      } catch (error) {
        console.error('Erro ao carregar gráfico:', error);
        return [];
      }
    };
  }, [selectedYear, academicYears]);

  const { data: chartData = [], loading: loadingChart, refresh: refreshChart } = useDataCache(
    `dashboard_chart_${selectedYear}`, 
    fetchChartStats
  );

  // Force refresh when year changes (silent to use cache first)
  useEffect(() => {
    if (selectedYear && academicYears.length > 0) {
      refreshChart(true); // silent = usa cache primeiro, atualiza depois
    }
  }, [selectedYear, academicYears]);

  // Silent refresh interval for everything (Real-time update simulation)
  useEffect(() => {
      const interval = setInterval(() => {
          refreshStats(true); // silent = true (não ativa loading spinner)
          refreshChart(true);
      }, 5000); // Atualiza a cada 5 segundos para sensação de Tempo Real
      return () => clearInterval(interval);
  }, [refreshStats, refreshChart]);



  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-text">
          <h1>Olá, {displayName}</h1>
          <p>Visão geral e controle do sistema escolar.</p>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="kpi-grid">
        {/* 1. ALUNOS */}
        <div className="kpi-card card-premium-blue">
          <div className="kpi-icon-floating"><GraduationCap size={24} /></div>
          <div className="kpi-content">
            <h3>{kpiData.alunos.total}</h3>
            <span className="kpi-label">Total Alunos</span>
          </div>
          <div className="kpi-mini-stats">
            <span className="mini-stat active">Ativos: {kpiData.alunos.ativos}</span>
            <span className="mini-stat locked">Trancados: {kpiData.alunos.trancados}</span>
          </div>
        </div>

        {/* 2. TURMAS */}
        <div className="kpi-card card-premium-purple">
          <div className="kpi-icon-floating"><Users size={24} /></div>
          <div className="kpi-content">
            <h3>{kpiData.turmas.total}</h3>
            <span className="kpi-label">Total Turmas</span>
          </div>
          <div className="kpi-mini-stats">
            <span className="mini-stat active">Ativas: {kpiData.turmas.ativas}</span>
            <span className="mini-stat">Concluídas: {kpiData.turmas.concluidas}</span>
          </div>
        </div>

        {/* 3. SALAS */}
        <div className="kpi-card card-premium-orange">
          <div className="kpi-icon-floating"><Home size={24} /></div>
          <div className="kpi-content">
            <h3>{countSalas}</h3>
            <span className="kpi-label">Salas</span>
          </div>
        </div>

        {/* 4. CLASSES */}
        <div className="kpi-card card-premium-teal">
          <div className="kpi-icon-floating"><Layers size={24} /></div>
          <div className="kpi-content">
            <h3>{countClasses}</h3>
            <span className="kpi-label">Classes</span>
          </div>
        </div>

        {/* 5. CURSOS */}
        <div className="kpi-card card-premium-indigo">
          <div className="kpi-icon-floating"><BookOpen size={24} /></div>
          <div className="kpi-content">
            <h3>{countCursos}</h3>
            <span className="kpi-label">Cursos</span>
          </div>
        </div>
      </div>

      {/* GRID: CHARTS + CALENDAR */}
      <div className="dashboard-content-grid">

        {/* LEFT: Charts */}
        <div className="charts-column">

          {/* CHART 1: Enrollments Area Chart */}
          <div className="chart-card-new">
            <div className="chart-header">
              <div>
                <h2>Fluxo de Entrada</h2>
                <p>Matrículas e Inscrições (Comparativo)</p>
              </div>
              <select
                className="chart-filter-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {academicYears.length > 0 ? academicYears.map(year => (
                  <option key={year.nome} value={year.nome}>{year.nome}</option>
                )) : (
                     <option value="2024">2024</option>
                )}
              </select>
            </div>
            <div className="chart-body">
              {loadingChart ? (
                <div style={{ 
                  height: '280px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '14px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '10px' }}>⏳</div>
                    <div>Carregando dados de {selectedYear}...</div>
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div style={{ 
                  height: '280px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '14px'
                }}>
                  Sem dados disponíveis para {selectedYear}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280} debounce={300}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorIns" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Legend />
                    <Area type="monotone" dataKey="matriculas" name="Matrículas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMat)" />
                    <Area type="monotone" dataKey="inscritos" name="Inscrições" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorIns)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* CHARTS ROW: Gender & Course Distribution */}
          <div className="dashboard-charts-row">

            {/* CHART 2: Gender Donut Chart */}
            <div className="chart-card-new">
              <div className="chart-header">
                <div>
                  <h2>Distribuição por Género</h2>
                  <p>Equilíbrio entre Masculino e Feminino</p>
                </div>
              </div>
              <div className="chart-body gender-chart-body">
                <ResponsiveContainer width="100%" height="100%" debounce={300}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="60%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      startAngle={180}
                      endAngle={0}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      layout="horizontal"
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 3: Bar Chart for Courses */}
            <div className="chart-card-new">
              <div className="chart-header">
                <div>
                  <h2>Popularidade dos Cursos</h2>
                  <p>Inscrições por área de estudo</p>
                </div>
              </div>
              <div className="chart-body course-chart-body">
                <ResponsiveContainer width="100%" height="100%" debounce={300}>
                  <AreaChart
                    layout="vertical"
                    data={courseData.length > 0 ? courseData : [
                      { name: 'Sem dados', qnty: 0 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Area
                      type="monotone"
                      dataKey="qnty"
                      stroke="none"
                      fill="#6366f1"
                      fillOpacity={0.8}
                      radius={[0, 10, 10, 0]}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT: Calendar */}
        <div className="calendar-column">
          <div className="calendar-card-wrapper">
            <div className="calendar-title-card">
              <Megaphone size={20} className="shake-icon" />
              <span>Agenda & Feriados</span>
            </div>
            <CalendarWidget />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;