import React from 'react';
import './Loader.css';

const Loader = ({ message = "Sistema de Gestão Escolar" }) => {
    return (
        <div className="loader-container">
            <div className="loader-content">
                <div className="loader-visual">
                    <div className="ring ring-1"></div>
                    <div className="ring ring-2"></div>
                    <div className="ring ring-3"></div>
                    <div className="loader-center"></div>
                </div>
                
                <div className="loader-branding">
                    <div className="loader-text">{message}</div>
                    <div className="loader-progress-bar">
                        <div className="progress-fill"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Loader;
