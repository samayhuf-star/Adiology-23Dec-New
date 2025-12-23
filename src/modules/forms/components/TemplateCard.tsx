import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

interface TemplateCardProps {
  template: {
    id: string;
    template_id: string;
    name: string;
    description?: string;
    category: string;
    thumbnail_url?: string;
    use_count?: number;
    rating?: number;
  };
  onUse: () => void;
  onPreview: () => void;
}

export function TemplateCard({ template, onUse, onPreview }: TemplateCardProps) {
  return (
    <Card className="template-card group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        <div className="template-image h-48 bg-gray-100 overflow-hidden relative">
          {template.thumbnail_url ? (
            <img
              src={template.thumbnail_url}
              alt={template.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://via.placeholder.com/300x200/667eea/ffffff?text=${encodeURIComponent(template.name)}`;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 text-white text-2xl font-bold">
              {template.name.charAt(0)}
            </div>
          )}
          <div className="template-overlay absolute inset-0 bg-purple-600/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              👁️ Preview
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUse();
              }}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              ✨ Use Template
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
        {template.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span className="px-2 py-1 bg-gray-100 rounded-full text-purple-600 font-medium">
            {template.category}
          </span>
          {template.use_count !== undefined && (
            <span className="flex items-center gap-1">
              👥 {template.use_count} uses
            </span>
          )}
        </div>

        {template.rating && template.rating > 0 && (
          <div className="text-xs text-yellow-500">
            {'⭐'.repeat(Math.round(template.rating))} ({template.rating.toFixed(1)})
          </div>
        )}
      </div>
    </Card>
  );
}

