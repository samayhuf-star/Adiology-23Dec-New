import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  Search, 
  Filter, 
  Star, 
  Eye, 
  Download, 
  ArrowLeft,
  Grid3X3,
  List,
  Sparkles,
  Crown,
  Clock
} from 'lucide-react';
import { formCategories, formTemplates, FormTemplate } from '../data/formTemplates';
import { formApi } from '../services/formApi';

interface EnhancedTemplateGalleryProps {
  onFormCreated?: (form: any) => void;
  onBack?: () => void;
}

export function EnhancedTemplateGallery({ onFormCreated, onBack }: EnhancedTemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'newest'>('popularity');
  const [filteredTemplates, setFilteredTemplates] = useState<FormTemplate[]>(formTemplates);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Filter and sort templates
  useEffect(() => {
    let filtered = [...formTemplates];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Subcategory filter
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(template => template.subcategory === selectedSubcategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [selectedCategory, selectedSubcategory, searchQuery, sortBy]);

  const handleUseTemplate = async (template: FormTemplate) => {
    try {
      const response = await formApi.createFormFromTemplate({
        template_id: template.id,
        form_name: template.name,
      });

      if (response.success) {
        if (onFormCreated) {
          onFormCreated(response.data);
        }
        window.location.href = `#forms/${response.data.id}`;
      }
    } catch (error) {
      console.error('Error creating form from template:', error);
      alert('Failed to create form from template. Please try again.');
    }
  };

  const getCurrentCategory = () => {
    return formCategories.find(cat => cat.id === selectedCategory);
  };

  const getSubcategories = () => {
    const category = getCurrentCategory();
    return category?.subcategories || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Form Templates</h1>
                <p className="text-sm text-gray-500">Choose from 100+ professional templates</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedSubcategory('all');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    📋 All Templates
                  </button>
                  {formCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedSubcategory('all');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {category.icon} {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              {selectedCategory !== 'all' && getSubcategories().length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Subcategories</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedSubcategory('all')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedSubcategory === 'all'
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      All {getCurrentCategory()?.name}
                    </button>
                    {getSubcategories().map((subcategory) => (
                      <button
                        key={subcategory.id}
                        onClick={() => setSelectedSubcategory(subcategory.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedSubcategory === subcategory.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {subcategory.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort Options */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="popularity">Most Popular</option>
                  <option value="name">Name A-Z</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedCategory === 'all' ? 'All Templates' : getCurrentCategory()?.name}
                  {selectedSubcategory !== 'all' && (
                    <span className="text-gray-500"> / {getSubcategories().find(s => s.id === selectedSubcategory)?.name}</span>
                  )}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>

            {/* Templates Grid/List */}
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    viewMode={viewMode}
                    onUse={() => handleUseTemplate(template)}
                    onPreview={() => {
                      setSelectedTemplate(template);
                      setShowPreview(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <TemplatePreviewModal
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

// Template Card Component
interface TemplateCardProps {
  template: FormTemplate;
  viewMode: 'grid' | 'list';
  onUse: () => void;
  onPreview: () => void;
}

function TemplateCard({ template, viewMode, onUse, onPreview }: TemplateCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          <div 
            className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: template.color }}
          >
            {template.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{template.name}</h3>
              {template.isNew && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </Badge>
              )}
              {template.isPremium && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center">
                <Star className="w-3 h-3 mr-1 fill-current text-yellow-400" />
                {template.popularity}% match
              </div>
              <div>{template.fields.length} fields</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onPreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" onClick={onUse}>
              <Download className="w-4 h-4 mr-2" />
              Use Template
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundColor: template.color }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
            style={{ backgroundColor: template.color }}
          >
            {template.name.charAt(0)}
          </div>
        </div>
        <div className="absolute top-3 right-3 flex space-x-1">
          {template.isNew && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              New
            </Badge>
          )}
          {template.isPremium && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{template.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center">
            <Star className="w-3 h-3 mr-1 fill-current text-yellow-400" />
            {template.popularity}%
          </div>
          <div>{template.fields.length} fields</div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onPreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" className="flex-1" onClick={onUse}>
            Use Template
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Template Preview Modal Component
interface TemplatePreviewModalProps {
  template: FormTemplate;
  onClose: () => void;
  onUse: () => void;
}

function TemplatePreviewModal({ template, onClose, onUse }: TemplatePreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Form Fields Preview:</h3>
            {template.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {field.type}
                  </Badge>
                </div>
                {field.type === 'textarea' ? (
                  <textarea 
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    disabled
                  />
                ) : field.type === 'select' ? (
                  <select className="w-full px-3 py-2 border rounded-md" disabled>
                    <option>Select an option...</option>
                    {field.options?.map((option, i) => (
                      <option key={i}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onUse}>
            <Download className="w-4 h-4 mr-2" />
            Use This Template
          </Button>
        </div>
      </div>
    </div>
  );
}