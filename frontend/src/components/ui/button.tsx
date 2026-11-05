import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/utils/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-bold transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-pa-inkblue/50",
  {
    variants: {
      variant: {
        default:
          "bg-pa-inkblue text-pa-page shadow-[var(--pa-shadow-paper)] hover:bg-[#26496f]",
        secondary:
          "border-2 border-pa-ink bg-transparent text-pa-ink hover:bg-pa-sticky",
        destructive:
          "bg-pa-clay text-pa-page hover:bg-[#93361f]",
        outline:
          "border border-pa-rule bg-pa-page text-pa-ink hover:bg-pa-highlighter",
        ghost:
          "text-pa-inkblue underline-offset-4 hover:underline",
        link: "text-pa-inkblue underline underline-offset-4",
      },
      size: {
        default: "h-11 px-6 text-sm has-[>svg]:px-4",
        xs: "h-8 gap-1 px-3 text-xs has-[>svg]:px-2",
        sm: "h-9 gap-1.5 px-4 text-xs has-[>svg]:px-3",
        lg: "h-13 px-8 text-base has-[>svg]:px-6",
        icon: "size-11",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-13",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
