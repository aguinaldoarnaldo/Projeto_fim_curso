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
        </div>
    );
};

export default FilterModal;
