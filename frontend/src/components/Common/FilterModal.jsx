import React, { useEffect, useRef, useState } from 'react';
import { X, Filter, Trash2, ChevronDown, Check } from 'lucide-react';
import './FilterModal.css';

/**
 * FilterSection Component
 * A collapsible section for list-based filters.
 */
export const FilterSection = ({ label, value, options, onChange, placeholder = "Todos" }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Find display name for current value
    const selectedOption = options.find(opt => opt.value === value || opt.label === value);
    const displayValue = selectedOption ? (selectedOption.label || selectedOption.value) : placeholder;
    const hasValue = value && value !== '';

    return (
        <div className={`filter-menu-item ${isExpanded ? 'active' : ''}`}>
            <div className="filter-menu-row" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="filter-menu-info">
                    <span className="filter-menu-label">{label}</span>
                    <span className={`filter-menu-value ${hasValue ? 'has-value' : ''}`}>{displayValue}</span>
                </div>
                <div className="filter-menu-action">
                    <ChevronDown size={14} className="chevron" />
                </div>
            </div>

            {isExpanded && (
                <div className="filter-options-list animate-pop-in">
                    {options.map((opt, index) => {
                        const optValue = opt.value !== undefined ? opt.value : opt.label;
                        const isSelected = value === optValue;

                        return (
                            <div 
                                key={index} 
                                className={`filter-option-row ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange(optValue);
                                    setIsExpanded(false);
                                }}
                            >
                                <span>{opt.label || opt.value}</span>
                                {isSelected && <Check size={14} className="check-icon" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/**
 * FilterModal Component
 * A reusable, premium popover/modal for filters.
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Function to close the modal
 * @param {function} onClear - Function to clear filters
 * @param {string} title - Custom title for the modal
 * @param {React.ReactNode} children - Filter inputs/selects
 * @param {number} activeFiltersCount - Number of active filters to show in badge
 */
export const FilterModal = ({ isOpen, onClose, children, title = "Filtros", onClear, activeFiltersCount = 0 }) => {
    const modalRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div className="filter-modal-overlay" />
            <div className="filter-modal-container" ref={modalRef}>
                <div className="filter-modal-header">
                    <div className="filter-modal-title">
                        <Filter size={18} />
                        <span>{title}</span>
                    </div>
                    
                    <div className="filter-header-actions">
                        {activeFiltersCount > 0 && (
                            <button 
                                className="filter-modal-clear-icon" 
                                onClick={onClear} 
                                title="Limpar filtros"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button className="filter-modal-close" onClick={onClose} title="Fechar">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                
                <div className="filter-modal-body">
                    {children}
                </div>
            </div>
        </>
    );
};

export default FilterModal;
