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