import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import './CalendarWidget.css';

const CalendarWidget = ({ scheduling }) => {
    // Current viewed date (for navigation)
    const [viewDate, setViewDate] = useState(new Date());
    
    // Real today (for highlighting)
    const today = new Date();

    // Scheduling Events Processing
    const getSchedulingEvents = () => {
        if (!scheduling) return [];
        
        const events = [];
        const processDate = (dateStr, name, type) => {
            if (!dateStr) return;
            const d = new Date(dateStr);
            // Add 1 day if it's a date string from DB to handle timezone shifts often seen in JS Date(dateStr)
            // But usually, we just need the UTC components if it's YYYY-MM-DD
            const day = d.getUTCDate();
            const month = d.getUTCMonth();
            const year = d.getUTCFullYear();
            events.push({ day, month, year, name, type });
        };

        processDate(scheduling.inicio_inscricoes, "Início das Inscrições", "inscricao");
        processDate(scheduling.fim_inscricoes, "Término das Inscrições", "inscricao");
        processDate(scheduling.inicio_matriculas, "Início das Matrículas", "matricula");
        processDate(scheduling.fim_matriculas, "Término das Matrículas", "matricula");
        processDate(scheduling.data_exame_admissao, "Exame de Admissão", "exame");
        processDate(scheduling.data_teste_diagnostico, "Teste de Diagnóstico", "teste");

        return events;
    };

    const allSchedulingEvents = getSchedulingEvents();

    // Holidays Configuration (Angola Context)
    const holidays = [
        { day: 1, month: 0, name: "Ano Novo" },
        { day: 4, month: 1, name: "Dia do Início da Luta Armada" },
        { day: 8, month: 2, name: "Dia Internacional da Mulher" },
        { day: 23, month: 2, name: "Dia da Libertação da África Austral" },
        { day: 4, month: 3, name: "Dia da Paz" },
        { day: 1, month: 4, name: "Dia do Trabalhador" },
        { day: 17, month: 8, name: "Dia do Herói Nacional" },
        { day: 2, month: 10, name: "Dia dos Finados" },
        { day: 11, month: 10, name: "Dia da Independência" },
        { day: 25, month: 11, name: "Natal" }
    ];

    const getHolidaysInMonth = (month) => {
        return holidays.filter(h => h.month === month);
    };

    const getEventsInMonth = (month, year) => {
        return allSchedulingEvents.filter(e => e.month === month && e.year === year);
    };

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const nextMonth = () => {
        setViewDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const prevMonth = () => {
        setViewDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const goToToday = () => {
        setViewDate(new Date());
    };

    const isHoliday = (day, month) => {
        return holidays.find(h => h.day === day && h.month === month);
    };

    const getDayEvent = (day, month, year) => {
        return allSchedulingEvents.find(e => e.day === day && e.month === month && e.year === year);
    };

    const renderDays = () => {
        const days = [];
        const emptyDays = firstDayOfMonth(currentMonth, currentYear);
        const totalDays = daysInMonth(currentMonth, currentYear);

        for (let i = 0; i < emptyDays; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let i = 1; i <= totalDays; i++) {
            const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const holiday = isHoliday(i, currentMonth);
            const academicEvent = getDayEvent(i, currentMonth, currentYear);
            
            days.push(
                <div 
                    key={i} 
                    className={`calendar-day ${isToday ? 'today' : ''} ${holiday ? 'holiday' : ''} ${academicEvent ? 'academic-event' : ''}`} 
                    title={holiday ? holiday.name : (academicEvent ? academicEvent.name : '')}
                >
                    <span>{i}</span>
                    {holiday && <div className="holiday-dot"></div>}
                    {academicEvent && <div className={`event-dot type-${academicEvent.type}`}></div>}
                </div>
            );
        }
        return days;
    };

    const currentMonthHolidays = getHolidaysInMonth(currentMonth);
    const currentMonthEvents = getEventsInMonth(currentMonth, currentYear);

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
                <div className="holiday-list">
                    <h4>Escalamento Académico</h4>
                    {currentMonthEvents.length > 0 ? (
                        <ul>
                            {currentMonthEvents.map((e, index) => (
                                <li key={index} className="event-item">
                                    <span className={`event-date type-${e.type}`}>{e.day}</span>
                                    <span className="event-name">{e.name}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-holidays">Sem eventos agendados.</p>
                    )}
                </div>

                <div className="holiday-list">
                    <h4>Feriados</h4>
                    {currentMonthHolidays.length > 0 ? (
                        <ul>
                            {currentMonthHolidays.map((h, index) => (
                                <li key={index}>
                                    <span className="holiday-date">{h.day}</span>
                                    <span className="holiday-name">{h.name}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-holidays">Sem feriados.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarWidget;
