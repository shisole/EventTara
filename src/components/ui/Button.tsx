import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-lime-500 hover:bg-lime-400 text-gray-900": variant === "primary",
            "bg-forest-500 hover:bg-forest-600 text-white": variant === "secondary",
            "border-2 border-lime-500 text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-950": variant === "outline",
            "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800": variant === "ghost",
          },
          {
            "text-sm py-2 px-4": size === "sm",
            "py-3 px-6": size === "md",
            "text-lg py-4 px-8": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
