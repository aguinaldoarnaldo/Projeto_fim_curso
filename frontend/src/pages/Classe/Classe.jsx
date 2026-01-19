import React from 'react';
import './Classe.css';
import { BookOpen, MoreVertical, Plus } from 'lucide-react';

const Classe = () => {
  const classes = [
    { id: 'C7', nome: '7ª Classe', nivel: 'Ensino Primário', numAlunos: 120, status: 'Ativo' },
    { id: 'C9', nome: '9ª Classe', nivel: 'Ensino Secundário', numAlunos: 85, status: 'Ativo' },
    { id: 'C10', nome: '10ª Classe', nivel: 'Ensino Médio', numAlunos: 150, status: 'Ativo' },
    { id: 'C11', nome: '11ª Classe', nivel: 'Ensino Médio', numAlunos: 135, status: 'Ativo' },
    { id: 'C12', nome: '12ª Classe', nivel: 'Ensino Médio', numAlunos: 110, status: 'Ativo' },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-content">
          <div>
            <h1>Gestão de Classes</h1>
            <p>Visualize e gerencie os níveis de ensino da instituição.</p>
          </div>
          <button className="btn-primary-action" aria-label="Adicionar nova classe">
            <Plus size={20} aria-hidden="true" />
            Adicionar Classe
          </button>
        </div>
      </header>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome da Classe</th>
                <th>Nível de Ensino</th>
                <th>Total de Alunos</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="animate-fade-in">
                  <td className="id-cell">{c.id}</td>
                  <td>
                    <div className="class-info">
                      <div className="class-icon-circle">
                        <BookOpen size={16} />
                      </div>
                      <span className="class-name">{c.nome}</span>
                    </div>
                  </td>
                  <td>{c.nivel}</td>
                  <td>{c.numAlunos} Alunos</td>
                  <td>
                    <span className="status-badge status-active">
                      {c.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-icon-action" aria-label="Mais ações">
                      <MoreVertical size={18} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Classe;