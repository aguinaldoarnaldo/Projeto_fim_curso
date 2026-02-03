import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import './NotificationsMenu.css';
import { useNavigate } from 'react-router-dom';

const NotificationsMenu = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notificacoes/');
            let data = response.data;
            
            // Check if pagination is being used (Django Rest Framework default)
            if (data && data.results && Array.isArray(data.results)) {
                data = data.results;
            } else if (!Array.isArray(data)) {
                // Fallback if data is not an array for some reason
                console.warn("API response for notifications is not an array:", data);
                data = [];
            }

            setNotifications(data);
            setUnreadCount(data.filter(n => !n.lida).length);
        } catch (error) {
            console.error("Erro ao buscar notificações", error);
            // Don't blow up the UI if fetch fails
            setNotifications([]); 
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await api.post(`/notificacoes/${id}/marcar_como_lida/`);
            fetchNotifications();
        } catch (error) {
            console.error("Erro ao marcar como lida", error);
        }
    };
    
    const markAllAsRead = async () => {
        try {
            await api.post(`/notificacoes/marcar_todas_como_lida/`);
            fetchNotifications();
        } catch (error) {
            console.error("Erro ao marcar todas como lida", error);
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.lida) {
            markAsRead(notif.id_notificacao, { stopPropagation: () => {} });
        }
        if (notif.link) {
            navigate(notif.link);
            setIsOpen(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'warning': return <AlertTriangle size={16} />;
            case 'error': return <XCircle size={16} />;
            case 'success': return <CheckCircle size={16} />;
            default: return <Info size={16} />;
        }
    };

    return (
        <div className="notifications-container">
            <button className="notifications-trigger" onClick={() => setIsOpen(!isOpen)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <>
                    <div className="notifications-backdrop" onClick={() => setIsOpen(false)}></div>
                    <div className="notifications-dropdown">
                        <div className="notifications-header">
                            <h3>Notificações</h3>
                            {unreadCount > 0 && (
                                <button className="mark-all-read" onClick={markAllAsRead}>
                                    Marcar todas como lidas
                                </button>
                            )}
                        </div>
                        <div className="notifications-list">
                            {notifications.length === 0 ? (
                                <div className="no-notifications">
                                    <Bell size={32} className="text-gray-300 mb-2" />
                                    <p>Nenhuma notificação.</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id_notificacao} 
                                        className={`notification-item ${!notif.lida ? 'unread' : ''} ${notif.tipo}`}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        <div className={`notification-icon-wrapper ${notif.tipo}`}>
                                            {getIcon(notif.tipo)}
                                        </div>
                                        <div className="notification-content">
                                            <div className="notification-title-row">
                                                <h4>{notif.titulo}</h4>
                                                <span className="notification-date">
                                                    {new Date(notif.data_criacao).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p>{notif.mensagem}</p>
                                        </div>
                                        {!notif.lida && (
                                            <button 
                                                className="mark-read-btn" 
                                                onClick={(e) => markAsRead(notif.id_notificacao, e)} 
                                                title="Marcar como lida"
                                            >
                                                <Check size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationsMenu;
