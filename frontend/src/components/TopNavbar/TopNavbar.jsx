import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Bell, Search, Menu } from 'lucide-react';

const TopNavbar = ({ onMenuClick }) => {
    const { user } = useAuth();

    // Logic to determine display name
    const displayName = (user && (user.nome_completo || user.username || (user.email && user.email.split('@')[0]))) || 'Administrador';

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return 'AD';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
                <button className="top-nav-action">
                    <div className="icon-wrapper">
                        <Bell size={20} />
                        <span className="notification-badge"></span>
                    </div>
                </button>

                <div className="user-profile-top">
                    <div className="user-info-top">
                        <span className="user-name-top">{displayName}</span>
                        <span className="user-role-top">{user?.role || 'Administrador'}</span>
                    </div>
                    <div className="user-avatar-top" title={displayName}>
                        {user?.profilePhoto ? (
                             <img src={user.profilePhoto} alt={displayName} />
                        ) : (
                             getInitials(displayName)
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;
