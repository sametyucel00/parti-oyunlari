import React from 'react';
import { useAppContext } from '../context/AppContext';

export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
    const { playClick } = useAppContext();
    const safeVariant = ['primary', 'danger', 'outline'].includes(variant) ? variant : 'primary';

    const handleClick = (e) => {
        try {
            playClick?.();
        } catch (error) {
            console.error('Button click sound failed:', error);
        }

        if (onClick) onClick(e);
    };

    return (
        <button
            className={`btn btn-${safeVariant} ${className}`}
            type={props.type || 'button'}
            onClick={handleClick}
            {...props}
        >
            {children}
        </button>
    );
};
