import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Alunos from "../pages/Alunos/Alunos"
import Classe from "../pages/Classe/Classe"
import Dashboard from "../pages/Dashboard/Dashboard"
import Inscrito from '../pages/Inscritos/Inscritos'
import Login from "../pages/Login/Login"
import Matriculas from '../pages/Matriculas/Matriculas'
import Salas from '../pages/Salas/Salas'
import Turma from '../pages/Turmas/Turmas'
import Cursos from '../pages/Cursos/Cursos'
import Configuracoes from "../pages/Configuracoes/Configuracoes"
import NovaMatricula from "../pages/Matriculas/NovaMatricula"
import Relatorios from "../pages/Relatorios/Relatorios"
import Layout from "../components/Layout/Layout"

export default function Routers(params) {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Protected Routes (Wrapped in Layout) */}
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/alunos" element={<Layout><Alunos /></Layout>} />
                <Route path="/classe" element={<Layout><Classe /></Layout>} />
                <Route path="/inscrito" element={<Layout><Inscrito /></Layout>} />
                <Route path="/matriculas" element={<Layout><Matriculas /></Layout>} />
                <Route path="/salas" element={<Layout><Salas /></Layout>} />
                <Route path="/turma" element={<Layout><Turma /></Layout>} />
                <Route path="/cursos" element={<Layout><Cursos /></Layout>} />
                <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
                <Route path="/matriculas/nova" element={<Layout><NovaMatricula /></Layout>} />
                <Route path="/relatorios" element={<Layout><Relatorios /></Layout>} />
            </Routes>
        </BrowserRouter>
    )
}