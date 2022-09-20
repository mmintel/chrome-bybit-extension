import clsx from "clsx"
import { InputHTMLAttributes } from "react"

export const Input: React.FC<{ id: string, label: string, type?: string, placeholder?: string, helptext?: string } & InputHTMLAttributes<HTMLInputElement>> = ({ label, id, helptext, className, ...props }) => {
    return (
      <div className={clsx(className)}>
        <label htmlFor={id}>
          {label}
        </label>
        <input
          name={id}
          id={id}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          {...props}
        />
        { helptext && (
          <p className="mt-2 text-sm text-gray-500">
            {helptext}
          </p>
        )}
      </div>
    )
  }