import React, { useState, useRef, useEffect } from 'react';
import { Input, InputProps } from 'antd';

interface CompositionInputProps extends InputProps {
    onChange?: (e: any) => void;
    value?: string | number;
}

export const CompositionInput: React.FC<CompositionInputProps> = ({ value, onChange, ...props }) => {
    const [innerValue, setInnerValue] = useState(value);
    const isComposing = useRef(false);

    useEffect(() => {
        setInnerValue(value);
    }, [value]);

    const handleCompositionStart = (e: any) => {
        isComposing.current = true;
        props.onCompositionStart?.(e);
    };

    const handleCompositionEnd = (e: any) => {
        isComposing.current = false;
        props.onCompositionEnd?.(e);
        // Trigger change on composition end
        if (onChange) {
            onChange(e);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInnerValue(e.target.value);
        if (!isComposing.current && onChange) {
            onChange(e);
        }
    };

    return (
        <Input
            {...props}
            value={innerValue}
            onChange={handleChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
        />
    );
};

interface CompositionTextAreaProps extends React.ComponentProps<typeof Input.TextArea> {
    onChange?: (e: any) => void;
    value?: string;
}

export const CompositionTextArea: React.FC<CompositionTextAreaProps> = ({ value, onChange, ...props }) => {
    const [innerValue, setInnerValue] = useState(value);
    const isComposing = useRef(false);

    useEffect(() => {
        setInnerValue(value);
    }, [value]);

    const handleCompositionStart = (e: any) => {
        isComposing.current = true;
        props.onCompositionStart?.(e);
    };

    const handleCompositionEnd = (e: any) => {
        isComposing.current = false;
        props.onCompositionEnd?.(e);
        if (onChange) {
            onChange(e);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInnerValue(e.target.value);
        if (!isComposing.current && onChange) {
            onChange(e);
        }
    };

    return (
        <Input.TextArea
            {...props}
            value={innerValue}
            onChange={handleChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
        />
    );
};
