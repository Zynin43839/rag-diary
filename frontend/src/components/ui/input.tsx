import * as React from "react"

import { cn } from "@/utils/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "pa-field",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-b-2 aria-invalid:border-pa-clay",
        className
      )}
      {...props}
    />
  )
}

export { Input }
