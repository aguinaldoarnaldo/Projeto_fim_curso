import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout/Layout";

import Loader from "../components/Common/Loader";

import Login from "../pages/Login/Login";

// import DefinirSenha from "../pages/Login/DefinirSenha";

// Lazy Loaded Pages
const DefinirSenha = lazy(() => import("../pages/Login/DefinirSenha"));
const Alunos = lazy(() => import("../pages/Alunos/Alunos"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Inscrito = lazy(() => import("../pages/Inscritos/Inscritos"));

const Candidatura = lazy(() => import("../pages/Public/Candidatura/Candidatura"));
const Matriculas = lazy(() => import("../pages/Matriculas/Matriculas"));
const Salas = lazy(() => import("../pages/Salas/Salas"));
const Turma = lazy(() => import("../pages/Turmas/Turmas"));
const Cursos = lazy(() => import("../pages/Cursos/Cursos"));
const Configuracoes = lazy(() => import("../pages/Configuracoes/Configuracoes"));
const NovaMatricula = lazy(() => import("../pages/Matriculas/NovaMatricula"));
const Relatorios = lazy(() => import("../pages/Relatorios/Relatorios"));
const Perfil = lazy(() => import("../pages/Perfil/Perfil"));
const Ajuda = lazy(() => import("../pages/Ajuda/Ajuda"));

const PrivateRoute = ({ children }) => {
    const { signed, loading } = useAuth();

    if (loading) {
        return <Loader />;
    }

    if (!signed) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default function Routers(params) {
    return (
        <BrowserRouter>
            <Suspense fallback={<Loader />}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/definir-senha" element={<DefinirSenha />} />
                    <Route path="/candidatura" element={<Candidatura />} />
                    <Route path="/candidatos" element={<Candidatura />} />
                    
                    {/* Root path now points to Login. Login component handles redirect if already authenticated. */}
                    <Route path="/" element={<Login />} />

                    {/* Protected Routes (Wrapped in Layout and PrivateRoute) */}
                    <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
                    <Route path="/alunos" element={<PrivateRoute><Layout><Alunos /></Layout></PrivateRoute>} />
                    <Route path="/inscrito" element={<PrivateRoute><Layout><Inscrito /></Layout></PrivateRoute>} />
                    <Route path="/matriculas" element={<PrivateRoute><Layout><Matriculas /></Layout></PrivateRoute>} />
                    <Route path="/salas" element={<PrivateRoute><Layout><Salas /></Layout></PrivateRoute>} />
                    <Route path="/turma" element={<PrivateRoute><Layout><Turma /></Layout></PrivateRoute>} />
                    <Route path="/cursos" element={<PrivateRoute><Layout><Cursos /></Layout></PrivateRoute>} />
                    <Route path="/configuracoes" element={<PrivateRoute><Layout><Configuracoes /></Layout></PrivateRoute>} />
                    <Route path="/matriculas/nova" element={<PrivateRoute><Layout><NovaMatricula /></Layout></PrivateRoute>} />
                    <Route path="/relatorios" element={<PrivateRoute><Layout><Relatorios /></Layout></PrivateRoute>} />
                    <Route path="/perfil" element={<PrivateRoute><Layout><Perfil /></Layout></PrivateRoute>} />
                    <Route path="/ajuda" element={<PrivateRoute><Layout><Ajuda /></Layout></PrivateRoute>} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
