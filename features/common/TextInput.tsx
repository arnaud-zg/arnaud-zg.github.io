import classNames from 'classnames';
import React, { FC, InputHTMLAttributes } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const TextInput: FC<TextInputProps> = ({ label, name, ...props }) => {
  return (
    <label className={classNames('flex')} htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        className={classNames(
          'bg-gray-100',
          'rounded',
          'border',
          'border-gray-400',
          'focus:outline-none',
          'focus:border-gray-400',
          'px-2',
          'py-1',
          'mb-2',
          'ml-1'
        )}
        type="text"
        {...props}
      />
    </label>
  );
};
