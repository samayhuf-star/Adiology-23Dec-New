export const FIELD_TYPES = [
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'email', label: 'Email', icon: '✉️' },
  { type: 'phone', label: 'Phone', icon: '📱' },
  { type: 'number', label: 'Number', icon: '🔢' },
  { type: 'textarea', label: 'Long Text', icon: '📄' },
  { type: 'select', label: 'Dropdown', icon: '⬇️' },
  { type: 'radio', label: 'Radio', icon: '⭕' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
] as const;

export type FieldType = typeof FIELD_TYPES[number]['type'];

