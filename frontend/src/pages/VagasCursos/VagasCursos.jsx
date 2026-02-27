import React, { useState, useEffect } from 'react';
import './VagasCursos.css';
import {
    Search,
    Plus,
    Edit3,
    BookOpen,
    Calendar,
    Filter,
    CheckCircle,
    Info,
    Save,
    X
} from 'lucide-react';
import api from '../../services/api';
import { parseApiError } from '../../utils/errorParser';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';
import { useConfig } from '../../context/ConfigContext';

const VagasCursos = () => {
    const { hasPermission } = usePermission();
    const [vagas, setVagas] = useState([]);
    const [courses, setCourses] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVaga, setEditingVaga] = useState(null);
    const [vagasCount, setVagasCount] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resVagas, resCursos, resAnos] = await Promise.all([
                api.get('vaga-curso/'),
                api.get('cursos/'),
                api.get('anos-lectivos/?all=true')
            ]);

            setVagas(resVagas.data.results || resVagas.data || []);
            setCourses(resCursos.data.results || resCursos.data || []);
            
            const anos = resAnos.data.results || resAnos.data || [];
            setAcademicYears(anos);

            // Selecionar o ano activo por padrão se existir
            const active = anos.find(a => a.activo);
            if (active) setSelectedYear(active.id_ano);

            setLoading(false);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setError('Falha ao carregar informações de vagas.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (vaga) => {
        setEditingVaga(vaga);
        setVagasCount(vaga.vagas);
        setShowEditModal(true);
    };

    const handleSave = async () => {
        try {
            await api.patch(`vaga-curso/${editingVaga.id}/`, { 
                vagas: vagasCount
            });
            alert("Vagas atualizadas com sucesso!");
            setShowEditModal(false);
            fetchData();
        } catch (err) {
            alert(parseApiError(err, "Erro ao salvar vagas."));
        }
    };

    const handleCreateVaga = async (e) => {
        const id_curso = e.target.value;
        if (!id_curso || !selectedYear) return;

        try {
            await api.post('vaga-curso/', {
                id_curso: id_curso,
                ano_lectivo: selectedYear,
                vagas: 0
            });
            alert("Vagas vinculadas ao curso com sucesso!");
            fetchData();
        } catch (err) {
            alert(parseApiError(err, "Este curso já possui vagas configuradas para este ano."));
        }
    };

    const filteredVagas = vagas.filter(v => {
        const matchesYear = !selectedYear || v.ano_lectivo == selectedYear;
        const matchesSearch = v.curso_nome?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesYear && matchesSearch;
    });

    // Cursos que ainda não têm vagas configuradas para o ano selecionado
    const availableCourses = courses.filter(c => 
        !vagas.find(v => v.id_curso === c.id_curso && v.ano_lectivo == selectedYear)
    );

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="page-header-content">
                    <div>
                        <h1>Gestão de Vagas</h1>
                        <p>Configure o número de vagas disponíveis para cada curso por ano lectivo.</p>
                    </div>
                    <div className="page-header-actions">
                        <div className="year-selector-wrapper">
                            <Calendar size={18} />
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="year-select-v2"
                            >
                                <option value="">Todos os Anos</option>
                                {academicYears.map(ano => (
                                    <option key={ano.id_ano} value={ano.id_ano}>
                                        {ano.nome} ({ano.status})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <div className="table-card">
                <div className="search-container" style={{ display: 'flex', gap: '15px' }}>
                    <div className="search-wrapper" style={{ flex: 1 }}>
                        <Search size={18} className="search-icon-v2" />
                        <input
                            type="text"
                            placeholder="Pesquisar por curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    
                    {selectedYear && availableCourses.length > 0 && (
                        <div className="add-vaga-wrapper">
                            <Plus size={18} />
                            <select onChange={handleCreateVaga} className="add-select" value="">
                                <option value="" disabled>Adicionar Curso à Lista...</option>
                                {availableCourses.map(c => (
                                    <option key={c.id_curso} value={c.id_curso}>{c.nome_curso}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <span>Carregando vagas...</span>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Curso / Área</th>
                                    <th>Ano Lectivo</th>
                                    <th style={{ textAlign: 'center' }}>Vagas Totais</th>
                                    <th style={{ textAlign: 'center' }}>Ocupadas</th>
                                    <th style={{ textAlign: 'center' }}>Disponíveis</th>
                                    <th style={{ textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVagas.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                            Nenhuma configuração de vaga encontrada para os filtros aplicados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVagas.map((v) => (
                                        <tr key={v.id} className="animate-fade-in">
                                            <td>
                                                <div className="vaga-info">
                                                    <div className="vaga-icon">
                                                        <BookOpen size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="vaga-curso-name">{v.curso_nome}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="year-badge">{v.ano_lectivo_nome}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="vagas-count-badge">{v.vagas}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="filled-count">{v.vagas_preenchidas}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`available-status-badge ${v.vagas_disponiveis <= 5 ? 'low' : 'ok'}`}>
                                                    {v.vagas_disponiveis}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {hasPermission(PERMISSIONS.MANAGE_CONFIGURACOES) && (
                                                    <button onClick={() => handleEdit(v)} className="btn-edit-vaga">
                                                        <Edit3 size={16} />
                                                        Configurar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Edição */}
            {showEditModal && (
                <div className="vaga-modal-overlay">
                    <div className="vaga-modal-card">
                        <div className="modal-header-v2">
                            <div className="modal-icon-badge">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h2>Configurar Vagas</h2>
                                <p>{editingVaga?.curso_nome} - {editingVaga?.ano_lectivo_nome}</p>
                            </div>
                        </div>

                        <div className="modal-body-v2">
                            <label>Quantidade de Vagas Disponíveis</label>
                            <div className="input-number-wrapper">
                                <input 
                                    type="number" 
                                    value={vagasCount}
                                    onChange={(e) => setVagasCount(parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                                <div className="input-hint">
                                    <Info size={14} />
                                    <span>Este valor será exibido no portal de candidaturas para este ano específico.</span>
                                </div>
                            </div>

                        </div>

                        <div className="modal-actions-v2">
                            <button onClick={() => setShowEditModal(false)} className="btn-cancel-v2">
                                <X size={18} /> Cancelar
                            </button>
                            <button onClick={handleSave} className="btn-save-v2">
                                <Save size={18} /> Salvar Vagas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VagasCursos;
