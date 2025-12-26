// Forms API - Mock implementation for development
// Replace with actual backend integration

export interface FormTemplate {
  id: string;
  template_id: string;
  name: string;
  description: string;
  category: string;
  thumbnail_url?: string;
  use_count?: number;
  rating?: number;
  fields?: FormField[];
}

export interface FormField {
  id: string;
  field_type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  position?: number;
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  submission_count?: number;
  created_at: string;
  updated_at: string;
  fields?: FormField[];
}

// Mock templates data
const mockTemplates: FormTemplate[] = [
  {
    id: '1',
    template_id: 'contact-form',
    name: 'Contact Form',
    description: 'Simple contact form with name, email, and message fields',
    category: 'lead_generation',
    thumbnail_url: 'https://via.placeholder.com/300x200/667eea/ffffff?text=Contact+Form',
    use_count: 1250,
    rating: 4.8,
    fields: [
      { id: '1', field_type: 'text', label: 'Full Name', required: true, position: 1 },
      { id: '2', field_type: 'email', label: 'Email Address', required: true, position: 2 },
      { id: '3', field_type: 'textarea', label: 'Message', required: true, position: 3 }
    ]
  },
  {
    id: '2',
    template_id: 'lead-capture',
    name: 'Lead Capture Form',
    description: 'Optimized lead generation form with phone and company fields',
    category: 'lead_generation',
    thumbnail_url: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Lead+Capture',
    use_count: 890,
    rating: 4.6,
    fields: [
      { id: '1', field_type: 'text', label: 'First Name', required: true, position: 1 },
      { id: '2', field_type: 'text', label: 'Last Name', required: true, position: 2 },
      { id: '3', field_type: 'email', label: 'Business Email', required: true, position: 3 },
      { id: '4', field_type: 'tel', label: 'Phone Number', required: false, position: 4 },
      { id: '5', field_type: 'text', label: 'Company Name', required: false, position: 5 }
    ]
  },
  {
    id: '3',
    template_id: 'feedback-survey',
    name: 'Customer Feedback Survey',
    description: 'Collect customer feedback with rating and comment fields',
    category: 'feedback',
    thumbnail_url: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Feedback+Survey',
    use_count: 567,
    rating: 4.4,
    fields: [
      { id: '1', field_type: 'text', label: 'Customer Name', required: true, position: 1 },
      { id: '2', field_type: 'select', label: 'Overall Rating', required: true, position: 2, options: ['Excellent', 'Good', 'Average', 'Poor'] },
      { id: '3', field_type: 'textarea', label: 'Comments', required: false, position: 3 }
    ]
  },
  {
    id: '4',
    template_id: 'event-registration',
    name: 'Event Registration',
    description: 'Register attendees for events with dietary preferences',
    category: 'events',
    thumbnail_url: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Event+Registration',
    use_count: 423,
    rating: 4.7,
    fields: [
      { id: '1', field_type: 'text', label: 'Full Name', required: true, position: 1 },
      { id: '2', field_type: 'email', label: 'Email', required: true, position: 2 },
      { id: '3', field_type: 'tel', label: 'Phone', required: true, position: 3 },
      { id: '4', field_type: 'select', label: 'Dietary Preferences', required: false, position: 4, options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free'] }
    ]
  },
  {
    id: '5',
    template_id: 'newsletter-signup',
    name: 'Newsletter Signup',
    description: 'Simple newsletter subscription form',
    category: 'lead_generation',
    thumbnail_url: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Newsletter+Signup',
    use_count: 1100,
    rating: 4.5
  },
  {
    id: '6',
    template_id: 'product-survey',
    name: 'Product Survey',
    description: 'Gather product feedback and feature requests',
    category: 'surveys',
    thumbnail_url: 'https://via.placeholder.com/300x200/06b6d4/ffffff?text=Product+Survey',
    use_count: 334,
    rating: 4.3
  }
];

// Mock forms data
let mockForms: Form[] = [];

// API functions
export const formsApi = {
  // Templates
  async getFeaturedTemplates(limit = 6) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    return {
      success: true,
      data: mockTemplates.slice(0, limit)
    };
  },

  async getAllTemplates(filters?: { category?: string; featured?: boolean; limit?: number }) {
    await new Promise(resolve => setTimeout(resolve, 300));
    let filtered = [...mockTemplates];
    
    if (filters?.category && filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return {
      success: true,
      data: filtered
    };
  },

  async searchTemplates(query: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const filtered = mockTemplates.filter(t => 
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      success: true,
      data: filtered
    };
  },

  async getTemplate(templateId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const template = mockTemplates.find(t => t.id === templateId || t.template_id === templateId);
    
    if (!template) {
      return {
        success: false,
        error: 'Template not found'
      };
    }
    
    return {
      success: true,
      data: template
    };
  },

  // Forms
  async createForm(data: { name: string; description?: string }) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newForm: Form = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      status: 'draft',
      submission_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fields: []
    };
    
    mockForms.push(newForm);
    
    return {
      success: true,
      data: newForm
    };
  },

  async createFormFromTemplate(data: { template_id: string; form_name?: string }) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const template = mockTemplates.find(t => t.id === data.template_id || t.template_id === data.template_id);
    
    if (!template) {
      return {
        success: false,
        error: 'Template not found'
      };
    }
    
    const newForm: Form = {
      id: Date.now().toString(),
      name: data.form_name || template.name,
      description: template.description,
      status: 'draft',
      submission_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fields: template.fields || []
    };
    
    mockForms.push(newForm);
    
    return {
      success: true,
      data: newForm
    };
  },

  async getUserForms(page = 1, limit = 50) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      success: true,
      data: mockForms
    };
  },

  async getForm(formId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const form = mockForms.find(f => f.id === formId);
    
    if (!form) {
      return {
        success: false,
        error: 'Form not found'
      };
    }
    
    return {
      success: true,
      data: form
    };
  },

  async updateForm(formId: string, data: { name?: string; description?: string; status?: string }) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const formIndex = mockForms.findIndex(f => f.id === formId);
    
    if (formIndex === -1) {
      return {
        success: false,
        error: 'Form not found'
      };
    }
    
    mockForms[formIndex] = {
      ...mockForms[formIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    return {
      success: true,
      data: mockForms[formIndex]
    };
  },

  async deleteForm(formId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const formIndex = mockForms.findIndex(f => f.id === formId);
    
    if (formIndex === -1) {
      return {
        success: false,
        error: 'Form not found'
      };
    }
    
    mockForms.splice(formIndex, 1);
    
    return {
      success: true
    };
  }
};