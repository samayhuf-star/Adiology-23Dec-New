import React, { useState, useEffect } from 'react';
import { formApi } from '../services/formApi';
import { TemplateCard } from './TemplateCard';
import { TemplatePreview } from './TemplatePreview';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

interface TemplateGalleryProps {
  onFormCreated?: (form: any) => void;
}

const categories = [
  { id: 'all', name: 'All Templates' },
  { id: 'lead_generation', name: '🎯 Lead Generation' },
  { id: 'feedback', name: '💬 Customer Feedback' },
  { id: 'events', name: '📅 Events & Registrations' },
  { id: 'surveys', name: '📊 Surveys & Research' },
];

export function TemplateGallery({ onFormCreated }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter((t) => t.category === activeCategory));
    }
  }, [activeCategory, templates]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await formApi.getAllTemplates({ limit: 100 });
      if (response.success) {
        setTemplates(response.data);
        setFilteredTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery(''); // Clear search when changing category
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      // Reset to category filter
      if (activeCategory === 'all') {
        setFilteredTemplates(templates);
      } else {
        setFilteredTemplates(templates.filter((t) => t.category === activeCategory));
      }
      return;
    }

    try {
      const response = await formApi.searchTemplates(query);
      if (response.success) {
        setFilteredTemplates(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleUseTemplate = async (template: any) => {
    try {
      const response = await formApi.createFormFromTemplate({
        template_id: template.id || template.template_id,
        form_name: template.name,
      });

      if (response.success) {
        if (onFormCreated) {
          onFormCreated(response.data);
        }
        // Navigate to form builder
        window.location.href = `#forms/${response.data.id}`;
      }
    } catch (error) {
      console.error('Error creating form from template:', error);
      alert('Failed to create form from template. Please try again.');
    }
  };

  const handlePreview = async (template: any) => {
    try {
      // Fetch full template details including fields
      const response = await formApi.getTemplate(template.id || template.template_id);
      if (response.success) {
        setSelectedTemplate(response.data);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error loading template details:', error);
      alert('Failed to load template preview.');
    }
  };

  return (
    <div className="template-gallery min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📋 Form Templates</h1>
          <p className="text-white/90 text-lg">Choose from 20+ pre-designed templates or start blank</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <Input
            type="text"
            placeholder="Search templates... (lead, feedback, survey, etc)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-12 text-lg bg-white"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'secondary'}
              onClick={() => handleCategoryChange(cat.id)}
              className={`${
                activeCategory === cat.id
                  ? 'bg-white text-purple-600 hover:bg-gray-100'
                  : 'bg-white/20 text-white hover:bg-white/30 border-white/30'
              }`}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-white text-xl">Loading templates...</div>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-white font-medium">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white text-lg">
                  No templates found. Try a different search or category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleUseTemplate(template)}
                    onPreview={() => handlePreview(template)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => {
            setShowPreview(false);
            setSelectedTemplate(null);
          }}
          onUse={() => {
            handleUseTemplate(selectedTemplate);
            setShowPreview(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}

