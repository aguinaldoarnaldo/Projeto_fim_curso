import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import TopNavbar from '../TopNavbar/TopNavbar';
import '../../Global.css';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
