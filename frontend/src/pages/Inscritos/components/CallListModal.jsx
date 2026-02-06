import React from 'react';
import { X, Printer } from 'lucide-react';

const CallListModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal-card" onClick={(e) => e.stopPropagation()} style={{maxWidth: '1000px'}}>
        <div className="evaluation-header" style={{background: '#1e293b'}}>
          <h3>
            <Printer size={20} color="white" /> Listas de Chamada por Sala
          </h3>
          <div style={{display: 'flex', gap: '12px'}}>
              <button onClick={() => window.print()} className="btn-confirm" style={{background: '#22c55e'}}>
                Imprimir Todas
              </button>
              <button onClick={onClose} className="btn-close-modal" style={{ position: 'static', color: 'white' }}>
                <X size={20} />
              </button>
          </div>
        </div>

        <div className="modal-body" style={{padding: '32px'}}>
          {Object.keys(data).length === 0 ? (
              <p style={{textAlign: 'center', color: '#64748b'}}>Nenhum exame agendado para exibir.</p>
          ) : (
              Object.entries(data).map(([date, salas]) => (
                <div key={date} className="print-section">
                    <h2 style={{borderBottom: '2px solid #1e293b', paddingBottom: '8px', marginBottom: '24px', color: '#1e293b'}}>
                        📅 Exames em: {date}
                    </h2>
                    
                    {Object.entries(salas).map(([sala, alunos]) => (
                        <div key={sala} className="page-break" style={{marginBottom: '40px', background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                                <h3 style={{margin: 0, color: '#2563eb'}}>{sala}</h3>
                                <span style={{fontWeight: 'bold', color: '#64748b'}}>Total: {alunos.length} Alunos</span>
                            </div>
                            <table className="data-table" style={{maxHeight: 'none'}}>
                                <thead>
                                    <tr>
                                        <th>Nº INSCRIÇÃO</th>
                                        <th>NOME COMPLETO</th>
                                        <th>BI</th>
                                        <th>CURSO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alunos.map(al => (
                                        <tr key={al.numero_inscricao}>
                                            <td>{al.numero_inscricao}</td>
                                            <td>{al.nome}</td>
                                            <td>{al.bi}</td>
                                            <td>{al.curso}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CallListModal;
