import React from 'react';
import { FIELD_TYPES } from '../utils/fieldTypes';
import { Button } from '../../../components/ui/button';

interface FieldPaletteProps {
  onAddField: (fieldType: string) => void;
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Fields</h3>
      {FIELD_TYPES.map(field => (
        <Button
          key={field.type}
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => onAddField(field.type)}
        >
          <span className="text-lg">{field.icon}</span>
          <span>{field.label}</span>
        </Button>
      ))}
    </div>
  );
}

