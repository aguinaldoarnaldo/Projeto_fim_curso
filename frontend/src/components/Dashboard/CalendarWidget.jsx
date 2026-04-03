import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import './CalendarWidget.css';

const CalendarWidget = ({ scheduling }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const today = new Date();

    // Parse all scheduling events from the academic year dates
    const allSchedulingEvents = useMemo(() => {
        if (!scheduling) return [];
        const events = [];
        const processDate = (dateStr, name, type) => {
            if (!dateStr) return;
            const d = new Date(dateStr);
            // Use UTC values to avoid timezone shifts ("2026-09-01" → Aug 31 local time)
            const day   = d.getUTCDate();
            const month = d.getUTCMonth();
            const year  = d.getUTCFullYear();
            events.push({ day, month, year, name, type, raw: dateStr });
        };

        processDate(scheduling.inicio_inscricoes,     "Início das Inscrições",  "inscricao");
        processDate(scheduling.fim_inscricoes,         "Término das Inscrições", "inscricao");
        processDate(scheduling.inicio_matriculas,      "Início das Matrículas",  "matricula");
        processDate(scheduling.fim_matriculas,         "Término das Matrículas", "matricula");
        processDate(scheduling.data_exame_admissao,    "Exame de Admissão",      "exame");
        processDate(scheduling.data_teste_diagnostico, "Teste de Diagnóstico",   "teste");

        // Sort chronologically
        return events.sort((a, b) => new Date(a.raw) - new Date(b.raw));
    }, [scheduling]);

    // Auto-navigate to the month with the next upcoming event when the year changes
    useEffect(() => {
        if (allSchedulingEvents.length === 0) return;

        const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const nextEvent = allSchedulingEvents.find(e => {
            const evMs = new Date(e.year, e.month, e.day).getTime();
            return evMs >= todayMs;
        });

        if (nextEvent) {
            setViewDate(new Date(nextEvent.year, nextEvent.month, 1));
        } else {
            // All events are in the past — show the last one
            const last = allSchedulingEvents[allSchedulingEvents.length - 1];
            setViewDate(new Date(last.year, last.month, 1));
        }
    }, [scheduling]); // eslint-disable-line react-hooks/exhaustive-deps

    // Holidays (Angola)
    const holidays = [
        { day: 1,  month: 0,  name: "Ano Novo" },
        { day: 4,  month: 1,  name: "Dia do Início da Luta Armada" },
        { day: 8,  month: 2,  name: "Dia Internacional da Mulher" },
        { day: 23, month: 2,  name: "Dia da Libertação da África Austral" },
        { day: 4,  month: 3,  name: "Dia da Paz" },
        { day: 1,  month: 4,  name: "Dia do Trabalhador" },
        { day: 17, month: 8,  name: "Dia do Herói Nacional" },
        { day: 2,  month: 10, name: "Dia dos Finados" },
        { day: 11, month: 10, name: "Dia da Independência" },
        { day: 25, month: 11, name: "Natal" }
    ];

    const monthNames = [
        "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
        "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ];
    const weekDays = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];

    const currentMonth = viewDate.getMonth();
    const currentYear  = viewDate.getFullYear();

    const daysInMonth     = (m, y) => new Date(y, m + 1, 0).getDate();
    const firstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

    const nextMonth  = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));
    const prevMonth  = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
    const goToToday  = () => setViewDate(new Date());

    const isHoliday   = (day, month) => holidays.find(h => h.day === day && h.month === month);
    const getDayEvent = (day, month, year) =>
        allSchedulingEvents.find(e => e.day === day && e.month === month && e.year === year);

    const renderDays = () => {
        const days = [];
        const emptyDays  = firstDayOfMonth(currentMonth, currentYear);
        const totalDays  = daysInMonth(currentMonth, currentYear);

        for (let i = 0; i < emptyDays; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let i = 1; i <= totalDays; i++) {
            const isToday      = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const holiday      = isHoliday(i, currentMonth);
            const academicEvent = getDayEvent(i, currentMonth, currentYear);

            days.push(
                <div
                    key={i}
                    className={`calendar-day${isToday ? ' today' : ''}${holiday ? ' holiday' : ''}${academicEvent ? ' academic-event' : ''}`}
                    title={holiday ? holiday.name : (academicEvent ? academicEvent.name : '')}
                >
                    <span>{i}</span>
                    {holiday       && <div className="holiday-dot"></div>}
                    {academicEvent && <div className={`event-dot type-${academicEvent.type}`}></div>}
                </div>
            );
        }
        return days;
    };

    const currentMonthHolidays = holidays.filter(h => h.month === currentMonth);

    const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const upcomingEvents = allSchedulingEvents.filter(e =>
        new Date(e.year, e.month, e.day).getTime() >= todayMs
    );

    // Events to display in the list: upcoming if available, otherwise all (past, muted)
    const eventsToShow   = upcomingEvents.length > 0 ? upcomingEvents : allSchedulingEvents;
    const allArePast     = upcomingEvents.length === 0 && allSchedulingEvents.length > 0;

    const typeColors = {
        inscricao: '#3b82f6',
        matricula: '#10b981',
        exame:     '#f59e0b',
        teste:     '#8b5cf6'
    };

    return (
        <div className="calendar-widget">
            <div className="calendar-header">
                <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={18} /></button>
                <div className="header-title" onClick={goToToday} title="Voltar para Hoje">
                    <span>{monthNames[currentMonth]} {currentYear}</span>
                </div>
                <button onClick={nextMonth} className="nav-btn"><ChevronRight size={18} /></button>
            </div>

            <div className="calendar-grid">
                {weekDays.map(day => (
                    <div key={day} className="calendar-weekday">{day}</div>
                ))}
                {renderDays()}
            </div>

            <div className="calendar-events-container">
                {/* All upcoming academic events — not just the current viewed month */}
                <div className="holiday-list">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarIcon size={14} /> Escalamento Académico
                    </h4>
                    {allSchedulingEvents.length === 0 ? (
                        <p className="no-holidays">Defina as datas no Ano Lectivo activo.</p>
                    ) : (
                        <ul>
                            {eventsToShow.map((e, idx) => (
                                <li key={idx} className="event-item" style={{ opacity: allArePast ? 0.55 : 1 }}>
                                    <span
                                        className={`event-date type-${e.type}`}
                                        style={{
                                            background: typeColors[e.type] + '22',
                                            color: typeColors[e.type],
                                            fontWeight: 700,
                                            minWidth: '42px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {String(e.day).padStart(2,'0')}/{String(e.month + 1).padStart(2,'0')}
                                    </span>
                                    <span className="event-name">{e.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Holidays for the current viewed month */}
                <div className="holiday-list">
                    <h4>Feriados — {monthNames[currentMonth]}</h4>
                    {currentMonthHolidays.length > 0 ? (
                        <ul>
                            {currentMonthHolidays.map((h, idx) => (
                                <li key={idx}>
                                    <span className="holiday-date">{h.day}</span>
                                    <span className="holiday-name">{h.name}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-holidays">Sem feriados neste mês.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarWidget;
