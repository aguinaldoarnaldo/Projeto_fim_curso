import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    LogOut, User, Menu, Settings, AlertTriangle 
} from 'lucide-react';
import NotificationsMenu from './NotificationsMenu';
import './UserDropdown.css';

const TopNavbar = ({ onMenuClick }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);


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
            // Close User Menu
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

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
                
                <NotificationsMenu />

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
                                
                                <button className="user-dropdown-item logout-item" onClick={() => {
                                    if (window.confirm("Tem certeza que deseja terminar a sessão?")) {
                                        signOut();
                                    }
                                }}>
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
