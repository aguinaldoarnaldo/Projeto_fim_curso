import React from 'react';
import { UserPlus, Search, Filter } from 'lucide-react';

const Inscritos = () => {
  const inscritos = [
    { id: 'INS001', nome: 'Eduarda Gomes', curso: 'Informática', data: '20 Dez 2024', status: 'Pendente' },
    { id: 'INS002', nome: 'Filipe Luís', curso: 'Gestão', data: '21 Dez 2024', status: 'Em Análise' },
    { id: 'INS003', nome: 'Gina Rocha', curso: 'Direito', data: '22 Dez 2024', status: 'Pendente' },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Inscrições</h1>
        <p>Candidatos inscritos aguardando validação para matrícula.</p>
      </header>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Curso Pretendido</th>
                <th>Data Inscrição</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inscritos.map((i) => (
                <tr key={i.id}>
                  <td>{i.id}</td>
                  <td className="turma-cell">{i.nome}</td>
                  <td>{i.curso}</td>
                  <td className="date-cell">{i.data}</td>
                  <td>
                    <span className={`status-badge ${i.status === 'Pendente' ? 'status-pending' : 'status-analysis'}`}>
                      {i.status}
                    </span>
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

export default Inscritos;