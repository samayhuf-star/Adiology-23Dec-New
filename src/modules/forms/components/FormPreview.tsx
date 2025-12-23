import React from 'react';
import { FormField } from './FormField';

interface FormPreviewProps {
  form: {
    name: string;
    description?: string;
  } | null;
  fields: any[];
}

export function FormPreview({ form, fields }: FormPreviewProps) {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2">{form?.name || 'Untitled Form'}</h2>
      {form?.description && (
        <p className="text-gray-600 mb-6">{form.description}</p>
      )}
      
      <div className="space-y-4">
        {fields.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No fields added yet</p>
        ) : (
          fields.map((field) => (
            <FormField key={field.id} field={field} />
          ))
        )}
      </div>
      
      <div className="mt-6">
        <button
          type="button"
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

