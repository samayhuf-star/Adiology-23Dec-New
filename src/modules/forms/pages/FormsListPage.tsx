import React, { useState, useEffect } from 'react';
import { formApi } from '../services/formApi';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Plus, FileText, Trash2, Eye, Edit } from 'lucide-react';

export function FormsListPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await formApi.getUserForms();
      if (response.success) {
        setForms(response.data);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    if (!formName.trim()) return;
    
    try {
      const response = await formApi.createForm({
        name: formName,
        description: formDescription || undefined,
      });
      
      if (response.success) {
        setShowCreateModal(false);
        setFormName('');
        setFormDescription('');
        loadForms();
        // Navigate to builder
        window.location.href = `#forms/${response.data.id}`;
      }
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;
    
    try {
      const response = await formApi.deleteForm(formId);
      if (response.success) {
        loadForms();
      }
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Forms</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Form
        </Button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Form</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Form Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Contact Form"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="A simple contact form"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateForm}>Create</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {forms.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
          <p className="text-gray-500 mb-4">Create your first form to start collecting submissions</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Form
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{form.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteForm(form.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
              {form.description && (
                <p className="text-sm text-gray-600 mb-3">{form.description}</p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Status: {form.status}</span>
                <span>{form.submission_count || 0} submissions</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    window.location.href = `#forms/${form.id}`;
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    window.location.href = `#forms/${form.id}/submissions`;
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

