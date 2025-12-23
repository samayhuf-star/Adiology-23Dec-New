import React from 'react';
import { Button } from '../../../components/ui/button';
import { X } from 'lucide-react';

interface TemplatePreviewProps {
  template: {
    id: string;
    name: string;
    description?: string;
    category: string;
    fields: any[];
    use_count?: number;
    rating?: number;
  };
  onClose: () => void;
  onUse: () => void;
}

export function TemplatePreview({ template, onClose, onUse }: TemplatePreviewProps) {
  const renderFieldPreview = (field: any, index: number) => {
    const fieldId = `preview-field-${index}`;
    
    return (
      <div key={index} className="mb-4">
        <label className="block text-sm font-medium mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="field-input">
          {field.type === 'text' && (
            <input
              type="text"
              placeholder={field.placeholder || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          )}
          {field.type === 'email' && (
            <input
              type="email"
              placeholder={field.placeholder || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          )}
          {field.type === 'phone' && (
            <input
              type="tel"
              placeholder={field.placeholder || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          )}
          {field.type === 'textarea' && (
            <textarea
              placeholder={field.placeholder || ''}
              disabled
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          )}
          {field.type === 'select' && (
            <select
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            >
              <option>{field.placeholder || 'Select an option'}</option>
              {field.options && field.options.map((opt: string, i: number) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {field.type === 'radio' && (
            <div className="space-y-2">
              {field.options && field.options.map((opt: string, i: number) => (
                <label key={i} className="flex items-center gap-2 text-gray-500">
                  <input type="radio" disabled className="cursor-not-allowed" />
                  {opt}
                </label>
              ))}
            </div>
          )}
          {field.type === 'checkbox' && (
            <label className="flex items-center gap-2 text-gray-500">
              <input type="checkbox" disabled className="cursor-not-allowed" />
              {field.label}
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{template.name}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Preview */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Form Preview</h3>
            <div className="bg-gray-50 p-6 rounded-lg border">
              {template.fields && template.fields.length > 0 ? (
                template.fields.map((field, index) => renderFieldPreview(field, index))
              ) : (
                <p className="text-gray-500">No fields defined</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 block mb-1">Category</span>
                <strong className="text-gray-900">{template.category}</strong>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Fields</span>
                <strong className="text-gray-900">{template.fields?.length || 0}</strong>
              </div>
              {template.use_count !== undefined && (
                <div>
                  <span className="text-sm text-gray-500 block mb-1">Used By</span>
                  <strong className="text-gray-900">{template.use_count} users</strong>
                </div>
              )}
              {template.description && (
                <div>
                  <span className="text-sm text-gray-500 block mb-1">Description</span>
                  <p className="text-gray-900 text-sm">{template.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onUse} className="bg-purple-600 hover:bg-purple-700">
            ✨ Use This Template
          </Button>
        </div>
      </div>
    </div>
  );
}

