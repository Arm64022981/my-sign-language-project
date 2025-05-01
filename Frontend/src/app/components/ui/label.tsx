// src/components/ui/label.tsx

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, ...props }) => {
    return (
      <label className="block text-sm font-medium text-gray-700" {...props}>
        {children}
      </label>
    )
  }
  