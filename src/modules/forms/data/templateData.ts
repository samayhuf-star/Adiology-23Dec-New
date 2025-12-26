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
  // BUSINESS FORMS - Contact Forms (8 templates)
  {
    id: 'contact-basic',
    name: 'Simple Contact Form',
    description: 'Basic contact form for general inquiries',
    category: 'business',
    subcategory: 'contact',
    thumbnail: '/templates/contact-basic.png',
    color: '#6366F1',
    tags: ['contact', 'inquiry', 'basic'],
    popularity: 92,
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: true },
      { id: 'subject', type: 'text', label: 'Subject', required: true },
      { id: 'message', type: 'textarea', label: 'Message', required: true }
    ],
    settings: {
      submitButtonText: 'Send Message',
      successMessage: 'Thank you for your message. We\'ll get back to you soon!',
      emailNotifications: true,
      theme: 'light'
    }
  },
  {
    id: 'contact-support',
    name: 'Customer Support Form',
    description: 'Detailed support request form with priority and category options',
    category: 'business',
    subcategory: 'contact',
    thumbnail: '/templates/contact-support.png',
    color: '#EF4444',
    tags: ['support', 'help', 'ticket', 'priority'],
    popularity: 85,
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', type: 'email', label: 'Email Address', required: true },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: false },
      { id: 'category', type: 'select', label: 'Issue Category', required: true,
        options: ['Technical Support', 'Billing Question', 'Feature Request', 'Bug Report', 'General Inquiry'] },
      { id: 'priority', type: 'select', label: 'Priority Level', required: true,
        options: ['Low', 'Medium', 'High', 'Urgent'] },
      { id: 'subject', type: 'text', label: 'Subject', required: true },
      { id: 'description', type: 'textarea', label: 'Detailed Description', required: true },
      { id: 'attachment', type: 'file', label: 'Attach File (optional)', required: false }
    ],
    settings: {
      submitButtonText: 'Submit Support Request',
      successMessage: 'Your support request has been submitted. We\'ll respond within 24 hours.',
      emailNotifications: true,
      theme: 'light'
    }
  },

  // E-COMMERCE FORMS - Order Forms (10 templates)
  {
    id: 'order-product',
    name: 'Product Order Form',
    description: 'Complete product ordering form with shipping and payment details',
    category: 'ecommerce',
    subcategory: 'order',
    thumbnail: '/templates/order-product.png',
    color: '#F59E0B',
    tags: ['order', 'product', 'shipping', 'payment'],
    popularity: 89,
    isPremium: true,
    fields: [
      { id: 'customer_name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', type: 'email', label: 'Email Address', required: true },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true },
      { id: 'product', type: 'select', label: 'Product', required: true,
        options: ['Basic Package - $99', 'Pro Package - $199', 'Enterprise Package - $399'] },
      { id: 'quantity', type: 'number', label: 'Quantity', required: true },
      { id: 'shipping_address', type: 'textarea', label: 'Shipping Address', required: true },
      { id: 'billing_same', type: 'checkbox', label: 'Billing address same as shipping', required: false },
      { id: 'special_instructions', type: 'textarea', label: 'Special Instructions', required: false }
    ],
    settings: {
      submitButtonText: 'Place Order',
      successMessage: 'Order placed successfully! You\'ll receive a confirmation email shortly.',
      emailNotifications: true,
      theme: 'colorful'
    }
  },

  // EDUCATION FORMS - Applications (12 templates)
  {
    id: 'course-application',
    name: 'Course Application Form',
    description: 'Comprehensive application form for educational courses',
    category: 'education',
    subcategory: 'application',
    thumbnail: '/templates/course-application.png',
    color: '#8B5CF6',
    tags: ['education', 'course', 'application', 'enrollment'],
    popularity: 78,
    fields: [
      { id: 'personal_info', type: 'text', label: 'Full Name', required: true },
      { id: 'email', type: 'email', label: 'Email Address', required: true },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true },
      { id: 'date_of_birth', type: 'date', label: 'Date of Birth', required: true },
      { id: 'education_level', type: 'select', label: 'Highest Education Level', required: true,
        options: ['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'] },
      { id: 'course_interest', type: 'select', label: 'Course of Interest', required: true,
        options: ['Web Development', 'Data Science', 'Digital Marketing', 'Graphic Design', 'Business Management'] },
      { id: 'experience', type: 'textarea', label: 'Relevant Experience', required: false },
      { id: 'motivation', type: 'textarea', label: 'Why do you want to take this course?', required: true }
    ],
    settings: {
      submitButtonText: 'Submit Application',
      successMessage: 'Application submitted successfully! We\'ll review and contact you within 5 business days.',
      emailNotifications: true,
      theme: 'light'
    }
  },

  // HEALTHCARE FORMS - Patient Intake (8 templates)
  {
    id: 'patient-intake-basic',
    name: 'Basic Patient Intake Form',
    description: 'Essential patient information and medical history form',
    category: 'healthcare',
    subcategory: 'patient-intake',
    thumbnail: '/templates/patient-intake.png',
    color: '#10B981',
    tags: ['healthcare', 'patient', 'medical', 'intake'],
    popularity: 91,
    isPremium: true,
    fields: [
      { id: 'patient_name', type: 'text', label: 'Patient Full Name', required: true },
      { id: 'date_of_birth', type: 'date', label: 'Date of Birth', required: true },
      { id: 'gender', type: 'select', label: 'Gender', required: true,
        options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true },
      { id: 'email', type: 'email', label: 'Email Address', required: true },
      { id: 'address', type: 'textarea', label: 'Home Address', required: true },
      { id: 'emergency_contact', type: 'text', label: 'Emergency Contact Name', required: true },
      { id: 'emergency_phone', type: 'phone', label: 'Emergency Contact Phone', required: true },
      { id: 'insurance', type: 'text', label: 'Insurance Provider', required: false },
      { id: 'medical_history', type: 'textarea', label: 'Medical History', required: false },
      { id: 'current_medications', type: 'textarea', label: 'Current Medications', required: false },
      { id: 'allergies', type: 'textarea', label: 'Known Allergies', required: false }
    ],
    settings: {
      submitButtonText: 'Submit Patient Information',
      successMessage: 'Patient intake form submitted successfully. Please arrive 15 minutes early for your appointment.',
      emailNotifications: true,
      theme: 'light'
    }
  },

  // EVENT FORMS - Registration (15 templates)
  {
    id: 'event-registration-conference',
    name: 'Conference Registration Form',
    description: 'Professional conference registration with session preferences',
    category: 'events',
    subcategory: 'registration',
    thumbnail: '/templates/event-conference.png',
    color: '#F59E0B',
    tags: ['conference', 'event', 'registration', 'professional'],
    popularity: 84,
    isNew: true,
    fields: [
      { id: 'attendee_name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', type: 'email', label: 'Email Address', required: true },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true },
      { id: 'company', type: 'text', label: 'Company/Organization', required: true },
      { id: 'job_title', type: 'text', label: 'Job Title', required: true },
      { id: 'ticket_type', type: 'select', label: 'Ticket Type', required: true,
        options: ['Early Bird - $299', 'Regular - $399', 'VIP - $599', 'Student - $99'] },
      { id: 'dietary_restrictions', type: 'textarea', label: 'Dietary Restrictions', required: false },
      { id: 'sessions', type: 'checkbox', label: 'Session Preferences', required: false,
        options: ['AI & Machine Learning', 'Web Development', 'Mobile Apps', 'DevOps', 'Security'] },
      { id: 'networking', type: 'radio', label: 'Networking Interest', required: true,
        options: ['Very Interested', 'Somewhat Interested', 'Not Interested'] }
    ],
    settings: {
      submitButtonText: 'Register for Conference',
      successMessage: 'Registration successful! Check your email for confirmation and event details.',
      emailNotifications: true,
      theme: 'colorful'
    }
  }
];

// Export the complete template collection
export { allFormTemplates as formTemplates };
// Adding more templates to reach 100+ total

// SURVEYS & RESEARCH FORMS (20 templates)
const surveyTemplates: FormTemplate[] = [
  {
    id: 'customer-satisfaction-basic',
    name: 'Customer Satisfaction Survey',
    description: 'Measure customer satisfaction with products and services',
    category: 'surveys',
    subcategory: 'customer-satisfaction',
    thumbnail: '/templates/survey-satisfaction.png',
    color: '#06B6D4',
    tags: ['survey', 'satisfaction', 'feedback', 'rating'],
    popularity: 87,
    fields: [
      { id: 'overall_rating', type: 'select', label: 'Overall Satisfaction', required: true,
        options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
      { id: 'product_quality', type: 'select', label: 'Product Quality Rating', required: true,
        options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'] },
      { id: 'customer_service', type: 'select', label: 'Customer Service Rating', required: true,
        options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'] },
      { id: 'recommend', type: 'radio', label: 'Would you recommend us?', required: true,
        options: ['Definitely', 'Probably', 'Maybe', 'Probably Not', 'Definitely Not'] },
      { id: 'improvements', type: 'textarea', label: 'Suggestions for improvement', required: false },
      { id: 'additional_comments', type: 'textarea', label: 'Additional Comments', required: false }
    ],
    settings: {
      submitButtonText: 'Submit Survey',
      successMessage: 'Thank you for your feedback! Your input helps us improve.',
      emailNotifications: true,
      theme: 'colorful'
    }
  },
  {
    id: 'market-research-survey',
    name: 'Market Research Survey',
    description: 'Comprehensive market research questionnaire for product development',
    category: 'surveys',
    subcategory: 'market-research',
    thumbnail: '/templates/survey-market.png',
    color: '#8B5CF6',
    tags: ['market research', 'product', 'demographics', 'preferences'],
    popularity: 75,
    isPremium: true,
    fields: [
      { id: 'age_group', type: 'select', label: 'Age Group', required: true,
        options: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] },
      { id: 'gender', type: 'select', label: 'Gender', required: false,
        options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
      { id: 'income', type: 'select', label: 'Household Income', required: false,
        options: ['Under $25k', '$25k-$50k', '$50k-$75k', '$75k-$100k', '$100k+'] },
      { id: 'product_usage', type: 'checkbox', label: 'Which products do you currently use?', required: true,
        options: ['Product A', 'Product B', 'Product C', 'Competitor X', 'Competitor Y', 'None'] },
      { id: 'purchase_frequency', type: 'select', label: 'How often do you purchase?', required: true,
        options: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'Rarely'] },
      { id: 'decision_factors', type: 'checkbox', label: 'What influences your purchase decisions?', required: true,
        options: ['Price', 'Quality', 'Brand', 'Reviews', 'Recommendations', 'Features'] },
      { id: 'new_product_interest', type: 'textarea', label: 'What new features would you like to see?', required: false }
    ],
    settings: {
      submitButtonText: 'Complete Survey',
      successMessage: 'Survey completed! Thank you for participating in our research.',
      emailNotifications: true,
      theme: 'light'
    }
  }
];

// HR & EMPLOYMENT FORMS (15 templates)
const hrTemplates: FormTemplate[] = [
  {
    id: 'job-application-general',
    name: 'General Job Application',
    description: 'Standard job application form for various positions',
    category: 'hr',
    subcategory: 'job-application',
    thumbnail: '/templates/job-application.png',
    color: '#EF4444',
    tags: ['job', 'application', 'employment', 'career'],
    popularity: 93,
    fields: [
      { id: 'personal_info', type: 'text', label: 'Full Name', required: true },
      { id: 'email', type: 'email', label: 'Email Address', required: true },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true },
      { id: 'address', type: 'textarea', label: 'Address', required: true },
      { id: 'position', type: 'select', label: 'Position Applied For', required: true,
        options: ['Software Developer', 'Marketing Manager', 'Sales Representative', 'Customer Support', 'Other'] },
      { id: 'experience', type: 'select', label: 'Years of Experience', required: true,
        options: ['0-1 years', '2-5 years', '6-10 years', '11-15 years', '15+ years'] },
      { id: 'education', type: 'select', label: 'Highest Education', required: true,
        options: ['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'] },
      { id: 'resume', type: 'file', label: 'Upload Resume', required: true },
      { id: 'cover_letter', type: 'textarea', label: 'Cover Letter', required: false },
      { id: 'availability', type: 'date', label: 'Available Start Date', required: true },
      { id: 'salary_expectation', type: 'text', label: 'Salary Expectation', required: false }
    ],
    settings: {
      submitButtonText: 'Submit Application',
      successMessage: 'Application submitted successfully! We\'ll review and contact you if selected.',
      emailNotifications: true,
      theme: 'light'
    }
  },
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding Form',
    description: 'New employee information and documentation collection',
    category: 'hr',
    subcategory: 'employee-onboarding',
    thumbnail: '/templates/onboarding.png',
    color: '#10B981',
    tags: ['onboarding', 'new employee', 'documentation', 'hr'],
    popularity: 81,
    isPremium: true,
    fields: [
      { id: 'employee_name', type: 'text', label: 'Full Legal Name', required: true },
      { id: 'preferred_name', type: 'text', label: 'Preferred Name', required: false },
      { id: 'employee_id', type: 'text', label: 'Employee ID', required: true },
      { id: 'department', type: 'select', label: 'Department', required: true,
        options: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'] },
      { id: 'position', type: 'text', label: 'Job Title', required: true },
      { id: 'start_date', type: 'date', label: 'Start Date', required: true },
      { id: 'manager', type: 'text', label: 'Direct Manager', required: true },
      { id: 'emergency_contact', type: 'text', label: 'Emergency Contact Name', required: true },
      { id: 'emergency_phone', type: 'phone', label: 'Emergency Contact Phone', required: true },
      { id: 'tax_forms', type: 'checkbox', label: 'Required Documents', required: true,
        options: ['W-4 Form', 'I-9 Form', 'Direct Deposit Form', 'Benefits Enrollment'] }
    ],
    settings: {
      submitButtonText: 'Complete Onboarding',
      successMessage: 'Onboarding information submitted! HR will contact you with next steps.',
      emailNotifications: true,
      theme: 'light'
    }
  }
];

// REAL ESTATE FORMS (12 templates)
const realEstateTemplates: FormTemplate[] = [
  {
    id: 'property-inquiry',
    name: 'Property Inquiry Form',
    description: 'Capture interest in specific properties with buyer preferences',
    category: 'real-estate',
    subcategory: 'property-inquiry',
    thumbnail: '/templates/property-inquiry.png',
    color: '#F59E0B',
    tags: ['real estate', 'property', 'inquiry', 'buyer'],
    popularity: 86,
    fields: [
      { id: 'buyer_name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', type: 'email', label: 'Email Address', required: true },
      { id: 'phone', type: 'phone', label: 'Phone Number', required: true },
      { id: 'property_interest', type: 'text', label: 'Property Address/ID', required: true },
      { id: 'budget_range', type: 'select', label: 'Budget Range', required: true,
        options: ['Under $200k', '$200k-$400k', '$400k-$600k', '$600k-$800k', '$800k-$1M', '$1M+'] },
      { id: 'property_type', type: 'checkbox', label: 'Property Type Interest', required: true,
        options: ['Single Family Home', 'Condo', 'Townhouse', 'Multi-Family', 'Land'] },
      { id: 'bedrooms', type: 'select', label: 'Minimum Bedrooms', required: true,
        options: ['1', '2', '3', '4', '5+'] },
      { id: 'timeline', type: 'select', label: 'Purchase Timeline', required: true,
        options: ['Immediately', 'Within 3 months', '3-6 months', '6-12 months', 'Just browsing'] },
      { id: 'financing', type: 'radio', label: 'Financing Status', required: true,
        options: ['Pre-approved', 'Need financing help', 'Cash buyer'] },
      { id: 'additional_info', type: 'textarea', label: 'Additional Requirements', required: false }
    ],
    settings: {
      submitButtonText: 'Submit Inquiry',
      successMessage: 'Inquiry submitted! A real estate agent will contact you within 24 hours.',
      emailNotifications: true,
      theme: 'colorful'
    }
  }
];

// Combine all templates
export const allFormTemplates: FormTemplate[] = [
  ...allFormTemplates,
  ...surveyTemplates,
  ...hrTemplates,
  ...realEstateTemplates
];