import { supabase } from '../../../utils/supabase/client';

const API_BASE = '/api/forms';

// Helper to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  return headers;
}

export const formApi = {
  // Forms CRUD
  async createForm(data: { name: string; description?: string }) {
    const headers = await getAuthHeaders();
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getUserForms(page = 1, limit = 50) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}?page=${page}&limit=${limit}`, {
      headers,
    });
    return response.json();
  },

  async getForm(formId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}`, {
      headers,
    });
    return response.json();
  },

  async updateForm(formId: string, data: { name?: string; description?: string; status?: string }) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteForm(formId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}`, {
      method: 'DELETE',
      headers,
    });
    return response.json();
  },

  // Fields
  async addField(formId: string, fieldData: {
    field_type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  }) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/fields`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fieldData),
    });
    return response.json();
  },

  async updateField(formId: string, fieldId: string, updates: {
    label?: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    position?: number;
  }) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/fields/${fieldId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  async deleteField(formId: string, fieldId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/fields/${fieldId}`, {
      method: 'DELETE',
      headers,
    });
    return response.json();
  },

  async reorderFields(formId: string, fieldOrder: Array<{ id: string }>) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/reorder`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ fieldOrder }),
    });
    return response.json();
  },

  // Submissions
  async submitForm(formId: string, data: Record<string, any>) {
    const response = await fetch(`${API_BASE}/${formId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });
    return response.json();
  },

  async getSubmissions(formId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/submissions`, {
      headers,
    });
    return response.json();
  },

  async deleteSubmission(formId: string, submissionId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/submissions/${submissionId}`, {
      method: 'DELETE',
      headers,
    });
    return response.json();
  },

  async exportSubmissions(formId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/submissions/export`, {
      headers,
    });
    return response.blob();
  },
};

