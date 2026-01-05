import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart2,
  Users,
  FileText,
  BookOpen,
  Users as TurmasIcon,
  Home,
  GraduationCap,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { name: 'Dashboard', icon: <BarChart2 size={20} />, path: '/dashboard' },
    { name: 'Matrículas', icon: <FileText size={20} />, path: '/matriculas' },
    { name: 'Inscritos', icon: <Users size={20} />, path: '/inscrito' },
    { name: 'Alunos', icon: <GraduationCap size={20} />, path: '/alunos' },
    { name: 'Turmas', icon: <TurmasIcon size={20} />, path: '/turma' },
    { name: 'Salas', icon: <Home size={20} />, path: '/salas' },
    { name: 'Classes', icon: <BookOpen size={20} />, path: '/classe' },
    { name: 'Cursos', icon: <GraduationCap size={20} />, path: '/cursos' },
    { name: 'Relatórios', icon: <FileText size={20} />, path: '/relatorios' },
    { name: 'Configurações', icon: <Settings size={20} />, path: '/configuracoes' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        {isOpen && (
          <div className="sidebar-title">
            <h1>Sistema Escolar</h1>
            <p>Gestão Académica</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            {item.icon}
            {isOpen && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn">
          <LogOut size={20} />
          {isOpen && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
