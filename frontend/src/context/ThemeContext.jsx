import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [themeColor, setThemeColor] = useState(localStorage.getItem('themeColor') || 'blue');

    const changeColor = (color) => {
        setThemeColor(color);
        localStorage.setItem('themeColor', color);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-color', themeColor);
    }, [themeColor]);

    return (
        <ThemeContext.Provider value={{ themeColor, changeColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
