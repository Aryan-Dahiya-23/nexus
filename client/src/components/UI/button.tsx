import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow transition-all",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-all",
        outline:
          "border border-border bg-card/60 backdrop-blur-sm text-foreground shadow-sm hover:bg-muted/80 hover:border-primary/40 hover:text-foreground transition-all",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/70 transition-all",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-md hover:opacity-95 hover:shadow-lg hover:shadow-cyan-500/20 active:opacity-90 transition-all",
        glass:
          "bg-card/40 backdrop-blur-md border border-border text-foreground hover:bg-muted/80 shadow-sm transition-all",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

/* eslint-disable react-refresh/only-export-components */
export { Button, buttonVariants };

