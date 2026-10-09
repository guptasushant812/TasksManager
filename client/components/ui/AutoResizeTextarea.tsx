'use client';
import {
  useRef,
  useEffect,
  useCallback,
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
 * AutoResizeTextarea - Universal responsive multi-line textbox component
 * - Auto-grows by default based on content on initial render/mount and whenever content changes (no click required).
 * - Implements strict minHeight and maxHeight bounds to prevent popups/modals from becoming messy or unresponsive.
 * - Restores fluid horizontal (X-axis) scrollbar for wide text, tables, URLs, or non-breaking lines.
 * - Adheres to MediaQueryPrompt.md responsive breakpoints, touch ergonomics, and fluid layout scaling.
 */
export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  (
    {
      value,
      defaultValue,
      minHeight = 54,
      maxHeight = 260,
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

    // Flag to detect when user manually drags the resize corner handle
    const userResizedRef = useRef(false);
    const lastManualHeightRef = useRef<number>(0);

    const parsePx = (val: number | string | undefined, defaultVal: number): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? defaultVal : parsed;
      }
      return defaultVal;
    };

    const minPx = parsePx(minHeight, 54);
    const maxPx = parsePx(maxHeight, 260);

    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // If user has manually dragged/resized the textarea, respect their manual height choice
      if (userResizedRef.current && textarea.offsetHeight !== lastManualHeightRef.current) {
        lastManualHeightRef.current = textarea.offsetHeight;
        return;
      }

      // Temporarily set height to auto to compute exact scrollHeight
      textarea.style.height = 'auto';
      const scrollH = textarea.scrollHeight;

      // Calculate bounded target height
      const targetHeight = Math.min(Math.max(scrollH + 2, minPx), maxPx);
      textarea.style.height = `${targetHeight}px`;

      // Manage Y-axis scrollbar: only show vertical scrollbar when content strictly exceeds maxPx
      if (scrollH > maxPx) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }

      // Ensure X-axis scrollbar is always active for horizontal overflow
      textarea.style.overflowX = 'auto';
    }, [minPx, maxPx]);

    // Auto-grow immediately on mount, on value update, and across animated modal transitions
    useEffect(() => {
      adjustHeight();
      const raf = requestAnimationFrame(() => {
        adjustHeight();
      });
      return () => cancelAnimationFrame(raf);
    }, [value, defaultValue, adjustHeight]);

    // Track window resize (MediaQueryPrompt.md Sec. 8 & 9)
    useEffect(() => {
      const handleResize = () => {
        if (!userResizedRef.current) {
          adjustHeight();
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [adjustHeight]);

    // Track user manual drag resize
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea || !allowManualResize) return;

      let startH = textarea.offsetHeight;
      const onMouseDown = () => {
        startH = textarea.offsetHeight;
      };
      const onMouseUp = () => {
        if (textarea.offsetHeight !== startH) {
          userResizedRef.current = true;
          lastManualHeightRef.current = textarea.offsetHeight;
        }
      };

      textarea.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        textarea.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
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
          minHeight: `${minPx}px`,
          maxHeight: `${maxPx}px`,
          resize: allowManualResize ? 'vertical' : 'none',
          overflowX: 'auto',
          lineHeight: 1.5,
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
