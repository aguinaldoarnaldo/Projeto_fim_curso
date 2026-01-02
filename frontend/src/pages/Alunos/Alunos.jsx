import React, { useState } from 'react';
import {
    Search,
    Plus,
    Filter,
    MoreVertical,
    X,
    User,
    BookOpen,
    Home,
    Clock,
    Calendar,
    Phone,
    Mail,
    MapPin,
    ClipboardList,
    ChevronRight,
    ShieldCheck,
    GraduationCap
} from 'lucide-react';

const Alunos = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showNewStudentModal, setShowNewStudentModal] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        ano: '',
        sala: '',
        curso: '',
        turma: '',
        classe: ''
    });

    const studentsData = [
        {
            id: 'ALU-2024-001',
            nome: 'Ana Paula Lourenço',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-002',
            nome: 'Bruno Costa',
            anoLectivo: '2024/2025',
            classe: '12ª Classe',
            curso: 'Gestão',
            sala: 'S-204',
            turno: 'Tarde',
            turma: 'GST12B',
            status: 'Suspenso',
            dataMatricula: '10 Jan 2024',
            detalhes: {
                nif: 'B00987654',
                nascimento: '03/11/2006',
                encarregado: 'Carla Costa',
                telefone: '+244 931 222 333',
                email: 'bruno.costa@email.com',
                endereco: 'Cazenga, Luanda',
                bi: '009876543LA092',
                obs: 'Aguardando regularização de mensalidade.'
            }
        },
        {
            id: 'ALU-2024-003',
            nome: 'Carla Dias Macaia',
            anoLectivo: '2023/2024',
            classe: '11ª Classe',
            curso: 'Direito',
            sala: 'S-102',
            turno: 'Noite',
            turma: 'DIR11C',
            status: 'Concluído',
            dataMatricula: '15 Jan 2023',
            detalhes: {
                nif: 'C00456123',
                nascimento: '20/09/2005',
                encarregado: 'Manuel Macaia',
                telefone: '+244 944 444 555',
                email: 'carla.macaia@email.com',
                endereco: 'Viana, Luanda',
                bi: '004561234LA011',
                obs: 'Graduada com distinção.'
            }
        },

        {
            id: 'ALU-2024-001',
            nome: 'Ana Paula Lourenço',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-001',
            nome: 'Ana Paula Lourenço',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-001',
            nome: 'Ana Paula Lourenço',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-001',
            nome: 'Ana Paula Lourenço',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-001',
            nome: 'Ana Paula Lourenço',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-001',
            nome: 'Ana Paula Lourenço',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-001',
            nome: 'Ana Paula Lourenço',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-001',
            nome: 'Ana Paula Lourenço',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-001',
            nome: 'Aguinaldo Arnaldo',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
        {
            id: 'ALU-2024-001',
            nome: 'Aguinaldo Arnaldo',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
          {
            id: 'ALU-2024-001',
            nome: 'Aguinaldo Arnaldo',
            anoLectivo: '2024/2025',
            classe: '10ª Classe',
            curso: 'Informática',
            sala: 'L-01',
            turno: 'Manhã',
            turma: 'INF10A',
            status: 'Ativo',
            dataMatricula: '05 Jan 2024',
            detalhes: {
                nif: 'A00123456',
                nascimento: '12/05/2008',
                encarregado: 'João Lourenço',
                telefone: '+244 923 000 111',
                email: 'ana.paula@email.com',
                endereco: 'Luanda, Maianga',
                bi: '001234567LA041',
                obs: 'A aluna possui alergia a amendoim.'
            }
        },
    ];

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Ativo': return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
            case 'Suspenso': return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' };
            case 'Concluído': return { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' };
            default: return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
        }
    };
    

    return (
        <div className="page-container">
            <header className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Gestão de Estudantes</h1>
                        <p>Visualização e administração de todos os alunos registrados.</p>
                    </div>
                    <button
                        onClick={() => setShowNewStudentModal(true)}
                        className="nav-item-active"
                        style={{ height: 'fit-content', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, transition: 'transform 0.2s' }}
                    >
                        <Plus size={20} />
                        Novo Aluno
                    </button>
                </div>
            </header>

            <div className="table-card" style={{ padding: '0' }}>
                {/* Search and Filters Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou ID do aluno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', color: '#0f172a', fontSize: '15px' }}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: showFilters ? '#1e3a8a' : 'white', color: showFilters ? 'white' : '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 500, transition: 'all 0.2s' }}
                    >
                        <Filter size={18} />
                        Filtros
                    </button>
                </div>

                {/* Dynamic Filters */}
                {showFilters && (
                    <div style={{ padding: '24px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Ano Lectivo</label>
                                <select name="ano" value={filters.ano} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', color: '#1e293b', background: 'white' }}>
                                    <option value="">Todos</option>
                                    <option value="2024/2025">2024/2025</option>
                                    <option value="2023/2024">2023/2024</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Classe</label>
                                <select name="classe" value={filters.classe} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', color: '#1e293b' }}>
                                    <option value="">Todas</option>
                                    <option value="10ª Classe">10ª Classe</option>
                                    <option value="11ª Classe">11ª Classe</option>
                                    <option value="12ª Classe">12ª Classe</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Curso</label>
                                <select name="curso" value={filters.curso} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', color: '#1e293b' }}>
                                    <option value="">Todos</option>
                                    <option value="Informática">Informática</option>
                                    <option value="Gestão">Gestão</option>
                                    <option value="Direito">Direito</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Sala</label>
                                <select name="sala" value={filters.sala} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', color: '#1e293b' }}>
                                    <option value="">Todas</option>
                                    <option value="L-01">L-01</option>
                                    <option value="S-204">S-204</option>
                                    <option value="S-102">S-102</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Turma</label>
                                <select name="turma" value={filters.turma} onChange={handleFilterChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', color: '#1e293b' }}>
                                    <option value="">Todas</option>
                                    <option value="INF10A">INF10A</option>
                                    <option value="GST12B">GST12B</option>
                                    <option value="DIR11C">DIR11C</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setFilters({ ano: '', sala: '', curso: '', turma: '', classe: '' })}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <X size={16} /> Resetar Filtros
                            </button>
                        </div>
                    </div>
                )}

                {/* Students Table */}
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '150px' }}>Nº Aluno</th>
                                <th style={{ minWidth: '220px' }}>Nome Completo</th>
                                <th>Ano Lectivo</th>
                                <th>Classe</th>
                                <th>Curso</th>
                                <th>Sala</th>
                                <th>Turno</th>
                                <th>Turma</th>
                                <th>Estado</th>
                                <th>Data Matrícula</th>
                                <th style={{ textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentsData.map((s) => (
                                <tr key={s.id} onClick={() => setSelectedStudent(s)} style={{ cursor: 'pointer' }}>
                                    <td style={{ fontWeight: 700, color: '#1e40af' }}>{s.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                                {s.nome.charAt(0)}
                                            </div>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{s.nome}</span>
                                        </div>
                                    </td>
                                    <td>{s.anoLectivo}</td>
                                    <td style={{ fontWeight: 700 }}>{s.classe}</td>
                                    <td style={{ color: '#475569' }}>{s.curso}</td>
                                    <td>{s.sala}</td>
                                    <td>{s.turno}</td>
                                    <td>{s.turma}</td>
                                    <td>
                                        <span
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: '100px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                background: getStatusStyle(s.status).bg,
                                                color: getStatusStyle(s.status).color,
                                                border: `1px solid ${getStatusStyle(s.status).border}`
                                            }}
                                        >
                                            {s.status}
                                        </span>
                                    </td>
                                    <td style={{ color: '#94a3b8', fontSize: '13px' }}>{s.dataMatricula}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
                                            <MoreVertical size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Student Detail Central Modal */}
            {selectedStudent && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ width: '90%', maxWidth: '800px', background: 'white', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', position: 'relative', animation: 'scaleUp 0.3s ease-out' }}>
                        <button
                            onClick={() => setSelectedStudent(null)}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '14px', cursor: 'pointer', zInteger: 10 }}>
                            <X size={24} color="#64748b" />
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
                            {/* Left Profile Card */}
                            <div style={{ background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)', padding: '48px 32px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '120px', height: '120px', borderRadius: '40px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 800, marginBottom: '24px', border: '2px solid rgba(255,255,255,0.2)' }}>
                                    {selectedStudent.nome.charAt(0)}
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>{selectedStudent.nome}</h2>
                                <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '24px' }}>ID: {selectedStudent.id}</p>

                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '100px', fontWeight: 700, fontSize: '13px' }}>
                                    {selectedStudent.status}
                                </div>

                                <div style={{ marginTop: 'auto', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', opacity: 0.9 }}>
                                        <ClipboardList size={18} />
                                        <span style={{ fontSize: '14px' }}>Lançamento de Notas</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.9 }}>
                                        <ShieldCheck size={18} />
                                        <span style={{ fontSize: '14px' }}>Histórico Disciplinar</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Content Area */}
                            <div style={{ padding: '48px', overflowY: 'auto', maxHeight: '80vh' }}>
                                <div style={{ marginBottom: '40px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <User size={20} /> Informações do Aluno
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                        <div>
                                            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>Nº BILHETE IDENTIDADE</p>
                                            <p style={{ fontWeight: 600, color: '#1e293b' }}>{selectedStudent.detalhes.bi}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>NIF</p>
                                            <p style={{ fontWeight: 600, color: '#1e293b' }}>{selectedStudent.detalhes.nif}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>DATA NASCIMENTO</p>
                                            <p style={{ fontWeight: 600, color: '#1e293b' }}>{selectedStudent.detalhes.nascimento}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>ENCARREGADO</p>
                                            <p style={{ fontWeight: 600, color: '#1e293b' }}>{selectedStudent.detalhes.encarregado}</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '40px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Mail size={20} /> Contactos e Morada
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#475569' }}>
                                            <Phone size={18} />
                                            <span style={{ fontWeight: 500 }}>{selectedStudent.detalhes.telefone}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#475569' }}>
                                            <Mail size={18} />
                                            <span style={{ fontWeight: 500 }}>{selectedStudent.detalhes.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#475569' }}>
                                            <MapPin size={18} />
                                            <span style={{ fontWeight: 500 }}>{selectedStudent.detalhes.endereco}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <ClipboardList size={20} /> Observações Internas
                                    </h3>
                                    <div style={{ padding: '20px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                                        {selectedStudent.detalhes.obs}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Student Form Modal */}
            {showNewStudentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ width: '90%', maxWidth: '700px', background: 'white', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ padding: '32px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Novo Registro de Aluno</h2>
                                <p style={{ color: '#64748b', marginTop: '4px' }}>Preencha os dados básicos para iniciar a matrícula.</p>
                            </div>
                            <button
                                onClick={() => setShowNewStudentModal(false)}
                                style={{ background: '#f8fafc', border: 'none', padding: '12px', borderRadius: '16px', cursor: 'pointer' }}>
                                <X size={24} color="#64748b" />
                            </button>
                        </div>

                        <form style={{ padding: '40px' }} onSubmit={(e) => e.preventDefault()}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>Nome Completo</label>
                                    <input type="text" placeholder="Ex: João Manuel dos Santos" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>Nº Bilhete de Identidade</label>
                                    <input type="text" placeholder="000XXXXXXXLA0XX" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>NIF</label>
                                    <input type="text" placeholder="XXXXXXX" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>Curso</label>
                                    <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }}>
                                        <option>Seleccionar Curso</option>
                                        <option>Informática</option>
                                        <option>Gestão</option>
                                        <option>Direito</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>Classe</label>
                                    <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }}>
                                        <option>Seleccionar Classe</option>
                                        <option>10ª Classe</option>
                                        <option>11ª Classe</option>
                                        <option>12ª Classe</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => setShowNewStudentModal(false)}
                                    style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                                <button
                                    style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: '#1e3a8a', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    Confirmar Registro <ChevronRight size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Alunos;