import React from 'react';
import { 
  X, User, Calendar, Award, FileText, GraduationCap, 
  ShieldAlert, CheckCircle2, Printer, Download, ClipboardCheck 
} from 'lucide-react';
import { usePermission } from '../../../hooks/usePermission';
import { PERMISSIONS } from '../../../utils/permissions';

const CandidateDetailModal = ({ 
  candidate, 
  onClose, 
  rupGenerated, 
  onGenerateRUP, 
  onRefresh, 
  onConfirmPayment 
}) => {
  const { hasPermission } = usePermission();

  if (!candidate) return null;

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    try {
        const today = new Date();
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return 0;
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
        }
        return age;
    } catch { return 0; }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close-modal" onClick={onClose}>
          <X size={24} color="#64748b" />
        </button>

        <div className="detail-modal-grid">
            {/* SIDEBAR: Profile & Status */}
            <div className="profile-sidebar">
                  <div className="profile-avatar-large" onClick={() => {
                    if (candidate.files?.foto) {
                          const win = window.open("", "_blank");
                          win.document.write(`<img src="${candidate.files.foto}" style="max-width:100%; height:auto;">`);
                          win.focus();
                    }
                  }} title="Clique para ampliar" style={{cursor: candidate.files?.foto ? 'zoom-in' : 'default'}}>
                    {candidate.files?.foto ? (
                          <img src={candidate.files.foto} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                          <User size={48} />
                    )}
                  </div>
                  <h2 className="profile-name">{candidate.nome}</h2>
                  <p className="profile-id">INSCRIÇÃO: {candidate.id}</p>
                  
                  <div className="profile-status" style={{
                      backgroundColor: 
                        candidate.status === 'CLASSIFICADO' || candidate.status === 'MATRICULADO' ? '#dcfce7' : 
                        candidate.status === 'INSCRITO' ? '#fef9c3' : 
                        candidate.status === 'AUSENTE' ? '#f1f5f9' : '#fee2e2',
                      color:
                        candidate.status === 'CLASSIFICADO' || candidate.status === 'MATRICULADO' ? '#166534' : 
                        candidate.status === 'INSCRITO' ? '#854d0e' : 
                        candidate.status === 'AUSENTE' ? '#475569' : '#991b1b',
                      border: 'none'
                  }}>
                      {candidate.status}
                  </div>
                  
                  {candidate.anoLectivoAtivo === false && (
                      <div style={{
                          marginTop: '8px',
                          padding: '4px 8px',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textAlign: 'center',
                          border: '1px solid #fee2e2'
                      }}>
                          ANO LECTIVO ENCERRADO
                      </div>
                  )}

                  <div className="profile-footer">
                    <div className="profile-footer-item">
                        <Calendar size={16} />
                        <span>Inscrito em: {candidate.dataInscricao}</span>
                    </div>
                    <div className="profile-footer-item">
                        <Award size={16} />
                        <span>Média 9ª: {candidate.nota9}</span>
                    </div>
                    {candidate.notaExame && (
                        <div className="profile-footer-item">
                            <FileText size={16} />
                            <span>Exame: <strong>{candidate.notaExame}</strong> Val.</span>
                        </div>
                    )}
                  </div>
            </div>

            {/* CONTENT: Details & Actions */}
            <div className="content-area">
                
                {/* 1. Dados Pessoais */}
                <div className="info-section">
                    <div className="section-title"><User size={18} /> Dados Pessoais</div>
                    <div className="info-grid-2">
                          <div><p className="info-label">Nome Completo</p><p className="info-value">{candidate.nome}</p></div>
                          <div><p className="info-label">Género</p><p className="info-value">{candidate.genero}</p></div>
                          <div><p className="info-label">Nascimento</p><p className="info-value">{candidate.dataNascimento} ({calculateAge(candidate.dataNascimento)} anos)</p></div>
                          <div><p className="info-label">Nacionalidade</p><p className="info-value">{candidate.nacionalidade}</p></div>
                          <div><p className="info-label">Naturalidade (Local de Nascimento)</p><p className="info-value">{candidate.naturalidade}</p></div>
                          <div><p className="info-label">BI / Passaporte</p><p className="info-value">{candidate.bi}</p></div>
                          <div><p className="info-label">Telefone</p><p className="info-value">{candidate.telefone}</p></div>
                          <div><p className="info-label">Email</p><p className="info-value">{candidate.email || 'N/A'}</p></div>
                          <div><p className="info-label">Província</p><p className="info-value">{candidate.provincia || 'N/A'}</p></div>
                          <div><p className="info-label">Município</p><p className="info-value">{candidate.municipio || 'N/A'}</p></div>
                          <div><p className="info-label">Residência (Bairro)</p><p className="info-value">{candidate.residencia}</p></div>
                    </div>
                </div>

                {/* 2. Académico & Curso */}
                <div className="info-section">
                    <div className="section-title"><GraduationCap size={18} /> Dados Académicos & Curso</div>
                      <div className="info-grid-2">
                          <div><p className="info-label">Escola de Origem</p><p className="info-value">{candidate.nomeEscola}</p></div>
                          <div><p className="info-label">Município da Escola</p><p className="info-value">{candidate.municipioEscola}</p></div>
                          <div><p className="info-label">Ano Conclusão</p><p className="info-value">{candidate.anoConclusao}</p></div>
                          
                          <div style={{gridColumn: 'span 2', background: 'var(--primary-light-bg)', padding: '16px', borderRadius: '12px', marginTop: '10px'}}>
                              <p className="info-label" style={{color: 'var(--primary-color)'}}>OPÇÃO DE CURSO SELECIONADA</p>
                              <p className="info-value" style={{fontSize: '18px', fontWeight: 700}}>{candidate.curso1}</p>
                              {candidate.curso2 && <p style={{fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px'}}>2ª Opção: {candidate.curso2}</p>}

                          </div>
                    </div>
                </div>

                {/* 3. Encarregado */}
                <div className="info-section">
                    <div className="section-title"><ShieldAlert size={18} /> Encarregado de Educação</div>
                    {candidate.encarregado && candidate.encarregado.nome !== 'N/A' ? (
                        <div className="info-grid-2">
                            <div><p className="info-label">Nome</p><p className="info-value">{candidate.encarregado.nome}</p></div>
                            <div><p className="info-label">Parentesco</p><p className="info-value">{candidate.encarregado.parentesco}</p></div>
                            <div><p className="info-label">Telefone</p><p className="info-value">{candidate.encarregado.telefone}</p></div>
                            <div><p className="info-label">Residência</p><p className="info-value">{candidate.encarregado.residencia}</p></div>
                        </div>
                    ) : (
                        <p style={{color: '#94a3b8', fontStyle: 'italic'}}>Nenhum encarregado associado (Candidato Maior de Idade ou não informado).</p>
                    )}
                </div>

                {/* 4. Documentos */}
                <div className="info-section">
                    <div className="section-title"><FileText size={18} /> Documentos Anexados</div>
                    <div className="doc-grid">
                        <div className="doc-card">
                              <FileText size={24} color={candidate.files?.bi ? '#2563eb' : '#cbd5e1'} />
                              <div style={{flex: 1}}>
                                  <p className="info-label">BILHETE IDENTIDADE</p>
                                  <p className="info-value" style={{fontSize: '13px'}}>{candidate.files?.bi ? 'Disponível' : 'Pendente'}</p>
                              </div>
                              {candidate.files?.bi && (
                                  <a href={candidate.files.bi} target="_blank" rel="noreferrer"><Download size={18} color="#475569"/></a>
                              )}
                        </div>
                        <div className="doc-card">
                              <User size={24} color={candidate.files?.foto ? '#2563eb' : '#cbd5e1'} />
                              <div style={{flex: 1}}>
                                  <p className="info-label">FOTO PASSE</p>
                                  <p className="info-value" style={{fontSize: '13px'}}>{candidate.files?.foto ? 'Disponível' : 'Pendente'}</p>
                              </div>
                              {candidate.files?.foto && (
                                  <a href={candidate.files.foto} target="_blank" rel="noreferrer"><Download size={18} color="#475569"/></a>
                              )}
                        </div>
                          <div className="doc-card">
                              <ClipboardCheck size={24} color={candidate.files?.certificado ? '#2563eb' : '#cbd5e1'} />
                              <div style={{flex: 1}}>
                                  <p className="info-label">CERTIFICADO</p>
                                  <p className="info-value" style={{fontSize: '13px'}}>{candidate.files?.certificado ? 'Disponível' : 'Pendente'}</p>
                              </div>
                              {candidate.files?.certificado && (
                                  <a href={candidate.files.certificado} target="_blank" rel="noreferrer"><Download size={18} color="#475569"/></a>
                              )}
                        </div>
                    </div>
                </div>

                {/* 5. Ações Finais (RUP) */}
                  <div className="info-section">
                    <div className="section-title"><CheckCircle2 size={18} /> Validação e Pagamento</div>
                      
                      {candidate.rupe ? (
                        <div className="rup-container">
                          <div className="rup-header">
                              {candidate.rupe.status_rup === 'PAGO' ? 'Pago com Sucesso! ✅' : 'Aguardando Pagamento ⏳'}
                          </div>
                          <div className="rup-details">
                            <div className="rup-detail-item">
                              <label>REFERÊNCIA</label>
                              <span>{candidate.rupe.codigo_rup}</span>
                            </div>
                            <div className="rup-detail-item">
                              <label>VALOR</label>
                              <span>{parseFloat(candidate.rupe.valor).toLocaleString('pt-AO', {style: 'currency', currency: 'AOA'})}</span>
                            </div>
                            <div className="rup-detail-item">
                              <label>ESTADO</label>
                              <span style={{color: candidate.rupe.status_rup === 'PAGO' ? '#166534' : '#ca8a04'}}>{candidate.rupe.status_rup}</span>
                            </div>
                          </div>
                          
                          <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                              <button className="btn-print" onClick={() => window.print()}>
                                <Printer size={18} /> Imprimir Ficha
                              </button>
                              
                              {/* Admin Button to Confirm Payment */}
                              {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && candidate.rupe.status_rup !== 'PAGO' && (
                                  candidate.anoLectivoAtivo === false ? (
                                      <button className="btn-finish" disabled style={{width: 'auto', background: '#9ca3af', cursor: 'not-allowed'}}>
                                        <CheckCircle2 size={18} style={{marginRight: '8px'}}/> Pagamento Bloqueado
                                      </button>
                                  ) : (
                                      <button className="btn-finish" onClick={() => onConfirmPayment(candidate)} style={{width: 'auto', background: '#059669'}}>
                                        <CheckCircle2 size={18} style={{marginRight: '8px'}}/> Confirmar Pagamento
                                      </button>
                                  )
                              )}
                          </div>
                        </div>
                      ) : (
                        !rupGenerated ? (
                            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                              <p style={{marginBottom: '16px', color: '#475569'}}>Este candidato ainda não tem Referência de Pagamento.</p>
                              {hasPermission(PERMISSIONS.MANAGE_INSCRITOS) && (
                                candidate.anoLectivoAtivo === false ? (
                                    <button className="btn-finish" disabled style={{maxWidth: '400px', margin: '0 auto', background: '#9ca3af', cursor: 'not-allowed'}}>
                                      <ShieldAlert size={18} style={{marginRight: '8px'}}/> Ano Lectivo Encerrado
                                    </button>
                                ) : (
                                    <button className="btn-finish" onClick={onGenerateRUP} style={{maxWidth: '400px', margin: '0 auto'}}>
                                      <CheckCircle2 size={18} style={{marginRight: '8px'}}/> Validar Inscrição e Gerar RUP
                                    </button>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="rup-container">
                                {/* Fallback local simulation if needed, but fetchRefresh mostly covers it */}
                              <div className="rup-header">Inscrição Validada - RUP Gerado! ✅</div>
                              <button onClick={onRefresh} className="btn-secondary">Atualizar Status</button>
                            </div>
                          )
                      )}
                  </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailModal;
