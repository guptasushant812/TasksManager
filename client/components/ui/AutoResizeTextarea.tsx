'use client';
import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  TextareaHTMLAttributes,
  ChangeEvent,
} from 'react';

export interface AutoResizeTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number | string;
  maxHeight?: number | string;
  allowManualResize?: boolean;
}

/**
 * AutoResizeTextarea - A high-performance responsive multi-line textbox.
 * - Auto-grows based on content on mount and whenever content changes (no click required).
 * - Restores visible, smooth vertical scrollbar when content exceeds maxHeight.
 * - Supports manual vertical resizing so users can grow it more.
 * - Adheres to MediaQueryPrompt.md fluid typography, touch ergonomics, and logical properties.
 */
export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  (
    {
      value,
      defaultValue,
      minHeight = 58,
      maxHeight = 300,
      allowManualResize = true,
      className = '',
      style,
      onChange,
      onInput,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => textareaRef.current!);

    // Flag to detect if user manually resized the element via the corner handle
    const userResizedRef = useRef(false);
    const lastHeightRef = useRef<number>(0);

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // If user has manually dragged/resized to a larger custom height, don't shrink back
      if (userResizedRef.current && textarea.offsetHeight > lastHeightRef.current) {
        lastHeightRef.current = textarea.offsetHeight;
        return;
      }

      // Temporarily set height to auto to get the exact scrollHeight of content
      textarea.style.height = 'auto';
      const scrollH = textarea.scrollHeight;

      const parsedMin =
        typeof minHeight === 'number'
          ? minHeight
          : parseInt(String(minHeight), 10) || 58;
      const parsedMax =
        typeof maxHeight === 'number'
          ? maxHeight
          : parseInt(String(maxHeight), 10) || 300;

      // Bound between minHeight and maxHeight
      const targetHeight = Math.min(Math.max(scrollH, parsedMin), parsedMax);
      textarea.style.height = `${targetHeight + 2}px`;
      lastHeightRef.current = targetHeight + 2;

      // Ensure scrollbar is enabled when content overflows maxHeight
      if (scrollH > parsedMax) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'auto';
      }
    };

    // Auto-grow immediately on initial mount and whenever value / defaultValue updates
    useEffect(() => {
      adjustHeight();
    }, [value, defaultValue]);

    // Track user manual resize action
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea || !allowManualResize) return;

      let initialHeight = textarea.offsetHeight;

      const handleMouseDown = () => {
        initialHeight = textarea.offsetHeight;
      };

      const handleMouseUp = () => {
        if (textarea.offsetHeight !== initialHeight) {
          userResizedRef.current = true;
          lastHeightRef.current = textarea.offsetHeight;
        }
      };

      textarea.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        textarea.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [allowManualResize]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      onChange?.(e);
    };

    return (
      <textarea
        ref={textareaRef}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        onInput={(e) => {
          adjustHeight();
          onInput?.(e);
        }}
        className={`input auto-grow-textarea ${className}`}
        style={{
          minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          resize: allowManualResize ? 'vertical' : 'none',
          overflowY: 'auto',
          lineHeight: 1.55,
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
export default AutoResizeTextarea;
