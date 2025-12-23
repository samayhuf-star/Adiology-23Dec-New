import React from 'react';
import { SubmissionsTable } from '../components/SubmissionsTable';

export function FormSubmissionsPage() {
  // Get formId from URL hash
  const hash = window.location.hash;
  const formIdMatch = hash.match(/forms\/([^\/]+)\/submissions/);
  const formId = formIdMatch ? formIdMatch[1] : null;

  if (!formId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Form ID not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Form Submissions</h1>
      <SubmissionsTable formId={formId} />
    </div>
  );
}

