import React from 'react';
import { Home, MapPin } from 'lucide-react';

const Salas = () => {
  const salas = [
    { id: 'S01', nome: 'Sala 01', bloco: 'Bloco A', capacidade: 40 },
    { id: 'S02', nome: 'Sala 02', bloco: 'Bloco A', capacidade: 40 },
    { id: 'L01', nome: 'Laboratório 01', bloco: 'Bloco B', capacidade: 30 },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Salas de Aula</h1>
        <p>Distribuição física das salas e laboratórios.</p>
      </header>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Bloco</th>
                <th>Capacidade</th>
              </tr>
            </thead>
            <tbody>
              {salas.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td className="turma-cell">{s.nome}</td>
                  <td>{s.bloco}</td>
                  <td>{s.capacidade} Estudantes</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Salas;