import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import TopNavbar from '../TopNavbar/TopNavbar';
import '../../Global.css';

const Layout = ({ children }) => {
    // Inicializa lendo do localStorage. Se não houver, padrão é true (aberto)
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('@App:sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Salva no localStorage sempre que mudar
    useEffect(() => {
        localStorage.setItem('@App:sidebarOpen', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="app-container">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <main className="main-content">
                <TopNavbar onMenuClick={toggleSidebar} />
                <div className="content-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
