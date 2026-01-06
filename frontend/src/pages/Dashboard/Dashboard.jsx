import React, { useState, useMemo } from 'react';
import './Dashboard.css';
import {
  Users,
  Home,
  BookOpen,
  GraduationCap,
  Layers,
  Search,
  Bell,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Megaphone
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

// --- MOCK DATA ---

const kpiData = {
  alunos: { total: 1250, ativos: 1100, trancados: 50, concluidos: 100 },
  turmas: { total: 42, concluidas: 12 },
  salas: 24,
  classes: 6,
  cursos: 8,
};

const historicalData = {
  '2024': [
    { mes: 'Jan', matriculas: 150, inscritos: 300 },
    { mes: 'Fev', matriculas: 120, inscritos: 100 },
    { mes: 'Mar', matriculas: 60, inscritos: 40 },
    { mes: 'Ago', matriculas: 50, inscritos: 80 },
    { mes: 'Set', matriculas: 40, inscritos: 60 },
  ],
  '2025': [
    { mes: 'Jan', matriculas: 180, inscritos: 350 },
    { mes: 'Fev', matriculas: 90, inscritos: 120 },
  ]
};

const genderData = [
  { name: 'Masculino', value: 580 },
  { name: 'Feminino', value: 670 },
];

const COLORS_GENDER = ['#3b82f6', '#ec4899'];

// --- ANGOLA CALENDAR LOGIC ---

const ANGOLA_HOLIDAYS = {
  '1-1': 'Ano Novo',
  '4-2': 'Início da Luta Armada',
  '8-3': 'Dia Internacional da Mulher',
  '23-3': 'Dia da Libertação da África Austral',
  '4-4': 'Dia da Paz e Reconciliação',
  '1-5': 'Dia do Trabalhador',
  '17-9': 'Dia do Fundador da Nação e do Herói Nacional',
  '2-11': 'Dia dos Finados',
  '11-11': 'Dia da Independência',
  '25-12': 'Natal'
};

const EVENT_DATES = {
  '15-1': 'Início das Inscrições',
  '5-2': 'Início das Aulas'
};

const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${i}-${currentDate.getMonth() + 1}`;
      const isHoliday = ANGOLA_HOLIDAYS[dateKey];
      const isEvent = EVENT_DATES[dateKey];
      const isToday = i === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

      days.push(
        <div
          key={i}
          className={`calendar-day 
                        ${isToday ? 'is-today' : ''} 
                        ${isHoliday ? 'is-holiday' : ''}
                        ${isEvent ? 'is-event' : ''}
                    `}
          title={isHoliday || isEvent || ''}
        >
          <span>{i}</span>
          {isHoliday && <div className="dot-marker holiday"></div>}
          {isEvent && <div className="dot-marker event"></div>}
        </div>
      );
    }
    return days;
  };

  // Get Holiday or Event name for selected month display
  const getMonthEvents = () => {
    const notes = [];
    const daysInMonth = getDaysInMonth(currentDate);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${i}-${currentDate.getMonth() + 1}`;
      if (ANGOLA_HOLIDAYS[dateKey]) notes.push({ day: i, type: 'Feriado', name: ANGOLA_HOLIDAYS[dateKey] });
      if (EVENT_DATES[dateKey]) notes.push({ day: i, type: 'Evento', name: EVENT_DATES[dateKey] });
    }
    return notes;
  };

  const monthNotes = getMonthEvents();

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <button onClick={prevMonth} className="btn-cal-nav"><ChevronLeft size={16} /></button>
        <h3>{currentDate.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={nextMonth} className="btn-cal-nav"><ChevronRight size={16} /></button>
      </div>
      <div className="calendar-weekdays">
        <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
      </div>
      <div className="calendar-grid">
        {renderDays()}
      </div>

      {/* Legend / Upcoming */}
      <div className="calendar-footer">
        <h4>Eventos do Mês</h4>
        {monthNotes.length > 0 ? (
          <div className="calendar-notes-list">
            {monthNotes.map((note, idx) => (
              <div key={idx} className={`note-item ${note.type === 'Feriado' ? 'note-holiday' : 'note-event'}`}>
                <span className="note-day">{note.day}</span>
                <span className="note-name">{note.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-events-text">Nenhum feriado ou evento este mês.</p>
        )}
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---

const Dashboard = () => {
  const [selectedYear, setSelectedYear] = useState('2024');

  const chartData = useMemo(() => {
    return historicalData[selectedYear] || [];
  }, [selectedYear]);

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-text">
          <h1>Olá, Administrador 👋</h1>
          <p>Visão geral e controle do sistema escolar.</p>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} className="dashboard-search-icon" />
            <input type="text" placeholder="Pesquisar..." />
          </div>
          <button className="btn-icon circle-btn">
            <Bell size={20} />
            <span className="notification-badge"></span>
          </button>
          <div className="user-profile">
            <div className="avatar">AD</div>
          </div>
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
            <span className="mini-stat">Concluídas: {kpiData.turmas.concluidas}</span>
          </div>
        </div>

        {/* 3. SALAS */}
        <div className="kpi-card card-premium-orange">
          <div className="kpi-icon-floating"><Home size={24} /></div>
          <div className="kpi-content">
            <h3>{kpiData.salas}</h3>
            <span className="kpi-label">Salas</span>
          </div>
        </div>

        {/* 4. CLASSES */}
        <div className="kpi-card card-premium-teal">
          <div className="kpi-icon-floating"><Layers size={24} /></div>
          <div className="kpi-content">
            <h3>{kpiData.classes}</h3>
            <span className="kpi-label">Classes</span>
          </div>
        </div>

        {/* 5. CURSOS */}
        <div className="kpi-card card-premium-indigo">
          <div className="kpi-icon-floating"><BookOpen size={24} /></div>
          <div className="kpi-content">
            <h3>{kpiData.cursos}</h3>
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
                {Object.keys(historicalData).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={280}>
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

          {/* CHART 2: Gender Pie Chart */}
          <div className="chart-card-new">
            <div className="chart-header">
              <div>
                <h2>Distribuição por Género</h2>
                <p>Total de alunos Masculino vs Feminino</p>
              </div>
            </div>
            <div className="chart-body row-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
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