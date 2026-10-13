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

// Textarea that auto-sizes to its content within optional min and max bounds.
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

    // Track manual resizing by the user
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

      if (userResizedRef.current) {
        if (textarea.scrollHeight > textarea.clientHeight) {
          textarea.style.overflowY = 'auto';
        }
        return;
      }

      // Preserve scrollTop so typing at max height boundary does not jump to the top
      const prevScrollTop = textarea.scrollTop;
      textarea.style.height = 'auto';
      const scrollH = textarea.scrollHeight;

      const targetHeight = Math.min(Math.max(scrollH + 2, minPx), maxPx);
      textarea.style.height = `${targetHeight}px`;

      if (scrollH >= maxPx) {
        textarea.style.overflowY = 'auto';
        textarea.scrollTop = prevScrollTop;
      } else {
        textarea.style.overflowY = 'hidden';
      }

      textarea.style.overflowX = 'auto';
    }, [minPx, maxPx]);

    // Adjust height on mount and value changes
    useEffect(() => {
      adjustHeight();
      const raf = requestAnimationFrame(() => {
        adjustHeight();
      });
      return () => cancelAnimationFrame(raf);
    }, [value, defaultValue, adjustHeight]);

    // Recalculate on window resize unless manually sized
    useEffect(() => {
      const handleResize = () => {
        if (!userResizedRef.current) {
          adjustHeight();
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [adjustHeight]);

    // Detect manual resize drag
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
          if (textarea.scrollHeight > textarea.clientHeight) {
            textarea.style.overflowY = 'auto';
          }
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
