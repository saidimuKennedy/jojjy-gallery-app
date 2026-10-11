import React, { useEffect, useId, useRef, useState } from "react";

/**
 * Canonical themed dropdown (custom listbox).
 *
 * A native <select>'s OPEN option list is painted by the OS/browser and
 * cannot be styled — it breaks the gallery theme (blue highlights, system
 * fonts). This replacement renders the list in-theme: square corners, thin
 * neutral border, restrained hover/selected states, full keyboard support.
 *
 * Semantics: button (aria-haspopup=listbox) + listbox/option roles with
 * aria-activedescendant. Arrow keys move, Enter selects, Escape closes,
 * printable characters type-ahead. Mutable only through `onChange`.
 */
export interface SelectOption {
  value: string;
  label: string;
}

export default function Select({
  id,
  label,
  options,
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  /** Stable id referenced by the external <label htmlFor>. */
  id?: string;
  /** Accessible name for the control. */
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const fallbackId = useId();
  const buttonId = id ?? fallbackId;
  const listId = `${buttonId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value)
    )
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open ]);

  useEffect(() => {
    setActiveIndex(
      Math.max(
        0,
        options.findIndex((o) => o.value === value)
      )
    );
  }, [value, options]);

  const choose = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
  };

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else if (e.key === "Enter" || e.key === " ") {
        choose(activeIndex);
      } else {
        setActiveIndex((i) =>
          e.key === "ArrowDown"
            ? Math.min(options.length - 1, i + 1)
            : Math.max(0, i - 1)
        );
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key.length === 1) {
      const hit = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(e.key.toLowerCase())
      );
      if (hit >= 0) {
        if (!open) setOpen(true);
        setActiveIndex(hit);
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const onOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(index);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next =
        e.key === "ArrowDown"
          ? Math.min(options.length - 1, index + 1)
          : Math.max(0, index - 1);
      setActiveIndex(next);
      document.getElementById(`${listId}-opt-${next}`)?.focus();
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={buttonId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onButtonKeyDown}
        className="flex w-full items-center justify-between gap-3 border border-neutral-300 bg-white px-3 py-2 text-left text-sm text-neutral-800 transition-colors hover:border-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selected?.label ?? label}</span>
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`shrink-0 text-neutral-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      </button>

      {open && !disabled && (
        <ul
          role="listbox"
          id={listId}
          aria-label={label}
          aria-activedescendant={`${listId}-opt-${activeIndex}`}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-auto border border-neutral-300 bg-white py-1 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={opt.value}
                id={`${listId}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onClick={() => choose(index)}
                onMouseEnter={() => setActiveIndex(index)}
                onKeyDown={(e) => onOptionKeyDown(e, index)}
                className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "bg-neutral-900 font-medium text-white"
                    : isActive
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-700"
                }`}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
