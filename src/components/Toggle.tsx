/* This example requires Tailwind CSS v2.0+ */
import { HTMLAttributes, ReactNode } from "react";
import { Switch } from "@headlessui/react";
import clsx from "clsx";

export const Toggle: React.FC<
  {
    label?: ReactNode;
    enabled?: boolean;
    onChange?(val: boolean): void;
  } & HTMLAttributes<HTMLDivElement>
> = ({ className, enabled = false, label, onChange = () => {} }) => {
  return (
    <Switch.Group as="div" className={clsx("flex items-center", className)}>
      <Switch
        checked={enabled}
        onChange={onChange}
        className={clsx(
          enabled ? "bg-green-500" : "bg-red-500",
          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
        )}
      >
        <span
          aria-hidden="true"
          className={clsx(
            enabled ? "translate-x-5" : "translate-x-0",
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          )}
        />
      </Switch>
      {label && (
        <Switch.Label as="span" className="ml-3 select-none">
          {label}
        </Switch.Label>
      )}
    </Switch.Group>
  );
};
