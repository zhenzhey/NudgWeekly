import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-violet-600/20 text-violet-300 border border-violet-600/30",
        plan: "bg-blue-600/20 text-blue-300 border border-blue-600/30",
        build: "bg-amber-600/20 text-amber-300 border border-amber-600/30",
        ship: "bg-emerald-600/20 text-emerald-300 border border-emerald-600/30",
        scale: "bg-purple-600/20 text-purple-300 border border-purple-600/30",
        outline: "border border-[#1E1E2E] text-gray-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
