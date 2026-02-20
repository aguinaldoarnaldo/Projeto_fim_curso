import React, { useState, useMemo, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDataCache } from '../../hooks/useDataCache';
import CalendarWidget from '../../components/Dashboard/CalendarWidget';
import './Dashboard.css';
import { 
    Search, Bell, GraduationCap, Users, Layers, BookOpen, Megaphone, DoorOpen 
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
   const fetchDashboardStats = async (yearName = null) => {
        const queryParams = yearName ? `?ano=${yearName}` : '';
        
        // Carregamento Estratégico em duas fases para não engasgar o navegador
        
        // Fase 1: Essencial (Anos Lectivos completos e Estatísticas para os Gráficos circulares)
        const [responseAnos, responseAlunoStats] = await Promise.all([
            api.get('anos-lectivos/?all=true').catch(e => ({ data: [] })),
            api.get(`alunos/stats/${queryParams}`).catch(e => ({ data: { total: 0, ativos: 0, genero: [], cursos: [] } }))
        ]);

        // Fase 2: Secundário (Contadores dos mini-cards)
        const [
            responseCursos,
            responseClasses,
            responseSalas,
            responseTurmas
        ] = await Promise.all([
            api.get('cursos/').catch(e => ({ data: [] })),
            api.get('classes/').catch(e => ({ data: [] })),
            api.get('salas/').catch(e => ({ data: [] })),
            api.get('turmas/summary/').catch(e => ({ data: { total: 0, ativas: 0, concluidas: 0 } }))
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

   const currentYearStr = new Date().getFullYear().toString();
   const [selectedYear, setSelectedYear] = useState(currentYearStr);

   const { data: dashboardStats, loading: loadingStats, refresh: refreshStats } = useDataCache(
     `dashboard_stats_${selectedYear || 'initial'}`, 
     () => fetchDashboardStats(selectedYear),
     false // Desativa auto-carregamento paralelo
   );

  // Default values from cache or initial
  const kpiData = dashboardStats?.kpi || { alunos: { total: 0, ativos: 0, trancados: 0 }, turmas: { total: 0, ativas: 0, concluidas: 0 } };
  const countCursos = dashboardStats?.counts?.cursos || 0;
  const countClasses = dashboardStats?.counts?.classes || 0;
  const countSalas = dashboardStats?.counts?.salas || 0;
  const genderData = dashboardStats?.gender || [{ name: 'Masculino', value: 0 }, { name: 'Feminino', value: 0 }];
  const courseData = dashboardStats?.courses || [];
  const academicYears = dashboardStats?.years || [];
   const COLORS_GENDER = ['#3b82f6', '#ec4899'];
   const [hasSyncActiveYear, setHasSyncActiveYear] = useState(false);

    // 1. Sincronização Inteligente Inicial
    // Se o ano atual (ex: 2026) não for encontrado exatamente, mas houver um ano ATIVO,
    // sincronizamos para o ano ativo apenas na primeira vez que os dados chegam.
    useEffect(() => {
        if (academicYears.length > 0 && !hasSyncActiveYear) {
            const hasExactMatch = academicYears.find(y => y.nome === selectedYear);
            if (!hasExactMatch) {
                const activeYear = academicYears.find(y => y.activo);
                if (activeYear) {
                    setSelectedYear(activeYear.nome);
                }
            }
            setHasSyncActiveYear(true);
        }
    }, [academicYears, selectedYear, hasSyncActiveYear]);

   // REGRAS: Removido o auto-selecionamento para que a escolha do usuário seja mantida.
   // O valor inicial é definido na criação do estado (currentYearStr).



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
     fetchChartStats,
     false // Desativa auto-carregamento paralelo
   );

   // CARREGAMENTO SEQUENCIAL: Um de cada vez para não sobrecarregar
   useEffect(() => {
     const loadSequence = async () => {
       if (!selectedYear) return;

       // Passo 1: Carrega estatísticas básicas e contadores (KPIs + Gênero + Cursos)
       await refreshStats(false); 
     };
     loadSequence();
   }, [selectedYear]);

   // Passo 2: Só dispara o gráfico de fluxo DEPOIS que as estatísticas básicas (que trazem a lista de anos) terminarem
   useEffect(() => {
     if (selectedYear && academicYears.length > 0) {
       const loadFlowChart = async () => {
         await refreshChart(false);
       };
       loadFlowChart();
     }
   }, [selectedYear, academicYears.length > 0]);

  // Silent refresh interval for everything (Real-time update simulation)
  useEffect(() => {
      const interval = setInterval(() => {
          refreshStats(true); // silent = true (não ativa loading spinner)
          refreshChart(true);
      }, 60000); // Atualiza a cada 60 segundos para evitar sobrecarga
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
        {hasPermission(PERMISSIONS.VIEW_ALUNOS) && (
          <div className="kpi-card card-premium-blue">
            <div className="kpi-icon-floating"><Users size={24} /></div>
            <div className="kpi-content">
              <h3>{kpiData.alunos.total}</h3>
              <span className="kpi-label">Total Alunos</span>
            </div>
            <div className="kpi-mini-stats">
              <span className="mini-stat active">Ativos: {kpiData.alunos.ativos}</span>
              <span className="mini-stat locked">Trancados: {kpiData.alunos.trancados}</span>
            </div>
          </div>
        )}

        {/* 2. TURMAS */}
        {hasPermission(PERMISSIONS.VIEW_TURMAS) && (
          <div className="kpi-card card-premium-purple">
            <div className="kpi-icon-floating"><Layers size={24} /></div>
            <div className="kpi-content">
              <h3>{kpiData.turmas.total}</h3>
              <span className="kpi-label">Total Turmas</span>
            </div>
            <div className="kpi-mini-stats">
              <span className="mini-stat active">Ativas: {kpiData.turmas.ativas}</span>
              <span className="mini-stat">Concluídas: {kpiData.turmas.concluidas}</span>
            </div>
          </div>
        )}

        {/* 3. SALAS */}
        {hasPermission(PERMISSIONS.VIEW_SALAS) && (
          <div className="kpi-card card-premium-orange">
            <div className="kpi-icon-floating"><DoorOpen size={24} /></div>
            <div className="kpi-content">
              <h3>{countSalas}</h3>
              <span className="kpi-label">Salas</span>
            </div>
          </div>
        )}

        {/* 4. CLASSES */}
        {hasPermission(PERMISSIONS.VIEW_CURSOS) && (
          <div className="kpi-card card-premium-teal">
            <div className="kpi-icon-floating"><BookOpen size={24} /></div>
            <div className="kpi-content">
              <h3>{countClasses}</h3>
              <span className="kpi-label">Classes</span>
            </div>
          </div>
        )}

        {/* 5. CURSOS */}
        {hasPermission(PERMISSIONS.VIEW_CURSOS) && (
          <div className="kpi-card card-premium-indigo">
            <div className="kpi-icon-floating"><GraduationCap size={24} /></div>
            <div className="kpi-content">
              <h3>{countCursos}</h3>
              <span className="kpi-label">Cursos</span>
            </div>
          </div>
        )}
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
                {academicYears.length > 0 ? (
                  <>
                    <optgroup label="Anos Principais">
                      {academicYears.filter(y => y.activo || parseInt(y.nome) >= new Date().getFullYear() - 2).map(year => (
                        <option key={year.nome} value={year.nome}>
                          {year.nome} {year.activo ? '(Ativo)' : ''}
                        </option>
                      ))}
                    </optgroup>
                    
                    {academicYears.filter(y => !y.activo && parseInt(y.nome) < new Date().getFullYear() - 2).length > 0 && (
                      <optgroup label="Histórico / Anos Anteriores">
                        {academicYears.filter(y => !y.activo && parseInt(y.nome) < new Date().getFullYear() - 2).map(year => (
                          <option key={year.nome} value={year.nome}>
                            {year.nome}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                ) : (
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
                <ResponsiveContainer width="100%" height={Math.max(280, courseData.length * 45)} debounce={300}>
                  <AreaChart
                    layout="vertical"
                    data={courseData.length > 0 ? courseData : [
                      { name: 'Sem dados', qnty: 0 }
                    ]}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      width={140}
                    />
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