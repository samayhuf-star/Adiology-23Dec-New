import { supabase } from '../../../utils/supabase/client';
import { formsApi } from '../../../api/forms';

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

// Helper to safely parse JSON response
async function safeJsonResponse(response: Response): Promise<any> {
  // Check if response is OK
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  // Check if response is actually JSON before parsing
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    // Response is not JSON (likely HTML error page)
    const text = await response.text();
    throw new Error(`Expected JSON but received ${contentType}. Response: ${text.substring(0, 100)}`);
  }
  
  return response.json();
}

export const formApi = {
  // Forms CRUD
  async createForm(data: { name: string; description?: string }) {
    try {
      return await formsApi.createForm(data);
    } catch (error) {
      console.error('Create form error:', error);
      const headers = await getAuthHeaders();
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return safeJsonResponse(response);
    }
  },

  async getUserForms(page = 1, limit = 50) {
    try {
      return await formsApi.getUserForms(page, limit);
    } catch (error) {
      console.error('Get user forms error:', error);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}?page=${page}&limit=${limit}`, {
        headers,
      });
      return safeJsonResponse(response);
    }
  },

  async getForm(formId: string) {
    try {
      return await formsApi.getForm(formId);
    } catch (error) {
      console.error('Get form error:', error);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/${formId}`, {
        headers,
      });
      return safeJsonResponse(response);
    }
  },

  async updateForm(formId: string, data: { name?: string; description?: string; status?: string }) {
    try {
      return await formsApi.updateForm(formId, data);
    } catch (error) {
      console.error('Update form error:', error);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/${formId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      return safeJsonResponse(response);
    }
  },

  async deleteForm(formId: string) {
    try {
      return await formsApi.deleteForm(formId);
    } catch (error) {
      console.error('Delete form error:', error);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/${formId}`, {
        method: 'DELETE',
        headers,
      });
      return safeJsonResponse(response);
    }
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
    return safeJsonResponse(response);
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
    return safeJsonResponse(response);
  },

  async deleteField(formId: string, fieldId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/fields/${fieldId}`, {
      method: 'DELETE',
      headers,
    });
    return safeJsonResponse(response);
  },

  async reorderFields(formId: string, fieldOrder: Array<{ id: string }>) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/reorder`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ fieldOrder }),
    });
    return safeJsonResponse(response);
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
    return safeJsonResponse(response);
  },

  async getSubmissions(formId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/submissions`, {
      headers,
    });
    return safeJsonResponse(response);
  },

  async deleteSubmission(formId: string, submissionId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/submissions/${submissionId}`, {
      method: 'DELETE',
      headers,
    });
    return safeJsonResponse(response);
  },

  async exportSubmissions(formId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${formId}/submissions/export`, {
      headers,
    });
    return response.blob();
  },

  // Templates
  async getFeaturedTemplates(limit = 6) {
    try {
      return await formsApi.getFeaturedTemplates(limit);
    } catch (error) {
      console.error('Get featured templates error:', error);
      const response = await fetch(`/api/templates/featured?limit=${limit}`);
      return safeJsonResponse(response);
    }
  },

  async getAllTemplates(filters?: { category?: string; featured?: boolean; limit?: number }) {
    try {
      return await formsApi.getAllTemplates(filters);
    } catch (error) {
      console.error('Get all templates error:', error);
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.featured) params.append('featured', 'true');
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/templates?${params.toString()}`, {
        headers,
      });
      return safeJsonResponse(response);
    }
  },

  async searchTemplates(query: string) {
    try {
      return await formsApi.searchTemplates(query);
    } catch (error) {
      console.error('Search templates error:', error);
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/templates/search?q=${encodeURIComponent(query)}`, {
        headers,
      });
      return safeJsonResponse(response);
    }
  },

  async getTemplatesByCategory(category: string) {
    try {
      return await formsApi.getAllTemplates({ category });
    } catch (error) {
      console.error('Get templates by category error:', error);
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/templates/category/${encodeURIComponent(category)}`, {
        headers,
      });
      return safeJsonResponse(response);
    }
  },

  async getTemplate(templateId: string) {
    try {
      return await formsApi.getTemplate(templateId);
    } catch (error) {
      console.error('Get template error:', error);
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/templates/${encodeURIComponent(templateId)}`, {
        headers,
      });
      return safeJsonResponse(response);
    }
  },

  async createFormFromTemplate(data: { template_id: string; form_name?: string }) {
    try {
      return await formsApi.createFormFromTemplate(data);
    } catch (error) {
      console.error('Create form from template error:', error);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/forms/from-template', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return safeJsonResponse(response);
    }
  },
};

