export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  thumbnail: string;
  color: string;
  fields: FormField[];
  settings: FormSettings;
  tags: string[];
  popularity: number;
  isNew?: boolean;
  isPremium?: boolean;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'date' | 'number' | 'url';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: any;
}

export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  emailNotifications: boolean;
  theme: 'light' | 'dark' | 'colorful';
}

// Categories with subcategories
export const formCategories = [
  {
    id: 'business',
    name: 'Business Forms',
    icon: '💼',
    subcategories: [
      { id: 'lead-generation', name: 'Lead Generation' },
      { id: 'contact', name: 'Contact Forms' },
      { id: 'quote-request', name: 'Quote Requests' },
      { id: 'consultation', name: 'Consultation Booking' }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Forms',
    icon: '🛒',
    subcategories: [
      { id: 'order', name: 'Order Forms' },
      { id: 'shipping', name: 'Shipping & Delivery' },
      { id: 'returns', name: 'Returns & Refunds' },
      { id: 'product-inquiry', name: 'Product Inquiries' }
    ]
  }
];
// Complete categories list
export const formCategories = [
  {
    id: 'business',
    name: 'Business Forms',
    icon: '💼',
    subcategories: [
      { id: 'lead-generation', name: 'Lead Generation' },
      { id: 'contact', name: 'Contact Forms' },
      { id: 'quote-request', name: 'Quote Requests' },
      { id: 'consultation', name: 'Consultation Booking' }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Forms',
    icon: '🛒',
    subcategories: [
      { id: 'order', name: 'Order Forms' },
      { id: 'shipping', name: 'Shipping & Delivery' },
      { id: 'returns', name: 'Returns & Refunds' },
      { id: 'product-inquiry', name: 'Product Inquiries' }
    ]
  },
  {
    id: 'education',
    name: 'Education Forms',
    icon: '🎓',
    subcategories: [
      { id: 'application', name: 'Applications' },
      { id: 'enrollment', name: 'Course Enrollment' },
      { id: 'feedback', name: 'Student Feedback' },
      { id: 'assessment', name: 'Assessments' }
    ]
  },
  {
    id: 'healthcare',
    name: 'Healthcare Forms',
    icon: '🏥',
    subcategories: [
      { id: 'patient-intake', name: 'Patient Intake' },
      { id: 'appointment', name: 'Appointments' },
      { id: 'medical-history', name: 'Medical History' },
      { id: 'consent', name: 'Consent Forms' }
    ]
  },
  {
    id: 'events',
    name: 'Event Forms',
    icon: '🎉',
    subcategories: [
      { id: 'registration', name: 'Event Registration' },
      { id: 'rsvp', name: 'RSVP Forms' },
      { id: 'feedback', name: 'Event Feedback' },
      { id: 'volunteer', name: 'Volunteer Sign-up' }
    ]
  },
  {
    id: 'surveys',
    name: 'Surveys & Research',
    icon: '📊',
    subcategories: [
      { id: 'customer-satisfaction', name: 'Customer Satisfaction' },
      { id: 'market-research', name: 'Market Research' },
      { id: 'employee-feedback', name: 'Employee Feedback' },
      { id: 'product-feedback', name: 'Product Feedback' }
    ]
  },
  {
    id: 'hr',
    name: 'HR & Employment',
    icon: '👥',
    subcategories: [
      { id: 'job-application', name: 'Job Applications' },
      { id: 'employee-onboarding', name: 'Employee Onboarding' },
      { id: 'performance-review', name: 'Performance Reviews' },
      { id: 'time-off-request', name: 'Time Off Requests' }
    ]
  },
  {
    id: 'real-estate',
    name: 'Real Estate Forms',
    icon: '🏠',
    subcategories: [
      { id: 'property-inquiry', name: 'Property Inquiries' },
      { id: 'rental-application', name: 'Rental Applications' },
      { id: 'property-valuation', name: 'Property Valuation' },
      { id: 'maintenance-request', name: 'Maintenance Requests' }
    ]
  }
];
// 100+ Form Templates
export const formTemplates: FormTemplate[] = [
  // Business Forms - Lead Generation
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