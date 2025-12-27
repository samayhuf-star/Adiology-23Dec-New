// Forms API - Workspace-aware implementation with multi-tenant isolation
import { createWorkspaceQuery, getCurrentWorkspaceContext, validateWorkspaceAccess, logSecurityViolation } from '../utils/workspace-api';
import { loggingService } from '../utils/loggingService';
import { z } from 'zod';

// Validation schemas
const CreateFormSchema = z.object({
  name: z.string().min(1, 'Form name is required').max(100, 'Form name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

const UpdateFormSchema = z.object({
  name: z.string().min(1, 'Form name is required').max(100, 'Form name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

const CreateFormFromTemplateSchema = z.object({
  template_id: z.string().min(1, 'Template ID is required'),
  form_name: z.string().min(1, 'Form name is required').max(100, 'Form name too long').optional(),
});

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
  workspace_id: string;
  user_id: string;
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

// API functions with workspace isolation
export const formsApi = {
  // Templates (global, not workspace-specific)
  async getFeaturedTemplates(limit = 6) {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('FormsAPI', 'getFeaturedTemplates', { 
        workspaceId: context.workspaceId,
        limit 
      });

      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return {
        success: true,
        data: mockTemplates.slice(0, limit)
      };
    } catch (error) {
      loggingService.addLog('error', 'FormsAPI', 'Error getting featured templates', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: 'Failed to load featured templates'
      };
    }
  },

  async getAllTemplates(filters?: { category?: string; featured?: boolean; limit?: number }) {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('FormsAPI', 'getAllTemplates', { 
        workspaceId: context.workspaceId,
        filters 
      });

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
    } catch (error) {
      loggingService.addLog('error', 'FormsAPI', 'Error getting all templates', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: 'Failed to load templates'
      };
    }
  },

  async searchTemplates(query: string) {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('FormsAPI', 'searchTemplates', { 
        workspaceId: context.workspaceId,
        query 
      });

      await new Promise(resolve => setTimeout(resolve, 200));
      const filtered = mockTemplates.filter(t => 
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        success: true,
        data: filtered
      };
    } catch (error) {
      loggingService.addLog('error', 'FormsAPI', 'Error searching templates', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: 'Failed to search templates'
      };
    }
  },

  async getTemplate(templateId: string) {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('FormsAPI', 'getTemplate', { 
        workspaceId: context.workspaceId,
        templateId 
      });

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
    } catch (error) {
      loggingService.addLog('error', 'FormsAPI', 'Error getting template', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: 'Failed to load template'
      };
    }
  },

  // Forms (workspace-specific)
  async createForm(data: { name: string; description?: string }) {
    try {
      // Validate input
      const validatedData = CreateFormSchema.parse(data);
      
      const workspaceQuery = await createWorkspaceQuery('forms');
      if (!workspaceQuery) {
        throw new Error('No workspace context available');
      }

      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('FormsAPI', 'createForm', { 
        workspaceId: context.workspaceId,
        formName: validatedData.name 
      });

      // In a real implementation, this would use the workspace query builder
      const formData = {
        name: validatedData.name,
        description: validatedData.description,
        status: 'draft' as const,
        workspace_id: context.workspaceId,
        user_id: context.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newForm, error } = await workspaceQuery.insert(formData);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: newForm
      };
    } catch (error) {
      loggingService.addLog('error', 'FormsAPI', 'Error creating form', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors[0].message
        };
      }
      
      return {
        success: false,
        error: 'Failed to create form'
      };
    }
  },

  async createFormFromTemplate(data: { template_id: string; form_name?: string }) {
    try {
      // Validate input
      const validatedData = CreateFormFromTemplateSchema.parse(data);
      
      const workspaceQuery = await createWorkspaceQuery('forms');
      if (!workspaceQuery) {
        throw new Error('No workspace context available');
      }

      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('FormsAPI', 'createFormFromTemplate', { 
        workspaceId: context.workspaceId,
        templateId: validatedData.template_id 
      });

      // Get template
      const template = mockTemplates.find(t => t.id === validatedData.template_id || t.template_id === validatedData.template_id);
      
      if (!template) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      const formData = {
        name: validatedData.form_name || template.name,
        description: template.description,
        status: 'draft' as const,
        workspace_id: context.workspaceId,
        user_id: context.userId,
        template_id: template.template_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newForm, error } = await workspaceQuery.insert(formData);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: newForm
      };
    } catch (error) {
      loggingService.addLog('error', 'FormsAPI', 'Error creating form from template', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors[0].message
        };
      }
      
      return {
        success: false,
        error: 'Failed to create form from template'
      };
    }
  },

  async getUserForms(page = 1, limit = 50) {
    try {
      const workspaceQuery = await createWorkspaceQuery('forms');
      if (!workspaceQuery) {
        throw new Error('No workspace context available');
      }

      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('FormsAPI', 'getUserForms', { 
        workspaceId: context.workspaceId,
        page,
        limit 
      });

      const offset = (page - 1) * limit;
      
      const { data: forms, error } = await workspaceQuery
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: forms || []
      };
    } catch (error) {
      loggingService.addLog('error', 'FormsAPI', 'Error getting user forms', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: 'Failed to load forms'
      };
    }
  },

  async getForm(formId: string) {
    try {
      const workspaceQuery = await createWorkspaceQuery('forms');
      if (!workspaceQuery) {
        throw new Error('No workspace context available');
      }

      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('FormsAPI', 'getForm', { 
        workspaceId: context.workspaceId,
        formId 
      });

      const { data: form, error } = await workspaceQuery
        .select('*')
        .eq('id', formId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Form not found'
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      // Validate workspace access
      if (form && !await validateWorkspaceAccess(form.workspace_id, 'read_form')) {
        return {
          success: false,
          error: 'Access denied'
        };
      }

      return {
        success: true,
        data: form
      };
    } catch (error) {
      loggingService.addLog('error', 'FormsAPI', 'Error getting form', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: 'Failed to load form'
      };
    }
  },

  async updateForm(formId: string, data: { name?: string; description?: string; status?: string }) {
    try {
      // Validate input
      const validatedData = UpdateFormSchema.parse(data);
      
      const workspaceQuery = await createWorkspaceQuery('forms');
      if (!workspaceQuery) {
        throw new Error('No workspace context available');
      }

      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('FormsAPI', 'updateForm', { 
        workspaceId: context.workspaceId,
        formId 
      });

      // First check if form exists and user has access
      const { data: existingForm, error: fetchError } = await workspaceQuery
        .select('workspace_id')
        .eq('id', formId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return {
            success: false,
            error: 'Form not found'
          };
        }
        throw new Error(`Database error: ${fetchError.message}`);
      }

      // Validate workspace access
      if (!await validateWorkspaceAccess(existingForm.workspace_id, 'update_form')) {
        return {
          success: false,
          error: 'Access denied'
        };
      }

      const updateData = {
        ...validatedData,
        updated_at: new Date().toISOString()
      };

      const { data: updatedForm, error } = await workspaceQuery
        .update(updateData)
        .eq('id', formId)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: updatedForm
      };
    } catch (error) {
      loggingService.addLog('error', 'FormsAPI', 'Error updating form', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors[0].message
        };
      }
      
      return {
        success: false,
        error: 'Failed to update form'
      };
    }
  },

  async deleteForm(formId: string) {
    try {
      const workspaceQuery = await createWorkspaceQuery('forms');
      if (!workspaceQuery) {
        throw new Error('No workspace context available');
      }

      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('FormsAPI', 'deleteForm', { 
        workspaceId: context.workspaceId,
        formId 
      });

      // First check if form exists and user has access
      const { data: existingForm, error: fetchError } = await workspaceQuery
        .select('workspace_id')
        .eq('id', formId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return {
            success: false,
            error: 'Form not found'
          };
        }
        throw new Error(`Database error: ${fetchError.message}`);
      }

      // Validate workspace access
      if (!await validateWorkspaceAccess(existingForm.workspace_id, 'delete_form')) {
        return {
          success: false,
          error: 'Access denied'
        };
      }

      const { error } = await workspaceQuery
        .delete()
        .eq('id', formId);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true
      };
    } catch (error) {
      loggingService.addLog('error', 'FormsAPI', 'Error deleting form', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        error: 'Failed to delete form'
      };
    }
  }
};