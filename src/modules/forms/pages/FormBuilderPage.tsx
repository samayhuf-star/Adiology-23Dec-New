import React from 'react';
import { FormBuilder } from '../components/FormBuilder';

export function FormBuilderPage() {
  // Get formId from URL hash or params
  const hash = window.location.hash;
  const formIdMatch = hash.match(/forms\/([^\/]+)/);
  const formId = formIdMatch ? formIdMatch[1] : null;

  if (!formId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Form ID not found</p>
      </div>
    );
  }

  return <FormBuilder formId={formId} />;
}

