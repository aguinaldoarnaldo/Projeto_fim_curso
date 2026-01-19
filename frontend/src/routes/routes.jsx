import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout/Layout";

// Wrapper for Lazy Loading with 500ms delay to prevent flashing
const lazyLoad = (importFunc) => {
  return lazy(() => {
    return Promise.all([
      importFunc(),
      new Promise(resolve => setTimeout(resolve, 300)) // Minimal delay for smoother transition
    ]).then(([moduleExports]) => moduleExports);
  });
};

// Lazy Loaded Pages
const Alunos = lazy(() => import("../pages/Alunos/Alunos"));
const Classe = lazy(() => import("../pages/Classe/Classe"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Inscrito = lazy(() => import("../pages/Inscritos/Inscritos"));
const Login = lazy(() => import("../pages/Login/Login"));
const Candidatura = lazy(() => import("../pages/Public/Candidatura/Candidatura"));
const Matriculas = lazy(() => import("../pages/Matriculas/Matriculas"));
const Salas = lazy(() => import("../pages/Salas/Salas"));
const Turma = lazy(() => import("../pages/Turmas/Turmas"));
const Cursos = lazy(() => import("../pages/Cursos/Cursos"));
const Configuracoes = lazy(() => import("../pages/Configuracoes/Configuracoes"));
const NovaMatricula = lazy(() => import("../pages/Matriculas/NovaMatricula"));
const Relatorios = lazy(() => import("../pages/Relatorios/Relatorios"));

// Loading Component
const PageLoader = () => (
  <div style={{
    height: '100vh', 
    width: '100%', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    background: '#f8fafc',
    color: 'var(--primary-color)'
  }}>
    <div className="loading-spinner" style={{
      width: '40px', 
      height: '40px', 
      border: '4px solid #e2e8f0', 
      borderTopColor: 'currentColor', 
      borderRadius: '50%', 
      animation: 'spinner 0.8s linear infinite'
    }}></div>
  </div>
);

const PrivateRoute = ({ children }) => {
    const { signed, loading } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    if (!signed) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default function Routers(params) {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/candidatura" element={<Candidatura />} />
                    
                    {/* Redirect root to dashboard (will be handled by PrivateRoute) */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* Protected Routes (Wrapped in Layout and PrivateRoute) */}
                    <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
                    <Route path="/alunos" element={<PrivateRoute><Layout><Alunos /></Layout></PrivateRoute>} />
                    <Route path="/classe" element={<PrivateRoute><Layout><Classe /></Layout></PrivateRoute>} />
                    <Route path="/inscrito" element={<PrivateRoute><Layout><Inscrito /></Layout></PrivateRoute>} />
                    <Route path="/matriculas" element={<PrivateRoute><Layout><Matriculas /></Layout></PrivateRoute>} />
                    <Route path="/salas" element={<PrivateRoute><Layout><Salas /></Layout></PrivateRoute>} />
                    <Route path="/turma" element={<PrivateRoute><Layout><Turma /></Layout></PrivateRoute>} />
                    <Route path="/cursos" element={<PrivateRoute><Layout><Cursos /></Layout></PrivateRoute>} />
                    <Route path="/configuracoes" element={<PrivateRoute><Layout><Configuracoes /></Layout></PrivateRoute>} />
                    <Route path="/matriculas/nova" element={<PrivateRoute><Layout><NovaMatricula /></Layout></PrivateRoute>} />
                    <Route path="/relatorios" element={<PrivateRoute><Layout><Relatorios /></Layout></PrivateRoute>} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
