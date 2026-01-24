import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Camera, Save, Lock, Calendar, MapPin } from 'lucide-react';
import './Perfil.css';

const Perfil = () => {
    const { user, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Mock state for form since we might not have a real update endpoint ready yet
    const [formData, setFormData] = useState({
        nome: user?.nome_completo || user?.username || '',
        email: user?.email || '',
        telefone: user?.telefone || '',
        endereco: user?.endereco || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const getInitials = (name) => {
        if (!name) return 'US';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                alert("As novas senhas não coincidem!");
                return;
            }
            if (!formData.currentPassword) {
                alert("Para alterar a senha, informe a senha atual.");
                return;
            }
        }

        setLoading(true);
        const result = await updateProfile(formData);
        setLoading(false);

        if (result.success) {
            alert(result.message);
            setIsEditing(false);
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="perfil-container page-container">
            <div className="perfil-header">
                <h1>Meu Perfil</h1>
                <p>Gerencie suas informações pessoais, privacidade e segurança.</p>
            </div>

            <div className="perfil-grid">
                {/* Profile Card */}
                <div className="profile-card">
                    <div className="profile-cover">
                        <div className="profile-avatar-container">
                            <div className="profile-avatar">
                                {user?.profilePhoto ? (
                                    <img src={user.profilePhoto} alt="Profile" />
                                ) : (
                                    <div className="profile-initials">
                                        {getInitials(user?.nome_completo || user?.username)}
                                    </div>
                                )}
                            </div>
                            <button className="profile-camera-btn" title="Alterar foto">
                                <Camera size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="profile-info">
                        <h2 className="profile-name">{user?.nome_completo || user?.username}</h2>
                        <div className="profile-role-badge">
                            {user?.role || user?.cargo || 'Administrador'}
                        </div>

                        <div className="profile-details">
                            <div className="profile-detail-item">
                                <Mail size={18} />
                                <span>{user?.email || 'Sem email registado'}</span>
                            </div>
                            <div className="profile-detail-item">
                                <Shield size={18} />
                                <span>ID: {user?.id || 'N/A'}</span>
                            </div>
                            <div className="profile-detail-item">
                                <Calendar size={18} />
                                <span>Membro desde {new Date().getFullYear()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="settings-card">
                    <div className="settings-header">
                        <h2>Informações da Conta</h2>
                        <button 
                            className={`edit-toggle-btn ${isEditing ? 'active' : ''}`}
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? 'Cancelar Edição' : 'Editar Perfil'}
                        </button>
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="form-section">
                            <div className="section-title">
                                <User size={20} className="text-primary" />
                                Dados Pessoais
                            </div>
                            <div className="form-grid">
                                <div className="full-width">
                                    <div className="form-group">
                                        <label className="form-label">Nome Completo</label>
                                        <div className="input-wrapper">
                                            <User size={18} className="input-icon" />
                                            <input 
                                                type="text" 
                                                className="form-input"
                                                value={formData.nome}
                                                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                                disabled={!isEditing}
                                                placeholder="Seu nome completo"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <div className="input-wrapper">
                                        <Mail size={18} className="input-icon" />
                                        <input 
                                            type="email" 
                                            className="form-input"
                                            value={formData.email}
                                            disabled
                                            title="O email não pode ser alterado"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Endereço</label>
                                    <div className="input-wrapper">
                                        <MapPin size={18} className="input-icon" />
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            value={formData.endereco}
                                            onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                                            disabled={!isEditing}
                                            placeholder="Não informado"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="form-section password-section">
                                <div className="section-title">
                                    <Lock size={20} className="text-primary" />
                                    Segurança
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Senha Atual</label>
                                        <div className="input-wrapper">
                                            <Lock size={18} className="input-icon" />
                                            <input 
                                                type="password" 
                                                className="form-input"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Nova Senha</label>
                                        <div className="input-wrapper">
                                            <Lock size={18} className="input-icon" />
                                            <input 
                                                type="password" 
                                                className="form-input"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Confirmar Senha</label>
                                        <div className="input-wrapper">
                                            <Lock size={18} className="input-icon" />
                                            <input 
                                                type="password" 
                                                className="form-input"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="save-btn" disabled={loading}>
                                        {loading ? 'Salvando...' : (
                                            <>
                                                <Save size={18} />
                                                Salvar Alterações
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Perfil;
