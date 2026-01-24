import React from 'react';
import './Loader.css';

const Loader = ({ message = "Sistema Gestão de Matriculas" }) => {
    return (
        <div className="loader-container">
            <div className="loader-content">
                <div className="loader-spinner"></div>
                <div style={{textAlign: 'center'}}>
                    <div className="loader-text">{message}</div>
                    <div className="loader-subtext">A carregar o sistema...</div>
                </div>
            </div>
        </div>
    );
};

export default Loader;
