import React, { useState, useEffect } from 'react';
import { X, Edit, User, GraduationCap, ShieldAlert, Square, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';

const EditCandidateModal = ({ 
  isOpen, 
  onClose, 
  initialData, 
  onSave 
}) => {
  if (!isOpen || !initialData) return null;

  const [formData, setFormData] = useState({
    id: '',
    real_id: '',
    // Pessoais
    nome: '',
    bi: '',
    genero: '',
    dataNascimento: '',
    nacionalidade: '',
    naturalidade: '',
    provincia: '',
    municipio: '',
    residencia: '',
    telefone: '',
    email: '',
    deficiencia: '',
    
    // Acadêmicos
    escola_proveniencia: '',
    municipio_escola: '',
    tipo_escola: '',
    ano_conclusao: '',
    media_final: '',
    
    // Encarregado
    enc_nome: '',
    enc_parentesco: '',
    enc_telefone: '',
    enc_email: '',
    enc_residencia: '',
    
    // Admin
    notaExame: '',
    status: '',
    foto: null,
    foto_preview: null,
    foto_file: null
  });

  const [expandedSection, setExpandedSection] = useState('pessoais');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  useEffect(() => {
    if (initialData) {
        setFormData({
            ...initialData,
            foto_preview: null,
            foto_file: null // reset file on open
        });
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="evaluation-modal-card" onClick={(e) => e.stopPropagation()} style={{maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column'}}>
         <div className="evaluation-header">
           <h3>
             <Edit size={20} color="#1e3a8a" /> Editar Ficha de Inscrição
           </h3>
           <button onClick={onClose} className="btn-close-modal" style={{ position: 'static' }}>
             <X size={20} color="#64748b" />
           </button>
         </div>

         <div className="evaluation-body" style={{overflowY: 'auto', padding: '20px', flex: 1}}>
            
            {/* SECTION 1: PESSOAL */}
            <div className="form-collapse-section">
                <button 
                    className={`collapse-header ${expandedSection === 'pessoais' ? 'active' : ''}`}
                    onClick={() => toggleSection('pessoais')}
                >
                    <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <User size={18} /> Dados Pessoais
                    </span>
                    {expandedSection === 'pessoais' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                </button>
                
                {expandedSection === 'pessoais' && (
                    <div className="collapse-content animate-fade-in">
                        <div className="form-grid-2">
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Nome Completo</label>
                               <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Nº Bilhete</label>
                               <input type="text" value={formData.bi} onChange={(e) => setFormData({...formData, bi: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Data Nascimento</label>
                               <input type="date" value={formData.dataNascimento} onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Género</label>
                               <select value={formData.genero} onChange={(e) => setFormData({...formData, genero: e.target.value})} className="evaluation-input-small">
                                  <option value="M">Masculino</option>
                                  <option value="F">Feminino</option>
                               </select>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Nacionalidade</label>
                               <input type="text" value={formData.nacionalidade} onChange={(e) => setFormData({...formData, nacionalidade: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Naturalidade</label>
                               <input type="text" value={formData.naturalidade} onChange={(e) => setFormData({...formData, naturalidade: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Telefone</label>
                               <input type="text" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Email</label>
                               <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Deficiência?</label>
                               <input type="text" value={formData.deficiencia} onChange={(e) => setFormData({...formData, deficiencia: e.target.value})} className="evaluation-input-small" placeholder="Não ou descreva"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Província de Residência</label>
                                <input type="text" value={formData.provincia} onChange={(e) => setFormData({...formData, provincia: e.target.value})} className="evaluation-input-small"/>
                             </div>
                             <div className="evaluation-input-group">
                                <label className="evaluation-label">Município de Residência</label>
                                <input type="text" value={formData.municipio} onChange={(e) => setFormData({...formData, municipio: e.target.value})} className="evaluation-input-small"/>
                             </div>
                             <div className="evaluation-input-group">
                                <label className="evaluation-label">Residência (Bairro/Rua)</label>
                               <input type="text" value={formData.residencia} onChange={(e) => setFormData({...formData, residencia: e.target.value})} className="evaluation-input-small"/>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION 2: ACADÉMICO */}
            <div className="form-collapse-section">
                <button 
                    className={`collapse-header ${expandedSection === 'academicos' ? 'active' : ''}`}
                    onClick={() => toggleSection('academicos')}
                >
                    <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <GraduationCap size={18} /> Dados Académicos
                    </span>
                    {expandedSection === 'academicos' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                </button>
                
                {expandedSection === 'academicos' && (
                    <div className="collapse-content animate-fade-in">
                        <div className="form-grid-2">
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Escola Proveniência</label>
                               <input type="text" value={formData.escola_proveniencia} onChange={(e) => setFormData({...formData, escola_proveniencia: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Município Escola</label>
                               <input type="text" value={formData.municipio_escola} onChange={(e) => setFormData({...formData, municipio_escola: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Tipo de Escola</label>
                               <select value={formData.tipo_escola} onChange={(e) => setFormData({...formData, tipo_escola: e.target.value})} className="evaluation-input-small">
                                  <option value="Pública">Pública</option>
                                  <option value="Privada">Privada</option>
                               </select>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Ano Conclusão</label>
                               <input type="number" value={formData.ano_conclusao} onChange={(e) => setFormData({...formData, ano_conclusao: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Média Final (9ª)</label>
                               <input type="number" step="0.1" value={formData.media_final} onChange={(e) => setFormData({...formData, media_final: e.target.value})} className="evaluation-input-small"/>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION 3: ENCARREGADO */}
            <div className="form-collapse-section">
                <button 
                    className={`collapse-header ${expandedSection === 'encarregado' ? 'active' : ''}`}
                    onClick={() => toggleSection('encarregado')}
                >
                    <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <ShieldAlert size={18} /> Encarregado de Educação
                    </span>
                    {expandedSection === 'encarregado' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                </button>
                
                {expandedSection === 'encarregado' && (
                    <div className="collapse-content animate-fade-in">
                        <div className="form-grid-2">
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Nome Encarregado</label>
                               <input type="text" value={formData.enc_nome} onChange={(e) => setFormData({...formData, enc_nome: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Parentesco</label>
                               <input type="text" value={formData.enc_parentesco} onChange={(e) => setFormData({...formData, enc_parentesco: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Telefone Enc.</label>
                               <input type="text" value={formData.enc_telefone} onChange={(e) => setFormData({...formData, enc_telefone: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Email Enc.</label>
                               <input type="email" value={formData.enc_email} onChange={(e) => setFormData({...formData, enc_email: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Residência Enc.</label>
                               <input type="text" value={formData.enc_residencia} onChange={(e) => setFormData({...formData, enc_residencia: e.target.value})} className="evaluation-input-small"/>
                            </div>
                        </div>
                    </div>
                )}
            </div>

             {/* SECTION 4: ADMIN / STATUS */}
            <div className="form-collapse-section">
                <button 
                    className={`collapse-header ${expandedSection === 'admin' ? 'active' : ''}`}
                    onClick={() => toggleSection('admin')}
                >
                    <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                         <CheckCircle2 size={18} /> Situação da Candidatura
                    </span>
                    {expandedSection === 'admin' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                </button>
                
                {expandedSection === 'admin' && (
                    <div className="collapse-content animate-fade-in">
                          <div className="form-grid-2">
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Foto do Candidato</label>
                               <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                   <div style={{ 
                                       width: '100px', 
                                       height: '100px', 
                                       borderRadius: '12px', 
                                       overflow: 'hidden', 
                                       border: '2px solid #e2e8f0',
                                       background: '#f8fafc',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center'
                                   }}>
                                       {formData.foto_preview || formData.foto ? (
                                           <img src={formData.foto_preview || formData.foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                       ) : (
                                           <User size={40} color="#cbd5e1" />
                                       )}
                                   </div>
                                   <div style={{ flex: 1 }}>
                                       <input 
                                          type="file" 
                                          accept="image/*" 
                                          onChange={(e) => {
                                              const file = e.target.files[0];
                                              if (file) {
                                                  setFormData({
                                                      ...formData, 
                                                      foto_file: file, 
                                                      foto_preview: URL.createObjectURL(file)
                                                  });
                                              }
                                          }}
                                          style={{ fontSize: '12px' }}
                                       />
                                       <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Tamanho recomendado: 3x4 (JPG/PNG)</p>
                                   </div>
                               </div>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Nota Exame (0-20)</label>
                               <input type="number" value={formData.notaExame} onChange={(e) => setFormData({...formData, notaExame: e.target.value})} className="evaluation-input-small"/>
                            </div>
                            <div className="evaluation-input-group">
                               <label className="evaluation-label">Estado da Candidatura</label>
                               <select 
                                  value={formData.status}
                                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                                  className="evaluation-input-small"
                               >
                                  <option value="Pendente">Pendente</option>
                                  <option value="Em Análise">Em Análise</option>
                                  <option value="Pago">Pago (Aguardando Exame)</option>
                                  <option value="Aprovado">Aprovado</option>
                                  <option value="Não Admitido">Não Admitido</option>
                                  <option value="Matriculado">Matriculado</option>
                               </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

         </div>

         <div className="evaluation-actions" style={{padding: '20px', borderTop: '1px solid #e2e8f0', background: 'white'}}>
           <button onClick={onClose} className="btn-cancel">
             Cancelar
           </button>
           <button onClick={handleSubmit} className="btn-confirm">
             Salvar Alterações
           </button>
         </div>
      </div>
    </div>
  );
};

export default EditCandidateModal;
