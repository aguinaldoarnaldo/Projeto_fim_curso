import React, { useState, useMemo, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCache } from '../../context/CacheContext';
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

const Dashboard = () => {
  const { user } = useAuth();
  const { getCache, setCache } = useCache();
  
  // Get user name for display
  const displayName = (user && (user.nome_completo || user.username || (user.email && user.email.split('@')[0]))) || 'Administrador';
  
  // Get initials
  const getInitials = (name) => {
      if (!name) return 'AD';
      const parts = name.split(' ');
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const [selectedYear, setSelectedYear] = useState('2024');
  const [countCursos, setCountCursos] = useState(() => getCache('dashboard_course_count') || 0);
  const [countClasses, setCountClasses] = useState(() => getCache('dashboard_classes_count') || 0);
  const [countSalas, setCountSalas] = useState(() => getCache('dashboard_salas_count') || 0);

  const [kpiData, setKpiData] = useState(() => {
      const cached = getCache('dashboard_kpi_data');
      return cached || {
        alunos: { total: 0, ativos: 0, trancados: 0 },
        turmas: { total: 0, ativas: 0, concluidas: 0 }
      };
  });

  // Mock Data for Charts
  // Dynamic Data States
  const [academicYears, setAcademicYears] = useState([]);
  const [chartDataByYear, setChartDataByYear] = useState({
     '2024': [
        { mes: 'Jan', matriculas: 40, inscritos: 24 },
        { mes: 'Fev', matriculas: 30, inscritos: 13 },
        { mes: 'Mar', matriculas: 20, inscritos: 58 },
        { mes: 'Abr', matriculas: 27, inscritos: 39 },
        { mes: 'Mai', matriculas: 18, inscritos: 48 },
        { mes: 'Jun', matriculas: 23, inscritos: 38 },
        { mes: 'Jul', matriculas: 34, inscritos: 43 },
        { mes: 'Ago', matriculas: 44, inscritos: 53 },
        { mes: 'Set', matriculas: 54, inscritos: 63 },
        { mes: 'Out', matriculas: 64, inscritos: 73 },
        { mes: 'Nov', matriculas: 74, inscritos: 83 },
        { mes: 'Dez', matriculas: 84, inscritos: 93 },
      ]
  }); // Will be populated with real data or combined with mock

  const [genderData, setGenderData] = useState([
      { name: 'Masculino', value: 0 },
      { name: 'Feminino', value: 0 },
  ]);
  const [courseData, setCourseData] = useState([]);
  const COLORS_GENDER = ['#3b82f6', '#ec4899'];

    useEffect(() => {
     const fetchCounts = async () => {
         try {
             const [
                 responseCursos,
                 responseClasses,
                 responseSalas,
                 responseAlunos,
                 responseTurmas,
                 responseAnos
             ] = await Promise.all([
                 api.get('cursos/').catch(e => ({ data: [] })),
                 api.get('classes/').catch(e => ({ data: [] })),
                 api.get('salas/').catch(e => ({ data: [] })),
                 api.get('alunos/').catch(e => ({ data: [] })),
                 api.get('turmas/summary/').catch(e => ({ data: { total: 0, ativas: 0, concluidas: 0 } })),
                 api.get('anos-lectivos/').catch(e => ({ data: [] }))
             ]);

             // Process Cursos
             const dataCursos = responseCursos.data.results || responseCursos.data || [];
             const countC = Array.isArray(dataCursos) ? dataCursos.length : 0;
             setCountCursos(countC);
             setCache('dashboard_course_count', countC);

             // Process Classes
             const dataClasses = responseClasses.data.results || responseClasses.data || [];
             const countCl = Array.isArray(dataClasses) ? dataClasses.length : 0;
             setCountClasses(countCl);
             setCache('dashboard_classes_count', countCl);

             // Process Salas
             const dataSalas = responseSalas.data.results || responseSalas.data || [];
             const countS = Array.isArray(dataSalas) ? dataSalas.length : 0;
             setCountSalas(countS);
             setCache('dashboard_salas_count', countS);

             // Process Alunos
             const dataAlunos = responseAlunos.data.results || responseAlunos.data || [];
             const countAlunos = Array.isArray(dataAlunos) ? dataAlunos.length : 0;

             // Calculate Gender Distribution
             let countM = 0;
             let countF = 0;
             if (Array.isArray(dataAlunos)) {
                 dataAlunos.forEach(aluno => {
                     if (aluno.genero === 'M') countM++;
                     else if (aluno.genero === 'F') countF++;
                 });
             }
             setGenderData([
                 { name: 'Masculino', value: countM },
                 { name: 'Feminino', value: countF },
             ]);

             // Calculate Course Popularity
             const courseMap = {};
             if (Array.isArray(dataAlunos)) {
                 dataAlunos.forEach(aluno => {
                     const cName = aluno.curso_nome || 'Outros';
                     if (cName) {
                         courseMap[cName] = (courseMap[cName] || 0) + 1;
                     }
                 });
             }
             const sortedCourses = Object.keys(courseMap)
                 .map(key => ({ name: key, qnty: courseMap[key] }))
                 .sort((a, b) => b.qnty - a.qnty)
                 .slice(0, 5);
             setCourseData(sortedCourses);

             // Process Turmas
             const turmasStats = responseTurmas.data || { total: 0, ativas: 0, concluidas: 0 };

             const newKpiData = {
                alunos: { total: countAlunos, ativos: countAlunos, trancados: 0 },
                turmas: { 
                    total: turmasStats.total, 
                    ativas: turmasStats.ativas, 
                    concluidas: turmasStats.concluidas 
                }
             };

             setKpiData(newKpiData);
             setCache('dashboard_kpi_data', newKpiData);

             // Process Anos Lectivos
             const dataAnos = responseAnos.data.results || responseAnos.data || [];
             
             // Map to objects
             let yearObjs = Array.isArray(dataAnos) ? dataAnos.map(a => ({ 
                 id: a.id_ano, 
                 nome: a.nome, 
                 activo: a.activo 
             })) : [];

             // Ensure 2024 exists (Legacy/Mock)
             if (!yearObjs.find(y => y.nome === '2024')) {
                 yearObjs.push({ id: null, nome: '2024', activo: false });
             }
             
             // Sort by name
             yearObjs.sort((a, b) => a.nome.localeCompare(b.nome));
             
             setAcademicYears(yearObjs);
                 
             // Smart selection: active year -> last year -> first year
             // Only change selection if currently default '2024' or invalid
             const activeYear = yearObjs.find(a => a.activo);
             if (activeYear) {
                 if (selectedYear === '2024') setSelectedYear(activeYear.nome);
             } else if (yearObjs.length > 0 && !yearObjs.find(y => y.nome === selectedYear)) {
                 setSelectedYear(yearObjs[yearObjs.length - 1].nome);
             }

             // Start with existing chart data
             const newChartData = { ...chartDataByYear };
             
             // Initialize empty structure for new years to avoid crashes before fetch
             yearObjs.forEach(year => {
                 if (!newChartData[year.nome]) {
                     newChartData[year.nome] = [
                        { mes: 'Jan', matriculas: 0, inscritos: 0 },
                        { mes: 'Fev', matriculas: 0, inscritos: 0 },
                        { mes: 'Mar', matriculas: 0, inscritos: 0 },
                        { mes: 'Abr', matriculas: 0, inscritos: 0 },
                        { mes: 'Mai', matriculas: 0, inscritos: 0 },
                        { mes: 'Jun', matriculas: 0, inscritos: 0 },
                        { mes: 'Jul', matriculas: 0, inscritos: 0 },
                        { mes: 'Ago', matriculas: 0, inscritos: 0 },
                        { mes: 'Set', matriculas: 0, inscritos: 0 },
                        { mes: 'Out', matriculas: 0, inscritos: 0 },
                        { mes: 'Nov', matriculas: 0, inscritos: 0 },
                        { mes: 'Dez', matriculas: 0, inscritos: 0 },
                     ];
                 }
             });
             setChartDataByYear(newChartData);


         } catch (error) {
             console.error("Error fetching dashboard counts", error);
         }
     };
     
    fetchCounts();
     const interval = setInterval(fetchCounts, 30000); // 30 seconds
     return () => clearInterval(interval);
   }, [setCache]);

   // Fetch stats for specific year when selected
   useEffect(() => {
        const fetchYearStats = async () => {
             const yearObj = academicYears.find(y => y.nome === selectedYear);
             if (yearObj && yearObj.id) {
                 try {
                     const response = await api.get(`anos-lectivos/${yearObj.id}/stats_by_year/`);
                     setChartDataByYear(prev => ({
                         ...prev,
                         [selectedYear]: response.data
                     }));
                 } catch (e) {
                     console.error("Error fetching stats for year", selectedYear, e);
                 }
             }
        };
        
        if (selectedYear && academicYears.length > 0) {
            fetchYearStats();
        }
   }, [selectedYear, academicYears]);

  const chartData = useMemo(() => {
    return chartDataByYear[selectedYear] || [];
  }, [selectedYear, chartDataByYear]);

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