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
          "inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-coral-500 hover:bg-coral-600 text-white": variant === "primary",
            "bg-forest-500 hover:bg-forest-600 text-white": variant === "secondary",
            "border-2 border-coral-500 text-coral-500 hover:bg-coral-50": variant === "outline",
            "text-gray-600 hover:text-gray-900 hover:bg-gray-100": variant === "ghost",
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
