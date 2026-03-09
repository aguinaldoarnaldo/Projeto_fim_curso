import React, { useState, useMemo, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDataCache } from '../../hooks/useDataCache';
import CalendarWidget from '../../components/Dashboard/CalendarWidget';
import './Dashboard.css';
import { 
    Search, Bell, GraduationCap, Users, Layers, BookOpen, Megaphone, DoorOpen, ClipboardCheck 
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';

import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';

const Dashboard = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  const displayName = (user && (user.nome_completo || user.username || (user.email && typeof user.email === 'string' && user.email.split('@')[0]))) || 'Administrador';
  
  const currentYearStr = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [hasSyncActiveYear, setHasSyncActiveYear] = useState(false);

  // 1. GLOBAL STATS FETCHING (KPIs, Years, Gender, Courses)
  const fetchDashboardStats = useCallback(async () => {
    const q = selectedYear ? `?ano=${encodeURIComponent(selectedYear)}` : '';
    try {
      const [rAnos, rStats, rMatriculas, rTurmas, rCursos, rClasses, rSalas] = await Promise.all([
        api.get('anos-lectivos/?all=true').catch(() => ({ data: [] })),
        api.get(`alunos/stats/${q}`).catch(() => ({ data: { total: 0, ativos: 0, genero: [], cursos: [] } })),
        api.get(`matriculas/summary/${q}`).catch(() => ({ data: { total: 0, breakdown: {} } })),
        api.get('turmas/summary/').catch(() => ({ data: { total: 0, ativas: 0 } })),
        api.get('cursos/').catch(() => ({ data: [] })),
        api.get('classes/').catch(() => ({ data: [] })),
        api.get('salas/').catch(() => ({ data: [] }))
      ]);

      const anos = rAnos.data?.results || rAnos.data || [];
      const stats = rStats.data || {};
      
      return {
        years: anos.map(y => ({ 
          id: y.id_ano, 
          nome: y.nome, 
          activo: y.activo,
          inicio_inscricoes: y.inicio_inscricoes,
          fim_inscricoes: y.fim_inscricoes,
          inicio_matriculas: y.inicio_matriculas,
          fim_matriculas: y.fim_matriculas,
          data_exame_admissao: y.data_exame_admissao,
          data_teste_diagnostico: y.data_teste_diagnostico
        })),
        kpis: {
          alunos: { 
            total: stats.total || 0, 
            ativos: stats.ativos || 0,
            concluidos: stats.concluidos || 0,
            inativos: stats.inativos || 0,
            transferidos: stats.transferidos || 0
          },
          matriculas: {
            total: rMatriculas.data?.total_ano || 0,
            total_geral: rMatriculas.data?.total_geral || 0,
            ativa: rMatriculas.data?.breakdown?.Ativa || 0,
            concluida: rMatriculas.data?.breakdown?.Concluida || 0,
            desistente: rMatriculas.data?.breakdown?.Desistente || 0,
            transferido: rMatriculas.data?.breakdown?.Transferido || 0
          },
          turmas: { 
            total: rTurmas.data?.total || 0, 
            ativas: rTurmas.data?.ativas || 0,
            concluidas: rTurmas.data?.concluidas || 0
          }
        },
        counts: {
          cursos: rCursos.data?.results?.length || rCursos.data?.length || 0,
          classes: rClasses.data?.results?.length || rClasses.data?.length || 0,
          salas: rSalas.data?.results?.length || rSalas.data?.length || 0
        },
        gender: [
          { name: 'Masculino', value: stats.genero?.find(g => g.genero === 'M')?.total || 0 },
          { name: 'Feminino', value: stats.genero?.find(g => g.genero === 'F')?.total || 0 }
        ],
        courses: (stats.cursos || []).map(c => ({ name: c.nome, qnty: c.total }))
      };
    } catch (err) {
      console.error("Dashboard Stats Fetch Error:", err);
      return null;
    }
  }, [selectedYear]);

  const { data: dbData, loading: loadingStats, refresh: refreshStats } = useDataCache(
    `db_stats_${selectedYear}`, fetchDashboardStats, false
  );

  const academicYears = useMemo(() => dbData?.years || [], [dbData]);
  const kpiData = useMemo(() => {
    const base = dbData?.kpis || {};
    return {
      alunos: base.alunos || { total: 0, ativos: 0, concluidos: 0, inativos: 0, transferidos: 0 },
      matriculas: base.matriculas || { total: 0, total_geral: 0, ativa: 0, concluida: 0, desistente: 0, transferido: 0 },
      turmas: base.turmas || { total: 0, ativas: 0, concluidas: 0 }
    };
  }, [dbData]);
  const counts = useMemo(() => dbData?.counts || { cursos: 0, classes: 0, salas: 0 }, [dbData]);
  const genderData = useMemo(() => dbData?.gender || [], [dbData]);
  const courseData = useMemo(() => dbData?.courses || [], [dbData]);

  // Sync year selection to active year once loaded
  useEffect(() => {
    if (academicYears.length > 0 && !hasSyncActiveYear) {
      const active = academicYears.find(y => y.activo);
      if (active && active.nome !== selectedYear) {
        setSelectedYear(active.nome);
      }
      setHasSyncActiveYear(true);
    }
  }, [academicYears, hasSyncActiveYear, selectedYear]);

  // Initial and reactive trigger for core stats
  useEffect(() => {
    refreshStats(false);
  }, [selectedYear, refreshStats]);

  // 2. FLOW CHART DATA FETCHING
  const fetchFlowStats = useCallback(async () => {
    if (!selectedYear || academicYears.length === 0) return [];
    const yearObj = academicYears.find(y => y.nome === selectedYear);
    if (!yearObj?.id) return [];

    try {
      const response = await api.get(`anos-lectivos/${yearObj.id}/stats_by_year/`);
      return response.data || [];
    } catch (err) {
      console.error("Flow Stats Fetch Error:", err);
      return [];
    }
  }, [selectedYear, academicYears]);

  const { data: flowData = [], loading: loadingFlow, refresh: refreshFlow } = useDataCache(
    `db_flow_${selectedYear}`, fetchFlowStats, false
  );

  // Trigger flow data when core stats (years list) become available
  useEffect(() => {
    if (academicYears.length > 0) {
      refreshFlow(false);
    }
  }, [academicYears, selectedYear, refreshFlow]);

  const COLORS_GENDER = ['#3b82f6', '#ec4899'];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-text">
          <h1>Olá, {displayName}</h1>
          <p>Visão geral e controle do sistema escolar.</p>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi-card card-premium-green">
          <div className="kpi-icon-floating"><ClipboardCheck size={24} /></div>
          <div className="kpi-content"><h3>{kpiData.matriculas?.total_geral || 0}</h3><span className="kpi-label">Total Matrículas</span></div>
          <div className="kpi-mini-stats">
            <span className="mini-stat active">Ativas: {kpiData.matriculas?.ativa || 0}</span>
            <span className="mini-stat completed">Concluídas: {kpiData.matriculas?.concluida || 0}</span>
            <span className="mini-stat inactive">Desistentes: {kpiData.matriculas?.desistente || 0}</span>
            <span className="mini-stat transferred">Transferidos: {kpiData.matriculas?.transferido || 0}</span>
          </div>
        </div>
        
        <div className="kpi-card card-premium-blue">
          <div className="kpi-icon-floating"><Users size={24} /></div>
          <div className="kpi-content"><h3>{kpiData.alunos.total}</h3><span className="kpi-label">Total Alunos</span></div>
          <div className="kpi-mini-stats">
            <span className="mini-stat active">Ativos: {kpiData.alunos.ativos}</span>
            <span className="mini-stat completed">Concluídos: {kpiData.alunos.concluidos}</span>
            <span className="mini-stat inactive">Inativos: {kpiData.alunos.inativos}</span>
            <span className="mini-stat transferred">Transferidos: {kpiData.alunos.transferidos}</span>
          </div>
        </div>
        
        <div className="kpi-card card-premium-purple">
          <div className="kpi-icon-floating"><Layers size={24} /></div>
          <div className="kpi-content"><h3>{kpiData.turmas.total}</h3><span className="kpi-label">Total Turmas</span></div>
          <div className="kpi-mini-stats">
            <span className="mini-stat active">Ativas: {kpiData.turmas.ativas}</span>
            <span className="mini-stat completed">Concluídas: {kpiData.turmas.concluidas}</span>
          </div>
        </div>
        <div className="kpi-card card-premium-orange">
          <div className="kpi-icon-floating"><DoorOpen size={24} /></div>
          <div className="kpi-content"><h3>{counts.salas}</h3><span className="kpi-label">Salas</span></div>
        </div>
        <div className="kpi-card card-premium-teal">
          <div className="kpi-icon-floating"><BookOpen size={24} /></div>
          <div className="kpi-content"><h3>{counts.classes}</h3><span className="kpi-label">Classes</span></div>
        </div>
        <div className="kpi-card card-premium-indigo">
          <div className="kpi-icon-floating"><GraduationCap size={24} /></div>
          <div className="kpi-content"><h3>{counts.cursos}</h3><span className="kpi-label">Cursos</span></div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="charts-column">
          <div className="chart-card-new">
            <div className="chart-header">
              <div><h2>Fluxo de Entrada</h2><p>Matrículas e Inscrições (Comparativo)</p></div>
              <select className="chart-filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {academicYears.map(year => (
                  <option key={year.nome} value={year.nome}>{year.nome} {year.activo ? '(Ativo)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="chart-body" style={{ minHeight: '340px' }}>
              {loadingFlow ? <div className="no-data">Carregando dados...</div> : 
               flowData.length === 0 ? <div className="no-data">Sem dados para {selectedYear}</div> : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={flowData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" />
                      <Area type="monotone" dataKey="matriculas" name="Matrículas" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorMat)" />
                      <Area type="monotone" dataKey="inscritos" name="Inscrições" stroke="#f59e0b" strokeWidth={4} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-charts-row">
            <div className="chart-card-new">
              <div className="chart-header"><div><h2>Distribuição por Género</h2><p>Masculino e Feminino</p></div></div>
              <div className="chart-body" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="65%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" startAngle={180} endAngle={0}>
                      {genderData.map((entry, index) => <Cell key={index} fill={COLORS_GENDER[index % 2]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card-new">
              <div className="chart-header"><div><h2>Popularidade dos Cursos</h2><p>Inscritos por curso</p></div></div>
              <div className="chart-body" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={courseData} margin={{ left: 10, right: 30, top: 20, bottom: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="qnty" name="Alunos" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="calendar-column">
          <div className="calendar-card-wrapper">
             <div className="calendar-title-card"><Megaphone size={20} /> <span>Agenda & Feriados</span></div>
             <CalendarWidget scheduling={academicYears.find(y => y.nome === selectedYear)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;