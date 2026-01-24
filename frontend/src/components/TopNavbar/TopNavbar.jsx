import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    LogOut, User, Bell, Search, Menu, X, Check, Info, 
    AlertTriangle, CheckCircle, FileText, Calendar, Settings 
} from 'lucide-react';
import './UserDropdown.css';

const TopNavbar = ({ onMenuClick }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    // Mock Notifications Data
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Nova Matrícula',
            message: 'João Silva completou a matrícula no curso de Engenharia Informática.',
            time: 'Há 5 min',
            type: 'success', // blue/green
            read: false,
            icon: <CheckCircle size={20} />
        },
        {
            id: 2,
            title: 'Reunião de Docentes',
            message: 'Reunião geral agendada para amanhã às 14:00 na Sala 3.',
            time: 'Há 1 hora',
            type: 'info', // blue
            read: false,
            icon: <Calendar size={20} />
        },
        {
            id: 3,
            title: 'Pagamento Pendente',
            message: '3 alunos têm prestações em atraso este mês.',
            time: 'Há 3 horas',
            type: 'warning', // yellow
            read: true,
            icon: <AlertTriangle size={20} />
        },
        {
            id: 4,
            title: 'Documento Recebido',
            message: 'O relatório financeiro de Maio foi submetido.',
            time: 'Ontem',
            type: 'file', // purple
            read: true,
            icon: <FileText size={20} />
        }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Logic to determine display name
    const displayName = (user && (user.nome_completo || user.username || (user.email && user.email.split('@')[0]))) || 'Administrador';

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return 'AD';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close Notifications
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            // Close User Menu
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        if (showNotifications || showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications, showUserMenu]);

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const handleNotificationClick = (id) => {
        setNotifications(notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const getIconColorClass = (type) => {
        switch(type) {
            case 'success': return 'green';
            case 'warning': return 'yellow';
            case 'info': return 'blue';
            case 'file': return 'purple';
            default: return 'blue';
        }
    };

    return (
        <header className="top-navbar">
            <div className="top-navbar-left">
                <button className="mobile-menu-toggle" onClick={onMenuClick}>
                    <Menu size={20} />
                </button>
                {/*<div className="search-bar-top">
                    <Search size={18} className="search-icon-top" />
                    <input type="text" placeholder="Pesquisar..." />
                </div>*/}
            </div>

            <div className="top-navbar-right">
                
                {/* Notification Area */}
                <div className="notification-container" ref={notificationRef}>
                    <button 
                        className="top-nav-action" 
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <div className="icon-wrapper">
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="notification-badge"></span>}
                        </div>
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <h3>Notificações</h3>
                                {unreadCount > 0 && (
                                    <button className="mark-read-btn" onClick={handleMarkAllRead}>
                                        Marcar todas como lidas
                                    </button>
                                )}
                            </div>
                            
                            <div className="notification-list">
                                {notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <div 
                                            key={notification.id} 
                                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                            onClick={() => handleNotificationClick(notification.id)}
                                        >
                                            <div className={`notification-icon ${getIconColorClass(notification.type)}`}>
                                                {notification.icon}
                                            </div>
                                            <div className="notification-content">
                                                <div className="notification-title">{notification.title}</div>
                                                <div className="notification-message">{notification.message}</div>
                                                <span className="notification-time">{notification.time}</span>
                                            </div>
                                            {!notification.read && (
                                                <div style={{ alignSelf: 'center' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }}></div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="notification-empty">
                                        <Bell size={40} className="text-gray-300" />
                                        <p>Não tem novas notificações</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="notification-footer">
                                <span className="view-all-btn">Ver todas</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="user-profile-container" ref={userMenuRef} style={{ position: 'relative' }}>
                    <div 
                        className="user-profile-top" 
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        title={displayName}
                    >
                        <div className="user-info-top">
                            <span className="user-name-top">{displayName}</span>
                            <span className="user-role-top">{user?.role || 'Administrador'}</span>
                        </div>
                        <div className="user-avatar-top">
                            {user?.profilePhoto ? (
                                 <img src={user.profilePhoto} alt={displayName} />
                            ) : (
                                 getInitials(displayName)
                            )}
                        </div>
                    </div>

                    {showUserMenu && (
                        <div className="user-dropdown">
                            <div className="user-dropdown-header">
                                <div className="user-avatar-large">
                                    {user?.profilePhoto ? (
                                        <img src={user.profilePhoto} alt={displayName} />
                                    ) : (
                                        getInitials(displayName)
                                    )}
                                </div>
                                <div className="user-dropdown-info">
                                    <span className="user-dropdown-name">{displayName}</span>
                                    <span className="user-dropdown-email">{user?.email || 'admin@escola.com'}</span>
                                </div>
                            </div>
                            
                            <div className="user-dropdown-menu">
                                <button 
                                    className="user-dropdown-item"
                                    onClick={() => { navigate('/perfil'); setShowUserMenu(false); }}
                                >
                                    <User size={16} />
                                    Meu Perfil
                                </button>
                                <button 
                                    className="user-dropdown-item"
                                    onClick={() => { navigate('/configuracoes'); setShowUserMenu(false); }}
                                >
                                    <Settings size={16} />
                                    Configurações
                                </button>
                                <button 
                                    className="user-dropdown-item"
                                    onClick={() => { navigate('/ajuda'); setShowUserMenu(false); }}
                                >
                                    <AlertTriangle size={16} /> 
                                    Ajuda e Suporte
                                </button>
                                
                                <div className="user-dropdown-divider"></div>
                                
                                <button className="user-dropdown-item logout-item" onClick={signOut}>
                                    <LogOut size={16} />
                                    Terminar Sessão
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;
