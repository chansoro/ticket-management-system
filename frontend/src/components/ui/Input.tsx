import React, { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-500/15 disabled:bg-slate-100 ${ error ? 'border-rose-500' : '' } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export function SearchInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative flex items-center \${className}`}>
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z" />
      </svg>
      <input
        type="search"
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-500/15"
        {...props}
      />
    </div>
  )
}

export function Label({ className = '', children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block text-xs font-semibold uppercase tracking-wider text-slate-600 \${className}`} {...props}>
      {children}
    </label>
  )
}

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs transition focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-500/15 disabled:bg-slate-100 \${className}`}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-500/15 disabled:bg-slate-100 \${className}`}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export function FormField({ label, error, children, className = '' }: { label?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 \${className}`}>
      {label && <Label>{label}</Label>}
      {children}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}
