import React from 'react';
import { X, GraduationCap } from 'lucide-react';

const EvaluationModal = ({ 
  isOpen, 
  onClose, 
  candidate, 
  examGrade, 
  setExamGrade, 
  onSubmit 
}) => {
  if (!isOpen || !candidate) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="evaluation-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="evaluation-header">
          <h3>
            <GraduationCap size={20} color="#1e3a8a" /> Avaliação
          </h3>
          <button onClick={onClose} className="btn-close-modal" style={{ position: 'static' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div className="evaluation-body">
          <p className="evaluation-info-text">
            Atribuir nota do exame para: <strong>{candidate.nome}</strong>
          </p>

          <div className="evaluation-input-group">
            <label className="evaluation-label">NOTA DO EXAME (0 - 20)</label>
            <input
              type="number"
              min="0"
              max="20"
              value={examGrade}
              onChange={(e) => setExamGrade(e.target.value)}
              placeholder="0"
              className="evaluation-input"
              autoFocus
            />
          </div>

          <p className="evaluation-hint">
            Nota igual ou superior a 10 aprova o candidato.
          </p>
        </div>

        <div className="evaluation-actions">
          <button
            onClick={onClose}
            className="btn-cancel"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="btn-confirm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;
