import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermission } from "../hooks/usePermission";
import { PERMISSIONS } from "../utils/permissions";
import Layout from "../components/Layout/Layout";
import Loader from "../components/Common/Loader";

import Login from "../pages/Login/Login";

// Imports diretos para páginas principais (Navegação Instantânea)
import Dashboard from "../pages/Dashboard/Dashboard";
import Alunos from "../pages/Alunos/Alunos";
import Inscrito from "../pages/Inscritos/Inscritos";
import Matriculas from "../pages/Matriculas/Matriculas";
import Turma from "../pages/Turmas/Turmas";

// Static Imports for seamless navigation (No White Flash)
import DefinirSenha from "../pages/Login/DefinirSenha";
import Candidatura from "../pages/Public/Candidatura/Candidatura";
import Salas from "../pages/Salas/Salas";
import Cursos from "../pages/Cursos/Cursos";
import Configuracoes from "../pages/Configuracoes/Configuracoes";
import NovaMatricula from "../pages/Matriculas/NovaMatricula";
import Relatorios from "../pages/Relatorios/Relatorios";
import Ajuda from "../pages/Ajuda/Ajuda";
import ListaEspera from "../pages/ListaEspera/ListaEspera";
import Perfil from "../pages/Perfil/Perfil";

// PrivateRoute now keeps the layout mounted even during loading
const PrivateRoute = ({ children }) => {
    const { signed, loading } = useAuth();
    
    // If still loading auth, show the Loader
    if (loading) {
        return <Loader />;
    }
    
    return signed ? (children || <Outlet />) : <Navigate to="/login" replace />;
};

// Permission Guard
const PermissionRoute = ({ children, permission }) => {
    const { hasPermission } = usePermission();
    const { loading } = useAuth();
    
    // Show Loader while checking auth/permissions
    if (loading) return <Loader />;
    
    return hasPermission(permission) ? children : <Navigate to="/dashboard" replace />;
};

// Persistent Layout Wrapper
const ProtectedLayout = () => {
    return (
        <PrivateRoute>
            <Layout>
                <Suspense fallback={<Loader />}> 
                    <Outlet />
                </Suspense>
            </Layout>
        </PrivateRoute>
    );
};

export default function Routers() {
    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/definir-senha" element={<DefinirSenha />} />
                <Route path="/candidatura" element={<Candidatura />} />
                <Route path="/candidatos" element={<Candidatura />} />
                <Route path="/" element={<Login />} />

                {/* Persistent Layout and Protected Routes */}
                <Route element={<ProtectedLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    <Route path="/alunos" element={
                        <PermissionRoute permission={PERMISSIONS.VIEW_ALUNOS}><Alunos /></PermissionRoute>
                    } />
                    
                    <Route path="/inscrito" element={
                        <PermissionRoute permission={PERMISSIONS.VIEW_INSCRITOS}><Inscrito /></PermissionRoute>
                    } />
                    
                    <Route path="/matriculas" element={
                        <PermissionRoute permission={PERMISSIONS.VIEW_MATRICULAS}><Matriculas /></PermissionRoute>
                    } />
                    
                    <Route path="/matriculas/nova" element={
                        <PermissionRoute permission={PERMISSIONS.CREATE_MATRICULA}><NovaMatricula /></PermissionRoute>
                    } />
                    
                    <Route path="/salas" element={
                        <PermissionRoute permission={PERMISSIONS.VIEW_SALAS}><Salas /></PermissionRoute>
                    } />
                    
                    <Route path="/turma" element={
                        <PermissionRoute permission={PERMISSIONS.VIEW_TURMAS}><Turma /></PermissionRoute>
                    } />
                    
                    <Route path="/cursos" element={
                        <PermissionRoute permission={PERMISSIONS.VIEW_CURSOS}><Cursos /></PermissionRoute>
                    } />
                    
                    <Route path="/configuracoes" element={
                        <PermissionRoute permission={PERMISSIONS.VIEW_CONFIGURACOES}><Configuracoes /></PermissionRoute>
                    } />
                    
                    <Route path="/relatorios" element={
                        <PermissionRoute permission={PERMISSIONS.VIEW_RELATORIOS}><Relatorios /></PermissionRoute>
                    } />
                    
                    <Route path="/lista-espera" element={
                        <PermissionRoute permission={PERMISSIONS.VIEW_INSCRITOS}><ListaEspera /></PermissionRoute>
                    } />
                    
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/ajuda" element={<Ajuda />} />
                </Route>
            </Routes>
        </Suspense>
    );
}
