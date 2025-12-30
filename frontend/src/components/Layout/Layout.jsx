import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import '../../SchoolManagementSystem.css';

const Layout = ({ children }) => {
    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
