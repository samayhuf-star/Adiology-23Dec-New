import React from 'react';
import { FormsListPage } from '../pages/FormsListPage';
import { FormBuilderPage } from '../pages/FormBuilderPage';
import { FormSubmissionsPage } from '../pages/FormSubmissionsPage';
import { EnhancedTemplateGallery } from './EnhancedTemplateGallery';

export function Forms() {
  // Get current route from hash
  const hash = window.location.hash;
  
  if (hash.includes('/submissions')) {
    return <FormSubmissionsPage />;
  }
  
  if (hash.includes('/my-forms')) {
    return <FormsListPage />;
  }
  
  if (hash.match(/forms\/[^\/]+$/)) {
    return <FormBuilderPage />;
  }
  
  // Default to Enhanced Template Gallery
  return (
    <EnhancedTemplateGallery
      onFormCreated={(form) => {
        // Navigate to form builder after creating from template
        window.location.href = `#forms/${form.id}`;
      }}
      onBack={() => {
        // Navigate to my forms list
        window.location.href = '#forms/my-forms';
      }}
    />
  );
}

