import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, Filter, Trash2, ChevronLeft, Check } from 'lucide-react';
import './FilterModal.css';

/**
 * FilterModal Component
 * A reusable, premium popover/modal for filters.
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Function to close the modal
 * @param {function} onClearFilters - Function to clear filters
 * @param {object} filterConfigs - configuration for filters
 * @param {object} activeFilters - active filters
 * @param {function} onFilterChange - function to handle filter change
 * @param {React.RefObject} triggerRef - ref to the button that triggered the modal
 */
const FilterModal = ({ 
    isOpen, 
    onClose, 
    filterConfigs = [], 
    activeFilters = {}, 
    onFilterChange, 
    onClearFilters,
    triggerRef 
}) => {
    const modalRef = useRef(null);
    const [step, setStep] = useState('type'); // 'type' or 'options'
    const [selectedType, setSelectedType] = useState(null);
    const [animateClass, setAnimateClass] = useState('slide-in');
    const [coords, setCoords] = useState({ top: 0, right: 0 });

    // Defensive variables to prevent crashes
    const safeConfigs = Array.isArray(filterConfigs) ? filterConfigs : [];
    const safeActiveFilters = activeFilters || {};

    // Calculate position relative to trigger
    useEffect(() => {
        if (isOpen && triggerRef?.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right
            });
            // Reset to first step when opening
            setStep('type');
            setSelectedType(null);
            setAnimateClass('slide-in');
        }
    }, [isOpen, triggerRef]);

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
        const key = selectedType?.key;
        if (!key) return;
        
        const currentVal = safeActiveFilters[key];
        const newValue = currentVal === value ? '' : value;
        
        if (onFilterChange) onFilterChange(key, newValue);
    };

    const getActiveCount = () => {
        return Object.values(safeActiveFilters).filter(v => v !== '' && v !== null && v !== undefined).length;
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
                } : {}}
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
                            {safeConfigs.map((config) => {
                                const isActive = safeActiveFilters[config.key] !== '' && safeActiveFilters[config.key] !== undefined;
                                const activeValueLabel = isActive 
                                    ? config.options?.find(o => o.value === safeActiveFilters[config.key])?.label || safeActiveFilters[config.key]
                                    : null;
                                
                                const Icon = config.icon || null;

                                return (
                                    <button 
                                        key={config.key} 
                                        className={`filter-item-row ${isActive ? 'active' : ''}`}
                                        onClick={() => handleTypeSelect(config)}
                                    >
                                        <div style={{display:'flex', alignItems:'center', gap:'10px', flex:1}}>
                                            {Icon && <Icon size={16} style={{ color: isActive ? 'var(--primary-color)' : '#64748b' }} />}
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
                                    className={`option-row ${!safeActiveFilters[selectedType.key] ? 'selected' : ''}`}
                                    onClick={() => handleOptionSelect('')}
                                >
                                    <span>Todas / Limpar</span>
                                    {!safeActiveFilters[selectedType.key] && <Check size={14} className="check-mini" />}
                                </button>

                                {(selectedType.options || []).map((opt) => (
                                    <button
                                        key={opt.value}
                                        className={`option-row ${safeActiveFilters[selectedType.key] === opt.value ? 'selected' : ''}`}
                                        onClick={() => handleOptionSelect(opt.value)}
                                    >
                                        <span>{opt.label}</span>
                                        {safeActiveFilters[selectedType.key] === opt.value && <Check size={14} className="check-mini" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterModal;
