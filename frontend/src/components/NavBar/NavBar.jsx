import './NavBar.css'
export default function NavBar(params) {
    return(
         <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo-section">
                    <i class="fas fa-graduation-cap logo-icon"></i>
                    <div class="logo-text">
                        <h1>SGMatrícula</h1>
                        <p>Sistema de Gestão</p>
                    </div>
                </div>
                <button class="toggle-btn" id="toggleBtn">
                    <i class="fas fa-chevron-left" id="toggleIcon"></i>
                </button>
            </div>

            <nav class="sidebar-nav">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="dashboard/" class="nav-link active">
                            <i class="fas fa-home"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li class="nav-item">
                         <a href="matriculas/" class="nav-link">
                            <i class="fas fa-user-check"></i>
                            <span>Matrículas</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="alunos/" class="nav-link">
                            <i class="fas fa-users"></i>
                            <span>Estudantes</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-graduation-cap"></i>
                            <span>Cursos</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-book"></i>
                            <span>Disciplinas</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-calendar"></i>
                            <span>Calendário</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-file-alt"></i>
                            <span>Documentos</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-credit-card"></i>
                            <span>Pagamentos</span>
                        </a>
                    </li>
                </ul>
            </nav>

            <div class="sidebar-bottom">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-cog"></i>
                            <span>Configurações</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Sair</span>
                        </a>
                    </li>
                </ul>
            </div>

            <div class="user-profile">
                <div class="user-avatar">AD</div>
                <div class="user-info">
                    <h3>Administrador</h3>
                    <p>admin@escola.ao</p>
                </div>
            </div>
        </aside>
    )
    
}