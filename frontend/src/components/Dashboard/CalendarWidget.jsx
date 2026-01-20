import React, { useState } from 'react';
import './CalendarWidget.css'; // You might need to create this css or just style inline/standard css

const CalendarWidget = () => {
    const [date, setDate] = useState(new Date());

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

    const currentDay = date.getDate();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();

    const days = [];
    const emptyDays = firstDayOfMonth(currentMonth, currentYear);
    const totalDays = daysInMonth(currentMonth, currentYear);

    for (let i = 0; i < emptyDays; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let i = 1; i <= totalDays; i++) {
        const isToday = i === currentDay;
        days.push(
            <div key={i} className={`calendar-day ${isToday ? 'today' : ''}`}>
                {i}
            </div>
        );
    }

    return (
        <div className="calendar-widget">
            <div className="calendar-header">
                <h3>{monthNames[currentMonth]} {currentYear}</h3>
            </div>
            <div className="calendar-grid">
                {weekDays.map(day => (
                    <div key={day} className="calendar-weekday">{day}</div>
                ))}
                {days}
            </div>
        </div>
    );
};

export default CalendarWidget;
