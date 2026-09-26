import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
