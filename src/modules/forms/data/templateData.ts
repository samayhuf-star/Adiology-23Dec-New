import { FormTemplate } from './formTemplates';

// Complete collection of 100+ form templates
export const allFormTemplates: FormTemplate[] = [
  // BUSINESS FORMS - Lead Generation (10 templates)
  {
    id: 'lead-gen-basic',
    name: 'Basic Lead Generation Form',
    description: 'Simple lead capture form with essential contact information',
    category: 'business',
    subcategory: 'lead-generation',
    thumbnail: '/templates/lead-gen-basic.png',
    color: '#3B82F6',
    tags: ['lead', 'contact', 'basic', 'simple'],
    popularity: 95,
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', type: 'email', label: 'Email Address', required: true },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: false },
      { id: 'company', type: 'text', label: 'Company Name', required: false },
      { id: 'message', type: 'textarea', label: 'How can we help you?', required: false }
    ],
    settings: {
      submitButtonText: 'Get Started',
      successMessage: 'Thank you! We\'ll be in touch soon.',
      emailNotifications: true,
      theme: 'light'
    }
  },
  {
    id: 'lead-gen-advanced',
    name: 'Advanced Lead Qualification Form',
    description: 'Detailed lead form with qualification questions and budget information',
    category: 'business',
    subcategory: 'lead-generation',
    thumbnail: '/templates/lead-gen-advanced.png',
    color: '#8B5CF6',
    tags: ['lead', 'qualification', 'detailed', 'budget'],
    popularity: 88,
    isNew: true,
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', type: 'email', label: 'Business Email', required: true },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true },
      { id: 'company', type: 'text', label: 'Company Name', required: true },
      { id: 'title', type: 'text', label: 'Job Title', required: false },
      { id: 'company_size', type: 'select', label: 'Company Size', required: true, 
        options: ['1-10 employees', '11-50 employees', '51-200 employees', '201-1000 employees', '1000+ employees'] },
      { id: 'budget', type: 'select', label: 'Budget Range', required: true,
        options: ['Under $5,000', '$5,000 - $15,000', '$15,000 - $50,000', '$50,000 - $100,000', '$100,000+'] },
      { id: 'timeline', type: 'select', label: 'Project Timeline', required: true,
        options: ['ASAP', 'Within 1 month', '1-3 months', '3-6 months', '6+ months'] },
      { id: 'services', type: 'checkbox', label: 'Services Interested In', required: true,
        options: ['Web Development', 'Mobile App', 'Digital Marketing', 'SEO', 'Consulting'] },
      { id: 'message', type: 'textarea', label: 'Project Details', required: true }
    ],
    settings: {
      submitButtonText: 'Submit Request',
      successMessage: 'Thank you for your detailed information. Our team will review and contact you within 24 hours.',
      emailNotifications: true,
      theme: 'colorful'
    }
  },
  {
    id: 'lead-gen-webinar',
    name: 'Webinar Registration Lead Form',
    description: 'Capture leads through webinar registrations with follow-up questions',
    category: 'business',
    subcategory: 'lead-generation',
    thumbnail: '/templates/lead-gen-webinar.png',
    color: '#10B981',
    tags: ['webinar', 'registration', 'lead', 'event'],
    popularity: 82,
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', type: 'email', label: 'Email Address', required: true },
      { id: 'company', type: 'text', label: 'Company Name', required: true },
      { id: 'title', type: 'text', label: 'Job Title', required: true },
      { id: 'industry', type: 'select', label: 'Industry', required: true,
        options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Other'] },
      { id: 'experience', type: 'select', label: 'Experience Level', required: true,
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
      { id: 'goals', type: 'textarea', label: 'What do you hope to learn from this webinar?', required: false }
    ],
    settings: {
      submitButtonText: 'Register for Webinar',
      successMessage: 'Registration successful! Check your email for webinar details.',
      emailNotifications: true,
      theme: 'colorful'
    }
  },