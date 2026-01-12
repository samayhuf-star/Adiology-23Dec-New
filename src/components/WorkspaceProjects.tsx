import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  FolderOpen, Plus, Edit2, Trash2, Zap, Key, MinusCircle, 
  Shuffle, BarChart3, Settings, ChevronRight, X, Loader2,
  Palette, Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';

interface WorkspaceProject {
  id: string;
  userId: string;
  workspaceId: string | null;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  isArchived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  campaignCount: number;
  keywordCount: number;
  negativeCount: number;
  totalCount: number;
}

interface ProjectItem {
  id: string;
  projectId: string;
  itemType: string;
  itemId: string;
  itemName: string | null;
  itemMetadata: any;
  createdAt: string;
}

interface ProjectDetail extends WorkspaceProject {
  items: Record<string, ProjectItem[]>;
  counts: {
    campaigns: number;
    keywordLists: number;
    negativeKeywords: number;
    total: number;
  };
}

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
];

const MODULE_CONFIG = {
  campaign: { 
    label: 'Campaigns', 
    icon: Zap, 
    color: 'from-orange-400 to-orange-600',
    badge: 'Active'
  },
  keyword_list: { 
    label: 'Keyword Lists', 
    icon: Key, 
    color: 'from-amber-400 to-amber-600',
    badge: 'Active'
  },
  negative_keywords: { 
    label: 'Negative Keywords', 
    icon: MinusCircle, 
    color: 'from-rose-400 to-rose-600',
    badge: 'Active'
  },
  keyword_mixer: { 
    label: 'Keyword Mixer', 
    icon: Shuffle, 
    color: 'from-violet-400 to-violet-600',
    badge: 'New'
  },
  analytics: { 
    label: 'Analytics', 
    icon: BarChart3, 
    color: 'from-emerald-400 to-emerald-600',
    badge: 'Soon'
  },
  settings: { 
    label: 'Settings', 
    icon: Settings, 
    color: 'from-slate-400 to-slate-600',
    badge: 'Active'
  }
};

export function WorkspaceProjects() {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<WorkspaceProject | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch('/api/workspace-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
        if (data.data.length > 0 && !selectedProject) {
          fetchProjectDetail(data.data[0].id);
        }
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetail = async (projectId: string) => {
    try {
      setLoadingDetail(true);
      const token = await getToken();
      const response = await fetch(`/api/workspace-projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedProject(data.data);
      }
    } catch (err: any) {
      console.error('Error fetching project detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    try {
      setSaving(true);
      const token = await getToken();
      const response = await fetch('/api/workspace-projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          color: formColor
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateDialog(false);
        setFormName('');
        setFormDescription('');
        setFormColor('#6366f1');
        fetchProjects();
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingProject || !formName.trim()) return;
    try {
      setSaving(true);
      const token = await getToken();
      const response = await fetch(`/api/workspace-projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          color: formColor
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowEditDialog(false);
        setEditingProject(null);
        fetchProjects();
        if (selectedProject?.id === editingProject.id) {
          fetchProjectDetail(editingProject.id);
        }
      }
    } catch (err: any) {
      console.error('Error updating project:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingProject) return;
    try {
      setSaving(true);
      const token = await getToken();
      const response = await fetch(`/api/workspace-projects/${editingProject.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setShowDeleteDialog(false);
        setEditingProject(null);
        if (selectedProject?.id === editingProject.id) {
          setSelectedProject(null);
        }
        fetchProjects();
      }
    } catch (err: any) {
      console.error('Error deleting project:', err);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (project: WorkspaceProject) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDescription(project.description || '');
    setFormColor(project.color);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (project: WorkspaceProject) => {
    setEditingProject(project);
    setShowDeleteDialog(true);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
            <FolderOpen className="w-8 h-8" />
            Adiology Projects Organization
          </h1>
          <p className="text-indigo-200 mt-2">
            Organize campaigns, keywords, and settings by project. Filter everything in one click.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Projects Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-slate-600" />
                <h2 className="font-semibold text-slate-800">My Projects</h2>
              </div>

              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-3 rounded-xl cursor-pointer transition-all group ${
                      selectedProject?.id === project.id 
                        ? 'bg-indigo-100 border-2 border-indigo-400' 
                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                    onClick={() => fetchProjectDetail(project.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="font-medium text-slate-800">{project.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditDialog(project); }}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeleteDialog(project); }}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {project.campaignCount} campaigns • {project.keywordCount} keyword lists
                    </p>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Project
              </Button>
            </div>
          </div>

          {/* Project Detail */}
          <div className="col-span-12 md:col-span-9">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            ) : selectedProject ? (
              <div className="space-y-6">
                {/* Project Header */}
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedProject.name}</h2>
                  <p className="text-indigo-200">
                    {selectedProject.description || 'Organize all your Google Ads in one place'}
                  </p>
                </div>

                {/* Project Overview Stats */}
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-white font-semibold mb-4">Project Overview</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{selectedProject.counts.campaigns}</div>
                      <div className="text-pink-200 text-sm">Campaigns</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{selectedProject.counts.keywordLists}</div>
                      <div className="text-pink-200 text-sm">Keyword Lists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{selectedProject.counts.negativeKeywords}</div>
                      <div className="text-pink-200 text-sm">Negative Lists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{selectedProject.counts.total}</div>
                      <div className="text-pink-200 text-sm">Total Items</div>
                    </div>
                  </div>
                </div>

                {/* Connected Modules */}
                <div>
                  <h3 className="text-white font-semibold mb-4">Connected Modules</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(MODULE_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      const count = selectedProject.items[key]?.length || 0;
                      return (
                        <div
                          key={key}
                          className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-3`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-semibold text-slate-800">{config.label}</h4>
                          <p className="text-sm text-slate-500">
                            {count > 0 ? `${count} linked` : config.badge === 'Soon' ? 'Coming Q1' : 'No items yet'}
                          </p>
                          <Badge 
                            className={`mt-2 ${
                              config.badge === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                              config.badge === 'New' ? 'bg-violet-100 text-violet-700' :
                              'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {config.badge}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items List */}
                {selectedProject.items.campaign && selectedProject.items.campaign.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-xl">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      Campaigns in This Project
                    </h3>
                    <div className="space-y-3">
                      {selectedProject.items.campaign.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-l-4 border-orange-400"
                        >
                          <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-orange-500" />
                            <div>
                              <h4 className="font-medium text-slate-800">
                                {item.itemName || 'Unnamed Campaign'}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Created {new Date(item.createdAt).toLocaleDateString()}
                                {item.itemMetadata?.adGroupCount && ` • ${item.itemMetadata.adGroupCount} ad groups`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">View</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProject.counts.total === 0 && (
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
                    <FolderOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No items yet</h3>
                    <p className="text-indigo-200 mb-4">
                      Start by creating a campaign or keyword list and assign it to this project.
                    </p>
                    <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
                      Create Your First Campaign
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
                <FolderOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
                <p className="text-indigo-200 mb-4">
                  Create your first project to start organizing your campaigns and keywords.
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-white text-indigo-600 hover:bg-indigo-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Project Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., E-Commerce Store"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description (optional)</label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g., All campaigns for my online store"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color
              </label>
              <div className="flex gap-2 mt-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {formColor === color && (
                      <Check className="w-4 h-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formName.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Project Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., E-Commerce Store"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description (optional)</label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g., All campaigns for my online store"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color
              </label>
              <div className="flex gap-2 mt-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {formColor === color && (
                      <Check className="w-4 h-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving || !formName.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete <strong>{editingProject?.name}</strong>? 
              This will unlink all items from this project but won't delete the items themselves.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkspaceProjects;
