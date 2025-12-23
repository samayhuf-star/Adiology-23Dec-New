import React, { useState } from 'react';
import { useFormBuilder } from '../hooks/useFormBuilder';
import { FieldPalette } from './FieldPalette';
import { FormField } from './FormField';
import { FormPreview } from './FormPreview';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { X, Eye, Edit, ArrowUp, ArrowDown } from 'lucide-react';

interface FormBuilderProps {
  formId: string;
}

export function FormBuilder({ formId }: FormBuilderProps) {
  const { form, fields, loading, addField, updateField, deleteField, reorderFields } = useFormBuilder(formId);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleAddField = async (fieldType: string) => {
    try {
      await addField({
        field_type: fieldType,
        label: `New ${fieldType}`,
        placeholder: '',
        required: false,
        position: fields.length + 1,
      });
    } catch (error) {
      console.error('Error adding field:', error);
    }
  };

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newFields.length) return;
    
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    
    try {
      await reorderFields(newFields);
    } catch (error) {
      console.error('Error reordering fields:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h2 className="text-xl font-bold">{form?.name || 'Untitled Form'}</h2>
        <Button
          variant="outline"
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </>
          )}
        </Button>
      </div>

      {previewMode ? (
        <div className="flex-1 overflow-auto p-8">
          <FormPreview form={form} fields={fields} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Field Palette */}
          <div className="w-64 border-r bg-gray-50 overflow-y-auto">
            <FieldPalette onAddField={handleAddField} />
          </div>

          {/* Form Canvas */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <p>Click a field type to add it to your form</p>
                </div>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedField?.id === field.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedField(field)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <FormField field={field} />
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveField(index, 'up');
                          }}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveField(index, 'down');
                          }}
                          disabled={index === fields.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteField(field.id);
                            if (selectedField?.id === field.id) {
                              setSelectedField(null);
                            }
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Field Editor */}
          <div className="w-80 border-l bg-gray-50 overflow-y-auto p-4">
            {selectedField ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Edit Field</h3>
                
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={selectedField.label}
                    onChange={(e) => {
                      const updated = { ...selectedField, label: e.target.value };
                      setSelectedField(updated);
                      updateField(selectedField.id, { label: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Placeholder</Label>
                  <Input
                    value={selectedField.placeholder || ''}
                    onChange={(e) => {
                      const updated = { ...selectedField, placeholder: e.target.value };
                      setSelectedField(updated);
                      updateField(selectedField.id, { placeholder: e.target.value });
                    }}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={selectedField.required}
                    onCheckedChange={(checked) => {
                      const updated = { ...selectedField, required: checked as boolean };
                      setSelectedField(updated);
                      updateField(selectedField.id, { required: checked as boolean });
                    }}
                  />
                  <Label htmlFor="required">Required</Label>
                </div>

                {['select', 'radio', 'checkbox'].includes(selectedField.field_type) && (
                  <div className="space-y-2">
                    <Label>Options (one per line)</Label>
                    <Textarea
                      value={selectedField.options?.join('\n') || ''}
                      onChange={(e) => {
                        const options = e.target.value.split('\n').filter(o => o.trim());
                        const updated = { ...selectedField, options };
                        setSelectedField(updated);
                        updateField(selectedField.id, { options });
                      }}
                      rows={6}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16">
                <p>Select a field to edit</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

