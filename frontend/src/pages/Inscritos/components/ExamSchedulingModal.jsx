import React from 'react';
import { X, Calendar } from 'lucide-react';

const ExamSchedulingModal = ({
  isOpen,
  onClose,
  inscritos,
  examConfig,
  setExamConfig,
  onDistribute,
  isProcessing
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="evaluation-modal-card" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column'}}>
        <div className="evaluation-header">
          <h3>
            <Calendar size={20} color="#1e3a8a" /> Agendamento Automático
          </h3>
          <button onClick={onClose} className="btn-close-modal" style={{ position: 'static' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div className="evaluation-body" style={{padding: '24px', overflowY: 'auto'}}>
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
            padding: '24px', 
            borderRadius: '20px', 
            marginBottom: '24px', 
            border: '1px solid #bfdbfe', 
            textAlign: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <p style={{fontSize: '12px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0'}}>
               Total de Candidatos Aguardando Vaga
            </p>
            <div style={{fontSize: '36px', fontWeight: '900', color: '#1e3a8a', lineHeight: '1'}}>
                {inscritos.filter(i => i.status === 'INSCRITO').length.toLocaleString()}
            </div>
            <p style={{fontSize: '13px', color: '#60a5fa', marginTop: '8px', fontWeight: '500'}}>
                Candidatos com inscrição confirmada e aguardando vaga de exame
            </p>
          </div>

          <div style={{background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0', textAlign: 'left'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label className="evaluation-label" style={{textAlign: 'left', marginBottom: 0, color: '#475569'}}>DEFINIR TAMANHO DESTE LOTE (OPCIONAL)</label>
                <input 
                    type="number" 
                    placeholder="Ex: 50 (Vazio agendará todos)"
                    value={examConfig.limite_candidatos}
                    onChange={(e) => setExamConfig({...examConfig, limite_candidatos: e.target.value})}
                    className="evaluation-input" 
                    style={{width: '100%', fontSize: '18px', padding: '14px', height: 'auto', border: '2px solid #cbd5e1'}}
                />
            </div>
          </div>

          <div className="evaluation-input-group" style={{marginBottom: '20px'}}>
            <label className="evaluation-label">DATA DE INÍCIO DOS EXAMES</label>
            <input
              type="date"
              value={examConfig.data_inicio}
              onChange={(e) => setExamConfig({...examConfig, data_inicio: e.target.value})}
              className="evaluation-input"
              style={{width: '100%', fontSize: '16px', padding: '12px', height: 'auto'}}
            />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
              <div className="evaluation-input-group">
                <label className="evaluation-label">HORA DE INÍCIO</label>
                <input
                  type="time"
                  value={examConfig.hora_inicio}
                  onChange={(e) => setExamConfig({...examConfig, hora_inicio: e.target.value})}
                  className="evaluation-input"
                  style={{width: '100%', fontSize: '16px', padding: '12px', height: 'auto'}}
                />
              </div>
              <div className="evaluation-input-group">
                <label className="evaluation-label">POR SALA (OPCIONAL)</label>
                <input
                  type="number"
                  placeholder="Capacidade"
                  value={examConfig.candidatos_por_sala}
                  onChange={(e) => setExamConfig({...examConfig, candidatos_por_sala: e.target.value})}
                  className="evaluation-input"
                  style={{width: '100%', fontSize: '16px', padding: '12px', height: 'auto'}}
                />
              </div>
          </div>

          <div style={{background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #dbeafe'}}>
            <p style={{fontSize: '12px', color: '#1e40af', margin: 0, textAlign: 'left', lineHeight: '1.5'}}>
                <strong>ℹ️ Janelas de Horário Configuradas:</strong><br/>
                Manhã: 08:00 - 12:00 | Tarde: 13:00 - 16:00.<br/>
                O sistema saltará automaticamente o intervalo de almoço e passará para o dia seguinte após as 16h.
            </p>
          </div>
        </div>

        <div className="evaluation-actions">
          <button onClick={onClose} className="btn-cancel" disabled={isProcessing}>
            Cancelar
          </button>
          <button onClick={onDistribute} className="btn-confirm" disabled={isProcessing}>
            {isProcessing ? 'Processando...' : 'Distribuir Candidatos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSchedulingModal;
