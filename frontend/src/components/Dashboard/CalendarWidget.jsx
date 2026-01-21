import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import './CalendarWidget.css';

const CalendarWidget = () => {
    // Current viewed date (for navigation)
    const [viewDate, setViewDate] = useState(new Date());
    
    // Real today (for highlighting)
    const today = new Date();

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

    const getHolidaysInMonth = (month, year) => {
        return holidays.filter(h => h.month === month);
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

    const renderDays = () => {
        const days = [];
        const emptyDays = firstDayOfMonth(currentMonth, currentYear);
        const totalDays = daysInMonth(currentMonth, currentYear);

        for (let i = 0; i < emptyDays; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let i = 1; i <= totalDays; i++) {
            const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const holiday = isHoliday(i, currentMonth); // Simple check, ignores year for fixed holidays
            
            days.push(
                <div key={i} className={`calendar-day ${isToday ? 'today' : ''} ${holiday ? 'holiday' : ''}`} title={holiday ? holiday.name : ''}>
                    <span>{i}</span>
                    {holiday && <div className="holiday-dot"></div>}
                </div>
            );
        }
        return days;
    };

    const currentMonthHolidays = getHolidaysInMonth(currentMonth, currentYear);

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

            <div className="holiday-list">
                <h4>Feriados em {monthNames[currentMonth]}</h4>
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
                    <p className="no-holidays">Sem feriados este mês.</p>
                )}
            </div>
        </div>
    );
};

export default CalendarWidget;
