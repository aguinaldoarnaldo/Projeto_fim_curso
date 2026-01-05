import React from 'react';
// import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Bell, Search, Menu } from 'lucide-react';

const TopNavbar = ({ onMenuClick }) => {
    // const { user, loading } = useAuth(); // Removed context usage
    const user = { name: 'Administrador', profilePhoto: null };
    const loading = false;

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
                    <Bell size={20} />
                    <span className="notification-badge"></span>
                </button>

                <div className="user-profile-top">
                    {loading ? (
                        <div className="skeleton-avatar pulse"></div>
                    ) : (
                        <>
                            <div className="user-info-top">
                                <span className="user-name-top">{user?.name}</span>
                                <span className="user-role-top">Administrador</span>
                            </div>
                            <div className="user-avatar-top">
                                {user?.profilePhoto ? (
                                    <img src={user.profilePhoto} alt={user.name} />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;
