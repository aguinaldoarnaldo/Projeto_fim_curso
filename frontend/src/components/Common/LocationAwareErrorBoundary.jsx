import React from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

/*
  Wrapper que força o ErrorBoundary a resetar quando a rota muda.
  Isso é feito mudando a 'key' do componente ErrorBoundary.
  Quando a key muda, o React desmonta o componente antigo (com estado de erro) e monta um novo.
*/
const LocationAwareErrorBoundary = ({ children }) => {
    const location = useLocation();
    
    return (
        <ErrorBoundary key={location.pathname + location.search}>
            {children}
        </ErrorBoundary>
    );
};

export default LocationAwareErrorBoundary;
