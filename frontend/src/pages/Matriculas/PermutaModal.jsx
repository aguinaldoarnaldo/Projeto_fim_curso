import React, { useState } from 'react';
import { X, Search, ArrowRightLeft, User, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const PermutaModal = ({ isOpen, onClose, onSuccess }) => {
    const [searchTerm1, setSearchTerm1] = useState('');
    const [searchTerm2, setSearchTerm2] = useState('');
    
    // Search Results
    const [results1, setResults1] = useState([]);
    const [results2, setResults2] = useState([]);
    
    // Selected Students
    const [student1, setStudent1] = useState(null);
    const [student2, setStudent2] = useState(null);

    const [loading, setLoading] = useState(false);
    const [agreementChecked, setAgreementChecked] = useState(false);

    // Search Logic
    const handleSearch = async (term, setResults, excludeId = null) => {
        if (!term || term.length < 2) {
            setResults([]);
            return;
        }

        try {
            // Using matriculas endpoint for search
            const response = await api.get(`matriculas/?search=${term}`);
            let data = response.data.results || response.data;
            
            // Exclude already selected student (if any)
            if (excludeId) {
                data = data.filter(s => s.id_matricula !== excludeId);
            }

            setResults(data.slice(0, 5)); // Limit to 5 results
        } catch (error) {
            console.error("Search error", error);
        }
    };

    const handleSelect1 = (student) => {
        setStudent1(student);
        setSearchTerm1('');
        setResults1([]);
    };

    const handleSelect2 = (student) => {
        setStudent2(student);
        setSearchTerm2('');
        setResults2([]);
    };

    const handleConfirm = async () => {
        if (!student1 || !student2) return;

        setLoading(true);
        try {
            const payload = {
                matricula_id_1: student1.id_matricula,
                matricula_id_2: student2.id_matricula
            };

            await api.post('matriculas/permutar/', payload);
            alert(`Permuta realizada com sucesso!\n\n${student1.aluno_nome} <-> ${student2.aluno_nome}`);
            
            // Reset
            setStudent1(null);
            setStudent2(null);
            onSuccess(); // Close and Refresh
        } catch (error) {
            console.error("Permuta error", error);
            alert(error.response?.data?.erro || "Erro ao realizar permuta. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="detail-modal-card" style={{ maxWidth: '800px', height: 'auto', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                <div className="evaluation-header" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                    <h3><ArrowRightLeft size={20} /> Realizar Permuta de Turmas</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="evaluation-body" style={{ padding: '30px', textAlign: 'left', overflowY: 'auto' }}>
                    
                    <div className="permuta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: '20px', alignItems: 'start' }}>
                        
                        {/* Student 1 Panel */}
                        <div className="student-select-panel">
                            <h4 style={{ color: '#475569', marginBottom: '10px' }}>Estudante 1</h4>
                            
                            {!student1 ? (
                                <div className="search-box-permuta" style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3af' }} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nome ou matrícula..." 
                                        value={searchTerm1}
                                        onChange={(e) => { setSearchTerm1(e.target.value); handleSearch(e.target.value, setResults1, student2?.id_matricula); }}
                                        className="field-input"
                                        style={{ paddingLeft: '35px' }}
                                    />
                                    {results1.length > 0 && (
                                        <div className="search-dropdown" style={{ position: 'absolute', width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 10, marginTop: '5px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                            {results1.map(r => (
                                                <div 
                                                    key={r.id_matricula} 
                                                    onClick={() => handleSelect1(r)}
                                                    style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                                >
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                                                        {r.aluno_foto ? <img src={r.aluno_foto} style={{ width: '100%' }} /> : <User size={16} style={{ margin: '7px' }} />}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{r.aluno_nome}</p>
                                                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                                            {r.turma_codigo || 'Sem Turma'} • {r.curso_nome} • <span style={{color: '#0f172a', fontWeight: 'bold'}}>{r.periodo_nome}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="selected-student-card" style={{ background: '#f0f9ff', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd', position: 'relative' }}>
                                    <button onClick={() => setStudent1(null)} style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={16} /></button>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            {student1.aluno_foto ? <img src={student1.aluno_foto} style={{ width: '100%', height:'100%', objectFit: 'cover', borderRadius: '50%' }} /> : <User size={24} color="#0284c7" />}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, color: '#0369a1', margin: 0 }}>{student1.aluno_nome}</p>
                                            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0' }}>{student1.turma_codigo} ({student1.periodo_nome})</p>
                                            <span style={{ fontSize: '11px', background: 'white', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{student1.curso_nome}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Swap Icon */}
                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ArrowRightLeft size={20} color="#64748b" />
                            </div>
                        </div>

                        {/* Student 2 Panel */}
                        <div className="student-select-panel">
                            <h4 style={{ color: '#475569', marginBottom: '10px', textAlign: 'right' }}>Estudante 2</h4>
                            
                            {!student2 ? (
                                <div className="search-box-permuta" style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3af' }} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nome ou matrícula..." 
                                        value={searchTerm2}
                                        onChange={(e) => { setSearchTerm2(e.target.value); handleSearch(e.target.value, setResults2, student1?.id_matricula); }}
                                        className="field-input"
                                        style={{ paddingLeft: '35px' }}
                                    />
                                    {results2.length > 0 && (
                                        <div className="search-dropdown" style={{ position: 'absolute', width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 10, marginTop: '5px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                            {results2.map(r => (
                                                <div 
                                                    key={r.id_matricula} 
                                                    onClick={() => handleSelect2(r)}
                                                    style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                                >
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                                                        {r.aluno_foto ? <img src={r.aluno_foto} style={{ width: '100%' }} /> : <User size={16} style={{ margin: '7px' }} />}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{r.aluno_nome}</p>
                                                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                                            {r.turma_codigo || 'Sem Turma'} • {r.curso_nome} • <span style={{color: '#0f172a', fontWeight: 'bold'}}>{r.periodo_nome}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="selected-student-card" style={{ background: '#f0f9ff', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd', position: 'relative' }}>
                                    <button onClick={() => setStudent2(null)} style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={16} /></button>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'flex-end', textAlign: 'right' }}>
                                        <div>
                                            <p style={{ fontWeight: 700, color: '#0369a1', margin: 0 }}>{student2.aluno_nome}</p>
                                            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0' }}>{student2.turma_codigo} ({student2.periodo_nome})</p>
                                            <span style={{ fontSize: '11px', background: 'white', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{student2.curso_nome}</span>
                                        </div>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            {student2.aluno_foto ? <img src={student2.aluno_foto} style={{ width: '100%', height:'100%', objectFit: 'cover', borderRadius: '50%' }} /> : <User size={24} color="#0284c7" />}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <AlertCircle size={24} color="#64748b" style={{ flexShrink: 0 }} />
                        <div>
                            <h5 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#334155' }}>Como funciona a permuta?</h5>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                                Ao confirmar, o <strong>Estudante 1</strong> passará para a turma do Estudante 2, e o <strong>Estudante 2</strong> passará para a turma do Estudante 1. <br/>
                                <span style={{color: '#b45309'}}>Nota:</span> Isso trocará também os <strong>Turnos</strong> (Manhã/Tarde) se forem diferentes. Certifique-se de que ambos os alunos concordam.
                            </p>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <input 
                            type="checkbox" 
                            id="confirm-agreement" 
                            style={{ marginTop: '4px' }}
                            checked={agreementChecked}
                            onChange={(e) => setAgreementChecked(e.target.checked)}
                        />
                        <label htmlFor="confirm-agreement" style={{ fontSize: '14px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                            Declaro que <strong>ambos os estudantes concordam</strong> com a permuta, incluindo a troca de turno (Manhã/Tarde) caso as turmas sejam de períodos diferentes.
                        </label>
                    </div>
                </div>

                <div className="evaluation-actions">
                    <button onClick={onClose} className="btn-cancel">Cancelar</button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={!student1 || !student2 || loading || !agreementChecked}
                        className="btn-confirm"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: (!student1 || !student2 || !agreementChecked) ? 0.5 : 1, cursor: (!student1 || !student2 || !agreementChecked) ? 'not-allowed' : 'pointer' }}
                    >
                         {loading ? 'Processando...' : <><ArrowRightLeft size={18} /> Confirmar Permuta</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermutaModal;
