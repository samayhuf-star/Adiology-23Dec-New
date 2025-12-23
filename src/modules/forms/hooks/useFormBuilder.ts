import { useState, useEffect } from 'react';
import { formApi } from '../services/formApi';

export function useFormBuilder(formId: string | null) {
  const [form, setForm] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (formId) {
      loadForm();
    } else {
      setLoading(false);
    }
  }, [formId]);

  const loadForm = async () => {
    if (!formId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await formApi.getForm(formId);
      
      if (response.success) {
        setForm(response.data);
        setFields(response.data.fields || []);
      } else {
        setError(response.error || 'Failed to load form');
      }
    } catch (err: any) {
      console.error('Error loading form:', err);
      setError(err.message || 'Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const addField = async (fieldData: {
    field_type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  }) => {
    if (!formId) return;
    
    try {
      const response = await formApi.addField(formId, fieldData);
      if (response.success) {
        setFields([...fields, response.data]);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to add field');
      }
    } catch (err: any) {
      console.error('Error adding field:', err);
      throw err;
    }
  };

  const updateField = async (fieldId: string, updates: {
    label?: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    position?: number;
  }) => {
    if (!formId) return;
    
    try {
      const response = await formApi.updateField(formId, fieldId, updates);
      if (response.success) {
        setFields(fields.map(f => f.id === fieldId ? response.data : f));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update field');
      }
    } catch (err: any) {
      console.error('Error updating field:', err);
      throw err;
    }
  };

  const deleteField = async (fieldId: string) => {
    if (!formId) return;
    
    try {
      const response = await formApi.deleteField(formId, fieldId);
      if (response.success) {
        setFields(fields.filter(f => f.id !== fieldId));
      } else {
        throw new Error(response.error || 'Failed to delete field');
      }
    } catch (err: any) {
      console.error('Error deleting field:', err);
      throw err;
    }
  };

  const reorderFields = async (newFields: any[]) => {
    if (!formId) return;
    
    try {
      const response = await formApi.reorderFields(formId, newFields.map(f => ({ id: f.id })));
      if (response.success) {
        setFields(newFields);
      } else {
        throw new Error(response.error || 'Failed to reorder fields');
      }
    } catch (err: any) {
      console.error('Error reordering fields:', err);
      throw err;
    }
  };

  const updateForm = async (updates: { name?: string; description?: string; status?: string }) => {
    if (!formId) return;
    
    try {
      const response = await formApi.updateForm(formId, updates);
      if (response.success) {
        setForm({ ...form, ...response.data });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update form');
      }
    } catch (err: any) {
      console.error('Error updating form:', err);
      throw err;
    }
  };

  return {
    form,
    fields,
    loading,
    error,
    addField,
    updateField,
    deleteField,
    reorderFields,
    updateForm,
    reload: loadForm,
  };
}

