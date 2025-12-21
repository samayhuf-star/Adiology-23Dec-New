import { useState, useEffect } from 'react';
import { 
  Phone, Plus, Edit2, Trash2, Save, X, ChevronRight, ChevronDown,
  Percent, Target, Hash, PhoneCall, RefreshCw, AlertCircle, CheckCircle2,
  Folder, Settings2, ArrowRight, CreditCard
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '../utils/supabase/client';
import { CallForwardingBilling } from './CallForwardingBilling';

interface Target {
  id: string;
  tracking_number_id: string;
  target_number: string;
  name: string;
  percentage: number;
  priority: number;
  status: string;
}

interface TrackingNumber {
  id: string;
  project_id: string;
  phone_number: string;
  number_type: 'DID' | 'TFN';
  name: string;
  skyswitch_id: string;
  status: string;
  targets: Target[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  tracking_numbers_count: number;
  created_at: string;
}

type TabType = 'numbers' | 'billing';

export function CallForwarding() {
  const [activeTab, setActiveTab] = useState<TabType>('numbers');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [trackingNumbers, setTrackingNumbers] = useState<TrackingNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [expandedNumbers, setExpandedNumbers] = useState<Set<string>>(new Set());
  const [addingTarget, setAddingTarget] = useState<string | null>(null);
  const [newTarget, setNewTarget] = useState({ number: '', name: '', percentage: 100 });
  const [addingTrackingNumber, setAddingTrackingNumber] = useState(false);
  const [newTrackingNumber, setNewTrackingNumber] = useState({ number: '', name: '', type: 'DID' as 'DID' | 'TFN' });
  const [syncing, setSyncing] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/call-forwarding/projects', { headers });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setProjects(data.projects || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/call-forwarding/projects/${projectId}`, { headers });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setSelectedProject(data.project);
        setTrackingNumbers(data.trackingNumbers || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/call-forwarding/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newProjectName })
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setProjects([data.project, ...projects]);
        setNewProjectName('');
        setShowNewProject(false);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateProjectName = async (projectId: string) => {
    if (!editingProjectName.trim()) return;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/call-forwarding/projects/${projectId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: editingProjectName })
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setProjects(projects.map(p => p.id === projectId ? { ...p, name: editingProjectName } : p));
        if (selectedProject?.id === projectId) {
          setSelectedProject({ ...selectedProject, name: editingProjectName });
        }
        setEditingProject(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? All tracking numbers and targets will be removed.')) return;
    
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/call-forwarding/projects/${projectId}`, {
        method: 'DELETE',
        headers
      });
      
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setTrackingNumbers([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addTrackingNumber = async () => {
    if (!selectedProject || !newTrackingNumber.number.trim()) return;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/call-forwarding/projects/${selectedProject.id}/tracking-numbers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone_number: newTrackingNumber.number,
          name: newTrackingNumber.name || newTrackingNumber.number,
          number_type: newTrackingNumber.type
        })
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTrackingNumbers([{ ...data.trackingNumber, targets: [] }, ...trackingNumbers]);
        setNewTrackingNumber({ number: '', name: '', type: 'DID' });
        setAddingTrackingNumber(false);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTrackingNumber = async (trackingId: string) => {
    if (!confirm('Delete this tracking number and all its targets?')) return;
    
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/call-forwarding/tracking-numbers/${trackingId}`, {
        method: 'DELETE',
        headers
      });
      
      setTrackingNumbers(trackingNumbers.filter(t => t.id !== trackingId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addTarget = async (trackingId: string) => {
    if (!newTarget.number.trim()) return;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/call-forwarding/tracking-numbers/${trackingId}/targets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          target_number: newTarget.number,
          name: newTarget.name || newTarget.number,
          percentage: newTarget.percentage
        })
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTrackingNumbers(trackingNumbers.map(t => {
          if (t.id === trackingId) {
            return { ...t, targets: [...t.targets, data.target] };
          }
          return t;
        }));
        setNewTarget({ number: '', name: '', percentage: 100 });
        setAddingTarget(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateTarget = async (targetId: string, updates: Partial<Target>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/call-forwarding/targets/${targetId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTrackingNumbers(trackingNumbers.map(t => ({
          ...t,
          targets: t.targets.map(tg => tg.id === targetId ? data.target : tg)
        })));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTarget = async (targetId: string) => {
    if (!confirm('Delete this forwarding target?')) return;
    
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/call-forwarding/targets/${targetId}`, {
        method: 'DELETE',
        headers
      });
      
      setTrackingNumbers(trackingNumbers.map(t => ({
        ...t,
        targets: t.targets.filter(tg => tg.id !== targetId)
      })));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const syncToSkySwitch = async (trackingId: string) => {
    try {
      setSyncing(trackingId);
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/call-forwarding/tracking-numbers/${trackingId}/sync`, {
        method: 'POST',
        headers
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(null);
    }
  };

  const toggleNumberExpanded = (id: string) => {
    setExpandedNumbers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTotalPercentage = (targets: Target[]) => {
    return targets.reduce((sum, t) => sum + (t.percentage || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Call Forwarding</h1>
        <p className="text-slate-600 mt-1">Manage call routing with percentage-based distribution</p>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <nav className="flex gap-4 sm:gap-8">
          <button
            onClick={() => setActiveTab('numbers')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'numbers'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Phone className="w-4 h-4" />
            Numbers
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'billing'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Billing
          </button>
        </nav>
      </div>

      {activeTab === 'billing' ? (
        <CallForwardingBilling />
      ) : (
        <>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Projects</h2>
              <Button
                size="sm"
                onClick={() => setShowNewProject(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>

            {showNewProject && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                <Input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createProject()}
                  className="mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={createProject} className="bg-indigo-600 hover:bg-indigo-700">
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowNewProject(false); setNewProjectName(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No projects yet</p>
                  <p className="text-sm">Create your first project to get started</p>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProject?.id === project.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                    onClick={() => fetchProjectDetails(project.id)}
                  >
                    {editingProject === project.id ? (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editingProjectName}
                          onChange={(e) => setEditingProjectName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && updateProjectName(project.id)}
                          className="h-8"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => updateProjectName(project.id)}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingProject(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-indigo-500" />
                          <span className="font-medium text-slate-800">{project.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500 mr-2">
                            {project.tracking_numbers_count || 0} numbers
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProject(project.id);
                              setEditingProjectName(project.name);
                            }}
                            className="p-1 hover:bg-indigo-100 rounded"
                          >
                            <Edit2 className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(project.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8">
          {selectedProject ? (
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedProject.name}</h2>
                  <p className="text-sm text-slate-500">Configure tracking numbers and forwarding targets</p>
                </div>
                <Button
                  onClick={() => setAddingTrackingNumber(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tracking Number
                </Button>
              </div>

              {addingTrackingNumber && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-3">Add Tracking Number</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="+1234567890"
                        value={newTrackingNumber.number}
                        onChange={(e) => setNewTrackingNumber({ ...newTrackingNumber, number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Name (optional)</Label>
                      <Input
                        placeholder="Main Line"
                        value={newTrackingNumber.name}
                        onChange={(e) => setNewTrackingNumber({ ...newTrackingNumber, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                        value={newTrackingNumber.type}
                        onChange={(e) => setNewTrackingNumber({ ...newTrackingNumber, type: e.target.value as 'DID' | 'TFN' })}
                      >
                        <option value="DID">DID (Direct Inward Dial)</option>
                        <option value="TFN">TFN (Toll-Free Number)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={addTrackingNumber} className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Number
                    </Button>
                    <Button variant="outline" onClick={() => { setAddingTrackingNumber(false); setNewTrackingNumber({ number: '', name: '', type: 'DID' }); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {trackingNumbers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Phone className="w-16 h-16 mx-auto mb-3 opacity-40" />
                    <p className="text-lg">No tracking numbers yet</p>
                    <p className="text-sm">Add a tracking number to start routing calls</p>
                  </div>
                ) : (
                  trackingNumbers.map((tn) => {
                    const isExpanded = expandedNumbers.has(tn.id);
                    const totalPercentage = getTotalPercentage(tn.targets);
                    const isValid = totalPercentage === 100 || tn.targets.length === 0;
                    
                    return (
                      <div key={tn.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div
                          className="p-4 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                          onClick={() => toggleNumberExpanded(tn.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-400" />
                            )}
                            <div className={`p-2 rounded-lg ${tn.number_type === 'TFN' ? 'bg-green-100' : 'bg-blue-100'}`}>
                              <Phone className={`w-5 h-5 ${tn.number_type === 'TFN' ? 'text-green-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{tn.name}</div>
                              <div className="text-sm text-slate-500 flex items-center gap-2">
                                <span>{tn.phone_number}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  tn.number_type === 'TFN' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {tn.number_type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <div className="text-sm text-slate-500">{tn.targets.length} targets</div>
                              <div className={`text-xs ${isValid ? 'text-green-600' : 'text-amber-600'}`}>
                                {totalPercentage}% allocated
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                syncToSkySwitch(tn.id);
                              }}
                              disabled={syncing === tn.id}
                              className="p-2 hover:bg-indigo-100 rounded-lg disabled:opacity-50"
                              title="Sync to SkySwitch"
                            >
                              <RefreshCw className={`w-4 h-4 text-indigo-500 ${syncing === tn.id ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTrackingNumber(tn.id);
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-slate-700">Forwarding Targets</h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAddingTarget(tn.id)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Target
                              </Button>
                            </div>

                            {!isValid && (
                              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>Percentages should add up to 100% (currently {totalPercentage}%)</span>
                              </div>
                            )}

                            {addingTarget === tn.id && (
                              <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <Label className="text-xs">Phone Number</Label>
                                    <Input
                                      placeholder="+1234567890"
                                      value={newTarget.number}
                                      onChange={(e) => setNewTarget({ ...newTarget, number: e.target.value })}
                                      className="h-9"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Name</Label>
                                    <Input
                                      placeholder="Sales Team"
                                      value={newTarget.name}
                                      onChange={(e) => setNewTarget({ ...newTarget, name: e.target.value })}
                                      className="h-9"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Call %</Label>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newTarget.percentage}
                                        onChange={(e) => setNewTarget({ ...newTarget, percentage: parseInt(e.target.value) || 0 })}
                                        className="h-9"
                                      />
                                      <span className="text-slate-500">%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <Button size="sm" onClick={() => addTarget(tn.id)} className="bg-indigo-600 hover:bg-indigo-700">
                                    Add
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setAddingTarget(null); setNewTarget({ number: '', name: '', percentage: 100 }); }}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {tn.targets.length === 0 ? (
                              <div className="text-center py-6 text-slate-500">
                                <Target className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No forwarding targets yet</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {tn.targets.map((target, idx) => (
                                  <div
                                    key={target.id}
                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200"
                                  >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-medium text-sm">
                                      {idx + 1}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-slate-800 truncate">{target.name}</div>
                                      <div className="text-sm text-slate-500">{target.target_number}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-lg">
                                        <Percent className="w-3 h-3 text-indigo-500" />
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={target.percentage}
                                          onChange={(e) => updateTarget(target.id, { percentage: parseInt(e.target.value) || 0 })}
                                          className="w-12 bg-transparent border-none text-center font-medium text-indigo-700 focus:outline-none"
                                        />
                                      </div>
                                      <button
                                        onClick={() => deleteTarget(target.id)}
                                        className="p-1.5 hover:bg-red-100 rounded"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {tn.targets.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-slate-200">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">Total Distribution</span>
                                  <div className="flex items-center gap-2">
                                    {isValid ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-amber-500" />
                                    )}
                                    <span className={`font-medium ${isValid ? 'text-green-600' : 'text-amber-600'}`}>
                                      {totalPercentage}%
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  {tn.targets.map((target, idx) => {
                                    const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500'];
                                    return (
                                      <div
                                        key={target.id}
                                        className={`h-full ${colors[idx % colors.length]} inline-block`}
                                        style={{ width: `${Math.min(target.percentage, 100)}%` }}
                                        title={`${target.name}: ${target.percentage}%`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <Settings2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Select a Project</h3>
              <p className="text-slate-500 mb-4">Choose a project from the list or create a new one to manage call forwarding</p>
              <Button onClick={() => setShowNewProject(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </Card>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
