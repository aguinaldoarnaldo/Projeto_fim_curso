import React from 'react';
import './Pagination.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
    totalItems, 
    itemsPerPage, 
    currentPage, 
    onPageChange,
    showingText = "Mostrando"
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // if (totalPages <= 1) return null;

    const indexOfFirstItem = (currentPage - 1) * itemsPerPage + 1;
    const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        
        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            // Always show first, last, and pages around current
            let startPage = Math.max(1, currentPage - 1);
            let endPage = Math.min(totalPages, currentPage + 1);

            if (currentPage <= 2) {
                endPage = Math.min(totalPages, maxPagesToShow - 1); // e.g. 1 2 3 4 ... 10
            }
            
            if (currentPage >= totalPages - 1) {
                startPage = Math.max(1, totalPages - (maxPagesToShow - 2)); // e.g. 1 ... 7 8 9 10
            }

            if (startPage > 1) {
                pageNumbers.push(1);
                if (startPage > 2) pageNumbers.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }
        return pageNumbers;
    };

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                {showingText} <span className="font-semibold">{indexOfFirstItem}</span> - <span className="font-semibold">{indexOfLastItem}</span> de <span className="font-semibold">{totalItems}</span>

            </div>
            
            <div className="pagination-controls">
                <button 
                    className="pagination-btn" 
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                >
                    <ChevronLeft size={18} />
                </button>
                
                {getPageNumbers().map((number, index) => (
                    <button
                        key={index}
                        className={`pagination-number ${currentPage === number ? 'active' : ''} ${number === '...' ? 'dots' : ''}`}
                        onClick={() => typeof number === 'number' ? onPageChange(number) : null}
                        disabled={number === '...'}
                    >
                        {number}
                    </button>
                ))}

                <button 
                    className="pagination-btn" 
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Próxima página"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
