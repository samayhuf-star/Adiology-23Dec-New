import { useState } from 'react';
import { Plus, Trash2, Edit2, Eye, X, Save, Palette, Type, Layout } from 'lucide-react';
import { TemplateData } from '../utils/savedWebsites';

interface Section {
  id: string;
  type: 'hero' | 'features' | 'services' | 'testimonials' | 'team' | 'faq' | 'pricing' | 'gallery' | 'blog' | 'partners' | 'cta' | 'contact' | 'about';
  name: string;
  data: any;
}

interface SectionsEditorProps {
  templateData: TemplateData;
  onUpdate: (html: string, css: string) => void;
  onSave: () => void;
}

const SECTION_TYPES = [
  { type: 'hero', name: 'Hero Section', color: 'bg-blue-50', icon: '🎯' },
  { type: 'features', name: 'Features', color: 'bg-green-50', icon: '⭐' },
  { type: 'services', name: 'Services', color: 'bg-purple-50', icon: '🔧' },
  { type: 'testimonials', name: 'Testimonials', color: 'bg-yellow-50', icon: '💬' },
  { type: 'team', name: 'Team', color: 'bg-pink-50', icon: '👥' },
  { type: 'faq', name: 'FAQ', color: 'bg-orange-50', icon: '❓' },
  { type: 'pricing', name: 'Pricing', color: 'bg-red-50', icon: '💰' },
  { type: 'gallery', name: 'Gallery', color: 'bg-indigo-50', icon: '🖼️' },
  { type: 'blog', name: 'Blog', color: 'bg-cyan-50', icon: '📝' },
  { type: 'partners', name: 'Partners', color: 'bg-lime-50', icon: '🤝' },
  { type: 'cta', name: 'Call to Action', color: 'bg-amber-50', icon: '🚀' },
  { type: 'contact', name: 'Contact', color: 'bg-teal-50', icon: '📧' },
  { type: 'about', name: 'About Us', color: 'bg-fuchsia-50', icon: '📖' },
];

export default function SectionsEditor({ templateData, onUpdate, onSave }: SectionsEditorProps) {
  const [sections, setSections] = useState<Section[]>(buildSectionsFromTemplate(templateData));
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [preview, setPreview] = useState(true);

  function buildSectionsFromTemplate(data: TemplateData): Section[] {
    const sects: Section[] = [];
    
    if (data.hero) {
      sects.push({
        id: 'hero',
        type: 'hero',
        name: 'Hero',
        data: data.hero
      });
    }
    
    if (data.features) {
      sects.push({
        id: 'features',
        type: 'features',
        name: 'Features',
        data: data.features
      });
    }
    
    if (data.services) {
      sects.push({
        id: 'services',
        type: 'services',
        name: 'Services',
        data: data.services
      });
    }
    
    if (data.testimonials) {
      sects.push({
        id: 'testimonials',
        type: 'testimonials',
        name: 'Testimonials',
        data: data.testimonials
      });
    }
    
    if (data.cta) {
      sects.push({
        id: 'cta',
        type: 'cta',
        name: 'CTA',
        data: data.cta
      });
    }
    
    if (data.contact) {
      sects.push({
        id: 'contact',
        type: 'contact',
        name: 'Contact',
        data: data.contact
      });
    }

    return sects;
  }

  const addSection = (type: string) => {
    const newSection: Section = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      name: SECTION_TYPES.find(s => s.type === type)?.name || type,
      data: {}
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, data: any) => {
    setSections(sections.map(s => s.id === id ? { ...s, data } : s));
  };

  const renderSectionPreview = (section: Section) => {
    const sectionType = SECTION_TYPES.find(s => s.type === section.type);
    const bgColor = sectionType?.color || 'bg-gray-50';
    
    return (
      <div key={section.id} className={`${bgColor} p-6 rounded-lg border-2 border-dashed border-gray-300 mb-4`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sectionType?.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{section.name}</h3>
              <p className="text-xs text-gray-600">{section.type}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingSection(section)}
              className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeSection(section.id)}
              className="p-2 hover:bg-white rounded-lg transition-colors text-red-600"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {section.data.heading && (
          <div className="mb-3">
            <h4 className="font-medium text-gray-900">{section.data.heading}</h4>
            {section.data.subheading && (
              <p className="text-sm text-gray-600">{section.data.subheading}</p>
            )}
          </div>
        )}
        
        {section.data.items && (
          <div className="text-xs text-gray-600">
            {section.data.items.length} items
          </div>
        )}
      </div>
    );
  };

  const renderEditor = () => {
    if (!editingSection) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Edit {editingSection.name}</h2>
            <button
              onClick={() => setEditingSection(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Heading */}
            <div>
              <label className="block text-sm font-medium mb-1">Section Heading</label>
              <input
                type="text"
                value={editingSection.data.heading || ''}
                onChange={(e) => updateSection(editingSection.id, {
                  ...editingSection.data,
                  heading: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Section title"
              />
            </div>

            {/* Subheading */}
            <div>
              <label className="block text-sm font-medium mb-1">Subheading</label>
              <input
                type="text"
                value={editingSection.data.subheading || ''}
                onChange={(e) => updateSection(editingSection.id, {
                  ...editingSection.data,
                  subheading: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Optional subheading"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={editingSection.data.description || ''}
                onChange={(e) => updateSection(editingSection.id, {
                  ...editingSection.data,
                  description: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
                placeholder="Optional description or content"
              />
            </div>

            {/* Text content (for CTA, etc) */}
            <div>
              <label className="block text-sm font-medium mb-1">Text Content</label>
              <textarea
                value={editingSection.data.text || ''}
                onChange={(e) => updateSection(editingSection.id, {
                  ...editingSection.data,
                  text: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
                placeholder="Main text for the section"
              />
            </div>

            {/* Color customization */}
            <div>
              <label className="block text-sm font-medium mb-1">Background Color</label>
              <div className="flex gap-2">
                {['white', 'gray-50', 'gray-100', 'blue-50', 'green-50', 'purple-50'].map(color => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-lg border-2 ${
                      (editingSection.data.bgColor === color) ? 'border-blue-500' : 'border-gray-200'
                    } bg-${color}`}
                    onClick={() => updateSection(editingSection.id, {
                      ...editingSection.data,
                      bgColor: color
                    })}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setEditingSection(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setEditingSection(null);
                  onSave();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Layout className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold">Sections Editor</h2>
          <span className="text-xs text-gray-500 ml-2">{sections.length} sections</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
          >
            <Eye className="w-4 h-4" />
            {preview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          {/* Sections List */}
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Current Sections</h3>
            {sections.length === 0 ? (
              <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600">
                No sections added yet. Click "Add Section" below to get started.
              </div>
            ) : (
              <div>
                {sections.map(renderSectionPreview)}
              </div>
            )}
          </div>

          {/* Add Section Buttons */}
          <div>
            <h3 className="font-semibold mb-4">Add Sections</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {SECTION_TYPES.map(sectionType => (
                <button
                  key={sectionType.type}
                  onClick={() => addSection(sectionType.type)}
                  className={`${sectionType.color} p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors text-center`}
                >
                  <div className="text-2xl mb-2">{sectionType.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{sectionType.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {renderEditor()}
    </div>
  );
}
