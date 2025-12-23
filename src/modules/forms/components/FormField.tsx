import React from 'react';

interface FormFieldProps {
  field: {
    id: string;
    field_type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  };
}

export function FormField({ field }: FormFieldProps) {
  const { field_type, label, placeholder, required, options } = field;
  const requiredLabel = required ? <span className="text-red-500">*</span> : null;

  const renderPreview = () => {
    switch (field_type) {
      case 'text':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {label} {requiredLabel}
            </label>
            <input
              type="text"
              placeholder={placeholder}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        );
      case 'email':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {label} {requiredLabel}
            </label>
            <input
              type="email"
              placeholder={placeholder}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        );
      case 'phone':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {label} {requiredLabel}
            </label>
            <input
              type="tel"
              placeholder={placeholder}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        );
      case 'number':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {label} {requiredLabel}
            </label>
            <input
              type="number"
              placeholder={placeholder}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {label} {requiredLabel}
            </label>
            <textarea
              placeholder={placeholder}
              disabled
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        );
      case 'select':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {label} {requiredLabel}
            </label>
            <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>Select...</option>
              {options?.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {label} {requiredLabel}
            </label>
            <div className="space-y-2">
              {options?.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" id={`radio-${i}`} disabled />
                  <label htmlFor={`radio-${i}`} className="text-sm">
                    {opt}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {label} {requiredLabel}
            </label>
            <div className="space-y-2">
              {options?.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="checkbox" id={`check-${i}`} disabled />
                  <label htmlFor={`check-${i}`} className="text-sm">
                    {opt}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">{renderPreview()}</div>;
}

