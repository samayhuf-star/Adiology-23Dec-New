import React from 'react';
import { FormsListPage } from '../pages/FormsListPage';
import { FormBuilderPage } from '../pages/FormBuilderPage';
import { FormSubmissionsPage } from '../pages/FormSubmissionsPage';

export function Forms() {
  // Get current route from hash
  const hash = window.location.hash;
  
  if (hash.includes('/submissions')) {
    return <FormSubmissionsPage />;
  }
  
  if (hash.match(/forms\/[^\/]+$/)) {
    return <FormBuilderPage />;
  }
  
  return <FormsListPage />;
}

