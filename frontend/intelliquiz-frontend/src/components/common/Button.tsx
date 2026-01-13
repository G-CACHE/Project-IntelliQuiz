import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClass = 'font-bold rounded-lg transition duration-300';
  const variants = {
    primary: 'bg-[#f8c107] text-black hover:bg-[#e0ad06]',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-[#880015] text-white hover:bg-[#6b000f]',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
};
