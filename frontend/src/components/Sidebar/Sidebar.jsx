import React, { useState } from 'react';
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
  ChevronRight,
  ClipboardList,
  X
} from 'lucide-react';
import logo from '../../assets/img/logo_ipm2.png';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { signOut } = useAuth();
  const { hasPermission } = usePermission();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const handleLogoutClick = () => {
      setShowLogoutModal(true);
  };

  const confirmLogout = () => {
      signOut();
      setShowLogoutModal(false);
  };

  const menuItems = [
    { name: 'Dashboard', icon: <BarChart2 size={20} />, path: '/dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { name: 'Inscritos', icon: <Users size={20} />, path: '/inscrito', permission: PERMISSIONS.VIEW_INSCRITOS },
    { name: 'Lista de Espera', icon: <ClipboardList size={20} />, path: '/lista-espera', permission: PERMISSIONS.VIEW_INSCRITOS },
    { name: 'Matrículas', icon: <FileText size={20} />, path: '/matriculas', permission: PERMISSIONS.VIEW_MATRICULAS },
    { name: 'Alunos', icon: <GraduationCap size={20} />, path: '/alunos', permission: PERMISSIONS.VIEW_ALUNOS },
    { name: 'Turmas', icon: <TurmasIcon size={20} />, path: '/turma', permission: PERMISSIONS.VIEW_TURMAS },
    { name: 'Salas', icon: <Home size={20} />, path: '/salas', permission: PERMISSIONS.VIEW_SALAS },
    { name: 'Cursos', icon: <BookOpen size={20} />, path: '/cursos', permission: PERMISSIONS.VIEW_CURSOS },
    { name: 'Relatórios', icon: <FileText size={20} />, path: '/relatorios', permission: PERMISSIONS.VIEW_RELATORIOS },
    { name: 'Configurações', icon: <Settings size={20} />, path: '/configuracoes', permission: PERMISSIONS.VIEW_CONFIGURACOES },
  ];

  return (
    <>
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        {isOpen ? (
          <div className="sidebar-brand">
            <img src={logo} alt="Logo" className="sidebar-logo" />
            <div className="sidebar-title">
              <h1>Sistema Gestão Matriculas</h1>
              <p>Gestão Académica</p>
            </div>
          </div>
        ) : (
          <img src={logo} alt="Logo" className="sidebar-logo-small" />
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
        <button className="nav-item logout-btn" onClick={handleLogoutClick}>
          <LogOut size={22} />
          {isOpen && <span>Sair</span>}
        </button>
      </div>
    </aside>

    {/* Logout Confirmation Modal */}
    {showLogoutModal && (
        <div className="sidebar-modal-overlay">
            <div className="sidebar-modal-card">
                <div className="modal-icon-wrapper">
                    <LogOut size={32} />
                </div>
                <h3 className="sidebar-modal-title">Tem certeza que deseja sair?</h3>
                <p className="sidebar-modal-text">Você precisará fazer login novamente para acessar o sistema.</p>
                <div className="sidebar-modal-actions">
                    <button className="btn-modal-cancel" onClick={() => setShowLogoutModal(false)}>
                        <X size={18} /> Cancelar
                    </button>
                    <button className="btn-modal-confirm" onClick={confirmLogout}>
                        <LogOut size={18} /> Sim, Sair
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default Sidebar;
