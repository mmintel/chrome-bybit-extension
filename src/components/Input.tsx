import clsx from "clsx";
import { InputHTMLAttributes, ReactNode } from "react";

export const Input: React.FC<
  {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    helptext?: string;
    prepend?: ReactNode;
    append?: ReactNode;
    showLabel?: boolean;
  } & InputHTMLAttributes<HTMLInputElement>
> = ({
  label,
  id,
  helptext,
  className,
  prepend,
  append,
  showLabel = false,
  ...props
}) => {
  return (
    <div className={clsx(className)}>
      <label htmlFor={id} className={clsx(!showLabel && "sr-only")}>
        {label}
      </label>
      <div className="relative mt-1 rounded-md shadow-sm">
        {prepend && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 select-none">
            <span className="text-gray-500 sm:text-sm">{prepend}</span>
          </div>
        )}
        <input
          name={id}
          id={id}
          className="block w-full pr-12 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-7 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
          {...props}
        />
        {append && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 select-none">
            <span className="text-gray-500 sm:text-sm" id="price-currency">
              {append}
            </span>
          </div>
        )}
      </div>
      {helptext && <p className="mt-2 text-sm text-gray-500">{helptext}</p>}
    </div>
  );
};
