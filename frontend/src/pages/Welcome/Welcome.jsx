import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  FileText,
  MousePointer2,
  Lock,
  Globe
} from 'lucide-react';
import './Welcome.css';
import { useAuth } from '../../hooks/useAuth';
import dashboardImg from '../../assets/img/Dashboard2.png';
import relatorioImg from '../../assets/img/Relatorio2.png';
import logoIpm from '../../assets/img/logo_ipm2.png';

const Welcome = () => {
    const navigate = useNavigate();
    const { user, signed } = useAuth();

    const stats = [
      { label: "Uso do Sistema", value: "Prático" },
      { label: "Documentos", value: "Na Hora" },
      { label: "Alta Performance", value: "Rápido" }
    ];

    return (
        <div className="welcome-premium-root fade-in-up">
            {/* Animated Background Mesh */}
            <div className="mesh-gradient">
              <div className="mesh-ball ball-1"></div>
              <div className="mesh-ball ball-2"></div>
              <div className="mesh-ball ball-3"></div>
            </div>

            <div className="welcome-inner">
                {/* Top Navigation Bar Mini */}
                <nav className="welcome-nav">
                  <div className="logo-area">
                    <img src={logoIpm} alt="IPM Logo" className="welcome-school-logo" />
                    <span>Instituto Politécnico <span>do Maiombe</span></span>
                  </div>
                  <div className="nav-links">
                    {!signed && <button className="btn-login-small" onClick={() => navigate('/login')}>Entrar <MousePointer2 size={14} /></button>}
                  </div>
                </nav>

                <main className="main-stage">
                  {/* Left Column: Content */}
                  <div className="content-col">
                    <div className="announcement-pill">
                      <span className="pill-dot"></span>
                      <span>Instituto Politécnico nº 3050</span>
                    </div>

                    <h1 className="main-title">
                      Gestão de <br />
                      <span className="text-glow">Matrícula</span>
                    </h1>

                    <p className="main-description">
                      {signed 
                        ? `Bem-vindo de volta, ${user?.nome_completo?.split(' ')[0] || 'Administrador'}. O painel inteligente do Instituto Politécnico do Maiombe está pronto. Acompanhe em tempo real as áreas administrativas e operacionais, garantindo fluidez desde a matrícula até à emissão de relatórios detalhados.`
                        : "Descubra o ambiente digital unificado criado para o Instituto Politécnico do Maiombe nº 3050. A nossa arquitetura avançada transforma processos escolares lentos em rotinas otimizadas: acessos imediatos, matrículas seguras e uma organização de turmas totalmente centralizada."}
                    </p>

                    <div className="cta-group">
                      {signed ? (
                        <button className="btn-extreme" onClick={() => navigate('/dashboard')}>
                          <span>Entrar no Painel</span>
                          <ArrowRight />
                        </button>
                      ) : (
                        <button className="btn-extreme" onClick={() => navigate('/login')}>
                          <span>Aceder ao Sistema</span>
                          <ArrowRight />
                        </button>
                      )}
                      
                    </div>

                    <div className="stats-row">
                      {stats.map((s, i) => (
                        <div key={i} className="stat-card-mini">
                          <span className="val">{s.value}</span>
                          <span className="lab">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Visual Component */}
                  <div className="visual-col">
                    <div className="floating-stack">
                      <div className="float-card card-primary">
                        <div className="card-header">
                          <LayoutDashboard size={16} /> Dashboard
                        </div>
                        <img src={dashboardImg} alt="Preview 1" />
                      </div>
                      <div className="float-card card-secondary">
                        <div className="card-header">
                          <FileText size={16} /> Relatórios
                        </div>
                        <img src={relatorioImg} alt="Preview 2" />
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="deco-obj circle-glow"></div>
                      <div className="deco-obj square-glow"></div>
                    </div>
                  </div>
                </main>

                {/* Footer Section: Brief features */}
                <footer className="welcome-footer">
                  <div className="feature-line">
                    <div className="f-item"><Users size={16} /> Controle de Alunos e Turmas</div>
                    <div className="f-sep"></div>
                    <div className="f-item"><LayoutDashboard size={16} /> Dashboards e Estatísticas</div>
                    <div className="f-sep"></div>
                    <div className="f-item"><FileText size={16} /> Emissão Rápida de Documentos</div>
                    <div className="f-sep"></div>
                    <div className="f-item"><ShieldCheck size={16} /> Sistema de Auditoria Completo</div>
                  </div>
                </footer>
            </div>

            {/* Bottom Glow */}
            <div className="bottom-corner-glow"></div>
        </div>
    );
};

export default Welcome;
