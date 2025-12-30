import React from 'react';
import { BookOpen, Award } from 'lucide-react';

const Classe = () => {
  const classes = [
    { id: 'C7', nome: '7ª Classe', nivel: 'Ensino Primário' },
    { id: 'C9', nome: '9ª Classe', nivel: 'Ensino Secundário' },
    { id: 'C10', nome: '10ª Classe', nivel: 'Ensino Médio' },
    { id: 'C12', nome: '12ª Classe', nivel: 'Ensino Médio' },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Classes</h1>
        <p>Configuração dos níveis de ensino oferecidos.</p>
      </header>

      <div className="stats-grid">
        {classes.map((c) => (
          <div key={c.id} className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon card-purple">
                <BookOpen />
              </div>
            </div>
            <h3>{c.nome}</h3>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>{c.nivel}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Classe;