import React from 'react';
import { 
  ArrowUp, ArrowDown, Eye, Edit, ClipboardCheck, GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../../../hooks/usePermission';
import { PERMISSIONS } from '../../../utils/permissions';

const InscritosTable = ({ 
  data, 
  loading, 
  sortConfig, 
  requestSort, 
  onOpenDetail,
  onEdit,
  onEvaluate
}) => {
  const { hasPermission } = usePermission();
  const navigate = useNavigate();

  if (loading) {
    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px', color: '#64748b'}}>
            <div className="loading-spinner" style={{width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spinner 0.8s linear infinite'}}></div>
            <span style={{fontWeight: 500}}>A carregar inscritos...</span>
        </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th 
                className={`sticky-col-1 sortable-header ${sortConfig.key === 'id' ? 'active-sort' : ''}`} 
                onClick={() => requestSort('id')}
                style={{ width: '60px' }}
            >
                ID 
                <span className="sort-icon">
                    {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                </span>
            </th>
            <th 
                className={`sticky-col-2 sortable-header ${sortConfig.key === 'nome' ? 'active-sort' : ''}`} 
                onClick={() => requestSort('nome')}
                style={{ minWidth: '240px' }}
            >
                Candidato
                 <span className="sort-icon">
                    {sortConfig.key === 'nome' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                </span>
            </th>
            <th 
                className={`sortable-header ${sortConfig.key === 'curso1' ? 'active-sort' : ''}`} 
                onClick={() => requestSort('curso1')}
            >
                Curso
                 <span className="sort-icon">
                    {sortConfig.key === 'curso1' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                </span>
            </th>
            <th 
                className={`sortable-header ${sortConfig.key === 'notaExame' ? 'active-sort' : ''}`} 
                onClick={() => requestSort('notaExame')}
            >
                Exame
                 <span className="sort-icon">
                    {sortConfig.key === 'notaExame' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                </span>
            </th>
            <th 
                className={`sortable-header ${sortConfig.key === 'anoInscricao' ? 'active-sort' : ''}`} 
                onClick={() => requestSort('anoInscricao')}
            >
                Ano Lectivo
                 <span className="sort-icon">
                    {sortConfig.key === 'anoInscricao' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                </span>
            </th>
            <th 
                className={`sortable-header ${sortConfig.key === 'status' ? 'active-sort' : ''}`} 
                onClick={() => requestSort('status')}
            >
                Estado
                 <span className="sort-icon">
                    {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : ''}
                </span>
            </th>
            <th style={{ textAlign: 'center' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map((i) => (
            <tr key={i.id} className="clickable-row animate-fade-in">
              <td className="sticky-col-1">{i.id}</td>
              <td className="sticky-col-2" style={{ fontWeight: 600 }}>{i.nome}</td>
              <td>{i.curso1}</td>
              <td>
                {i.notaExame ? (
                  <span style={{ fontWeight: 800, color: i.notaExame >= 10 ? '#166534' : '#dc2626' }}>
                    {i.notaExame}
                  </span>
                ) : '-'}
              </td>
              <td>{i.anoInscricao}</td>
              <td>
                <span className={`status-badge ${i.status === 'Pendente' ? 'status-pending' :
                  i.status === 'Em Análise' ? 'status-analysis' :
                    i.status === 'Aprovado' ? 'status-approved' : 
                    i.status === 'Matriculado' ? 'status-confirmed' : 'status-rejected'
                  }`}>
                  {i.status}
                </span>
              </td>
              <td>
                <div className="actions-cell">
                  <button
                    className="btn-icon btn-view"
                    onClick={() => onOpenDetail(i)}
                    title="Ver Detalhes"
                  >
                    <Eye size={16} />
                  </button>
                  
                  {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                    <button
                        className="btn-icon btn-edit"
                        onClick={(e) => { e.stopPropagation(); onEdit(i); }}
                        title="Editar Candidato"
                    >
                        <Edit size={16} />
                    </button>
                  )}

                  {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                    <button
                        className="btn-icon btn-evaluate"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (i.notaExame === null || i.notaExame === undefined || i.notaExame === '') {
                                onEvaluate(i); 
                            }
                        }}
                        disabled={i.notaExame !== null && i.notaExame !== undefined && i.notaExame !== ''}
                        title={ (i.notaExame !== null && i.notaExame !== undefined && i.notaExame !== '') ? "Candidato já avaliado" : "Avaliar Candidato"}
                    >
                        <ClipboardCheck size={16} />
                    </button>
                  )}

                  {hasPermission(PERMISSIONS.CREATE_MATRICULA) && (
                    <button
                        className={`btn-icon btn-enroll ${i.status === 'Aprovado' ? 'can-enroll' : ''}`}
                        disabled={i.status !== 'Aprovado' || i.status === 'Matriculado'}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            navigate('/matriculas/nova', { state: { candidato: i } });
                        }}
                        title={
                            i.status === 'Matriculado' ? "Candidato já matriculado" :
                            i.status === 'Aprovado' ? "Matricular Candidato" : 
                            "Matrícula indisponível (Candidato não aprovado)"
                        }
                    >
                        <GraduationCap size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Nenhum candidato encontrado com os filtros aplicados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InscritosTable;
