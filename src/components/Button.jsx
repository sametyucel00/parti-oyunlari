import React from 'react';
import { useAppContext } from '../context/AppContext';

export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
    const { playClick } = useAppContext();
    const safeVariant = ['primary', 'danger', 'outline'].includes(variant) ? variant : 'primary';

    const handleClick = (e) => {
        playClick();
        if (onClick) onClick(e);
    };

    return (
        <button
            className={`btn btn-${safeVariant} ${className}`}
            onClick={handleClick}
            {...props}
        >
            {children}
        </button>
    );
};
