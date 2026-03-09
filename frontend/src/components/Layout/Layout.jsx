import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopNavbar from '../TopNavbar/TopNavbar';
import '../../assets/styles/Global.css';

const Layout = ({ children }) => {
    const location = useLocation();
    const [isNavigating, setIsNavigating] = useState(false);

    // Sidebar state persistido
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Detectar navegação para feedback visual
    useEffect(() => {
        setIsNavigating(true);
        const timer = setTimeout(() => setIsNavigating(false), 50);
        
        // Reset scroll ao navegar
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) contentWrapper.scrollTo(0, 0);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    useEffect(() => {
        localStorage.setItem('@App:sidebarOpen', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    // Auto-close sidebar on smaller laptop screens (1366px or less)
    useEffect(() => {
        const checkScreenSize = () => {
            if (window.innerWidth <= 1366) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        // Run once on mount
        checkScreenSize();

        // Optional: listen for resize if the user changes window size
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <div className="app-container">
            {/* Barra de Progresso Superior (Puramente Visual para Percepção de Velocidade) */}
            {isNavigating && <div className="nav-progress-bar"></div>}
            
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <main className="main-content">
                <TopNavbar onMenuClick={toggleSidebar} />
                <div className="content-wrapper">
                    <div className="page-transition-wrapper">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
