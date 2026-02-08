<<<<<<< HEAD
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
=======
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, Filter, Check, Trash2 } from 'lucide-react';
import './FilterModal.css';

const FilterModal = ({ 
    isOpen, 
    onClose, 
    filterConfigs, 
    activeFilters, 
    onFilterChange, 
    onClearFilters,
    triggerRef 
}) => {
    const [step, setStep] = useState('type'); // 'type' | 'options'
    const [selectedType, setSelectedType] = useState(null);
    const [animateClass, setAnimateClass] = useState('slide-in');
    const modalRef = useRef(null);
    const [coords, setCoords] = useState({});

    // Position logic
    useEffect(() => {
        if (isOpen && triggerRef?.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            
            // Calculate position: Aligned to the right of the trigger button, strictly below it
            // We use fixed positioning relative to viewport usually for modals, but standard popovers follow scroll? 
            // Let's use fixed to avoid scroll parent issues.
            
            const rightSpace = window.innerWidth - rect.right;
            
            setCoords({
                top: rect.bottom + 8,
                right: rightSpace,
                // left: 'auto' implied
            });
        }
    }, [isOpen, triggerRef]);

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('type');
            setSelectedType(null);
            setAnimateClass('slide-in');
        }
    }, [isOpen]);

    // Click outside handler logic is now on the overlay div
    
    if (!isOpen) return null;

    const handleTypeSelect = (config) => {
        setAnimateClass('slide-out-left');
        setTimeout(() => {
            setSelectedType(config);
            setStep('options');
            setAnimateClass('slide-in-right');
        }, 200);
    };

    const handleBack = () => {
        setAnimateClass('slide-out-right');
        setTimeout(() => {
            setStep('type');
            setSelectedType(null);
            setAnimateClass('slide-in-left');
        }, 200);
    };

    const handleOptionSelect = (value) => {
        const newValue = activeFilters[selectedType.key] === value ? '' : value;
        onFilterChange(selectedType.key, newValue);
    };

    const getActiveCount = () => {
        return Object.values(activeFilters).filter(v => v !== '' && v !== null && v !== undefined).length;
    };

    return (
        <div className="filter-popover-overlay" onClick={onClose}>
            <div 
                ref={modalRef}
                className="filter-popover-container" 
                onClick={e => e.stopPropagation()}
                style={triggerRef ? { 
                    position: 'fixed', 
                    top: coords.top, 
                    right: coords.right,
                    margin: 0
                } : {}} /* Fallback if no ref, CSS centering handles it or we add fallback */
            >
                <div className="filter-popover-header">
                    <div className="filter-popover-title">
                        <Filter size={16} className="filter-icon-small" />
                        <span style={{fontWeight: 600}}>Filtros ({getActiveCount()})</span>
                    </div>
                   <div style={{display:'flex', gap:'8px'}}>
                        <button 
                            className="btn-clear-mini" 
                            onClick={onClearFilters}
                            disabled={getActiveCount() === 0}
                            title="Limpar todos"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button className="btn-close-mini" onClick={onClose}>
                            <X size={16} />
                        </button>
                   </div>
                </div>

                <div className="filter-popover-body">
                    {step === 'type' && (
                        <div className={`filter-list ${animateClass}`}>
                            {filterConfigs.map((config) => {
                                const isActive = activeFilters[config.key] !== '' && activeFilters[config.key] !== undefined;
                                const activeValueLabel = isActive 
                                    ? config.options.find(o => o.value === activeFilters[config.key])?.label || activeFilters[config.key]
                                    : null;

                                return (
                                    <button 
                                        key={config.key} 
                                        className={`filter-item-row ${isActive ? 'active' : ''}`}
                                        onClick={() => handleTypeSelect(config)}
                                    >
                                        <div style={{display:'flex', alignItems:'center', gap:'10px', flex:1}}>
                                            {/* Optional: Small Icon */}
                                            {/* <div className="mini-icon">{React.createElement(config.icon || Filter, { size: 14 })}</div> */}
                                            <span className="filter-label-text">{config.label}</span>
                                        </div>
                                        
                                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                            {isActive && <span className="filter-value-pill">{activeValueLabel}</span>}
                                            <ChevronLeft size={14} style={{transform: 'rotate(180deg)', color: '#94a3b8'}} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {step === 'options' && selectedType && (
                        <div className={`filter-options-view ${animateClass}`}>
                            <div className="filter-options-sub-header">
                                <button className="btn-back-mini" onClick={handleBack}>
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="sub-header-title">{selectedType.label}</span>
                            </div>
                            
                            <div className="options-scroll-list">
                                <button 
                                    className={`option-row ${!activeFilters[selectedType.key] ? 'selected' : ''}`}
                                    onClick={() => handleOptionSelect('')}
                                >
                                    <span>Todos</span>
                                    {!activeFilters[selectedType.key] && <Check size={14} className="check-mini" />}
                                </button>

                                {selectedType.options.map((option) => (
                                    <button 
                                        key={option.value}
                                        className={`option-row ${activeFilters[selectedType.key] === option.value ? 'selected' : ''}`}
                                        onClick={() => handleOptionSelect(option.value)}
                                    >
                                        <span>{option.label}</span>
                                        {activeFilters[selectedType.key] === option.value && <Check size={14} className="check-mini" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer is typically not needed for a small popover "instant apply", but we can keep it if needed. 
                    User asked for "options style", usually instant. 
                    But let's remove footer to be compact, since we apply on click. 
                */}
            </div>
>>>>>>> 123fe2aecb09a364b1eca2121c6dd2aad89f0d10
        </div>
    );
};

<<<<<<< HEAD
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

=======
>>>>>>> 123fe2aecb09a364b1eca2121c6dd2aad89f0d10
export default FilterModal;
