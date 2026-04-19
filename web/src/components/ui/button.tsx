import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500 active:scale-95",
        outline:
          "border border-[#1E1E2E] bg-transparent text-gray-300 hover:bg-[#1E1E2E] hover:text-white",
        ghost: "text-gray-400 hover:bg-[#1E1E2E] hover:text-white",
        destructive:
          "bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30",
        secondary:
          "bg-[#1E1E2E] text-gray-300 hover:bg-[#2a2a3e] hover:text-white",
        link: "text-violet-400 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
