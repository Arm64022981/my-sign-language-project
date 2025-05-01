// src/components/ui/input.tsx

import * as React from "react"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => {
    return (
      <input
        ref={ref}
        className="border border-gray-300 rounded-md p-2 w-full"
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
