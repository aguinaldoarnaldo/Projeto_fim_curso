import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Camera, Save, Lock, MapPin, Key, Phone, Edit3 } from 'lucide-react';
import './Perfil.css';

const Perfil = () => {
    const { user, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('dados'); // 'dados' | 'seguranca'
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);
    
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

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhoto(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (activeTab === 'seguranca') {
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
        const dataToSubmit = new FormData();
        
        if (activeTab === 'dados') {
            dataToSubmit.append('nome_completo', formData.nome);
            dataToSubmit.append('endereco', formData.endereco);
            dataToSubmit.append('telefone', formData.telefone);
            if (profilePhoto) {
                dataToSubmit.append('foto', profilePhoto);
            }
        } else if (activeTab === 'seguranca') {
            dataToSubmit.append('current_password', formData.currentPassword);
            dataToSubmit.append('new_password', formData.newPassword);
        }

        try {
            const result = await updateProfile(dataToSubmit);
            if (result.success) {
                alert("Perfil atualizado com sucesso!");
                // Clear password fields if on security tab
                if (activeTab === 'seguranca') {
                    setFormData(prev => ({
                        ...prev,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    }));
                }
            } else {
                alert(result.message || "Erro ao atualizar perfil.");
            }
        } catch (error) {
            console.error("Erro no updateProfile:", error);
            alert("Ocorreu um erro inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="perfil-page-v3">
            <div className="perfil-layout-v3">
                {/* Fixed Sidebar Card */}
                <aside className="perfil-sidebar-v3">
                    <div className="profile-hero-card">
                        <div className="avatar-wrapper">
                            <div className="avatar-circle">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" />
                                ) : user?.foto ? (
                                    <img src={user.foto} alt="Profile" />
                                ) : (
                                    <div className="avatar-initials">
                                        {getInitials(user?.nome_completo || user?.username)}
                                    </div>
                                )}
                            </div>
                            <button 
                                className="change-photo-btn"
                                onClick={() => fileInputRef.current.click()}
                                title="Alterar Foto"
                            >
                                <Camera size={16} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{display: 'none'}} 
                                accept="image/*"
                                onChange={handlePhotoChange}
                            />
                        </div>
                        <h2 className="user-displayName">{user?.nome_completo || 'Usuário'}</h2>
                        <p className="user-roleTag">{user?.cargo || 'Administrador'}</p>
                    </div>

                    <nav className="perfil-menu-v3">
                        <button 
                            className={`menu-item-v3 ${activeTab === 'dados' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dados')}
                        >
                            <User size={20} />
                            <span>Informações Pessoais</span>
                        </button>
                        <button 
                            className={`menu-item-v3 ${activeTab === 'seguranca' ? 'active' : ''}`}
                            onClick={() => setActiveTab('seguranca')}
                        >
                            <Shield size={20} />
                            <span>Segurança e Senha</span>
                        </button>
                    </nav>

                    <div className="sidebar-stats">
                        <div className="stat-row">
                            <label>ID de Usuário</label>
                            <span>#{user?.id_usuario || user?.id || '---'}</span>
                        </div>
                        <div className="stat-row">
                            <label>Desde</label>
                            <span>{user?.date_joined ? new Date(user.date_joined).getFullYear() : new Date().getFullYear()}</span>
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="perfil-main-v3">
                    <div className="content-island-v3">
                        <header className="island-header-v3">
                            <div className="header-icon">
                                {activeTab === 'dados' ? <Edit3 size={24} /> : <Lock size={24} />}
                            </div>
                            <div className="header-text">
                                <h1>{activeTab === 'dados' ? 'Editar Informações' : 'Alterar Senha'}</h1>
                                <p>{activeTab === 'dados' ? 'Mantenha seus dados de contato e endereço atualizados.' : 'Recomendamos o uso de uma senha forte para maior segurança.'}</p>
                            </div>
                        </header>

                        <form className="perfil-form-v3" onSubmit={handleSave}>
                            {activeTab === 'dados' ? (
                                <div className="form-grid-v3">
                                    <div className="form-input-v3 full">
                                        <label>Nome Completo</label>
                                        <div className="field-group">
                                            <User size={18} className="field-icon" />
                                            <input 
                                                value={formData.nome}
                                                onChange={e => setFormData({...formData, nome: e.target.value})}
                                                placeholder="Seu nome completo"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-input-v3">
                                        <label>Email Corporativo</label>
                                        <div className="field-group disabled">
                                            <Mail size={18} className="field-icon" />
                                            <input value={formData.email} disabled />
                                        </div>
                                    </div>

                                    <div className="form-input-v3">
                                        <label>Telemóvel</label>
                                        <div className="field-group">
                                            <Phone size={18} className="field-icon" />
                                            <input 
                                                value={formData.telefone}
                                                onChange={e => setFormData({...formData, telefone: e.target.value})}
                                                placeholder="9XX XXX XXX"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-input-v3 full">
                                        <label>Endereço de Residência</label>
                                        <div className="field-group">
                                            <MapPin size={18} className="field-icon" />
                                            <input 
                                                value={formData.endereco}
                                                onChange={e => setFormData({...formData, endereco: e.target.value})}
                                                placeholder="Província, Município, Bairro..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="form-grid-v3">
                                    <div className="form-input-v3 full">
                                        <label>Senha Atual</label>
                                        <div className="field-group">
                                            <Key size={18} className="field-icon" />
                                            <input 
                                                type="password"
                                                value={formData.currentPassword}
                                                onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                                                placeholder="Confirme sua senha atual"
                                            />
                                        </div>
                                    </div>

                                    <div className="divider-v3"><span>Nova Identidade</span></div>

                                    <div className="form-input-v3">
                                        <label>Nova Senha</label>
                                        <div className="field-group">
                                            <Lock size={18} className="field-icon" />
                                            <input 
                                                type="password"
                                                value={formData.newPassword}
                                                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                                                placeholder="Mínimo 8 caracteres"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-input-v3">
                                        <label>Confirmar Nova Senha</label>
                                        <div className="field-group">
                                            <Lock size={18} className="field-icon" />
                                            <input 
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                                placeholder="Repita a nova senha"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-footer-v3">
                                <button type="submit" className="save-button-v3" disabled={loading}>
                                    {loading ? (
                                        <div className="loading-spinner-v3"></div>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            <span>Salvar Alterações</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Perfil;
