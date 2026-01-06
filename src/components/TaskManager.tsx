import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Plus, Check, Trash2, Edit2, FolderOpen, Calendar, Star, GripVertical,
  ChevronDown, ChevronRight, MoreHorizontal, Search, Filter, X, Inbox,
  CheckCircle2, Circle, Clock, AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Textarea } from './ui/textarea';

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  isToday: boolean;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  order: number;
  createdAt: string;
  completedAt: string | null;
}

interface Project {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
}

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'
];

export function TaskManager() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'done'>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['inbox']));
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: null as string | null, priority: 'medium' as 'low' | 'medium' | 'high', dueDate: '' });
  const [newProject, setNewProject] = useState({ name: '', color: PROJECT_COLORS[0] });
  
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [tasksRes, projectsRes] = await Promise.all([
        fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.data || []);
      }
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks/projects:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveTask = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          projectId: newTask.projectId,
          priority: newTask.priority,
          dueDate: newTask.dueDate || null,
        })
      });

      if (response.ok) {
        await fetchData();
        setIsTaskDialogOpen(false);
        setEditingTask(null);
        setNewTask({ title: '', description: '', projectId: null, priority: 'medium', dueDate: '' });
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isCompleted: !task.isCompleted,
          completedAt: !task.isCompleted ? new Date().toISOString() : null
        })
      });

      setTasks(tasks.map(t => 
        t.id === task.id 
          ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : null }
          : t
      ));
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const toggleTaskToday = async (task: Task) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isToday: !task.isToday })
      });

      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, isToday: !t.isToday } : t
      ));
    } catch (error) {
      console.error('Failed to toggle today:', error);
    }
  };

  const saveProject = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });

      if (response.ok) {
        await fetchData();
        setIsProjectDialogOpen(false);
        setEditingProject(null);
        setNewProject({ name: '', color: PROJECT_COLORS[0] });
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects(projects.filter(p => p.id !== projectId));
      setTasks(tasks.map(t => t.projectId === projectId ? { ...t, projectId: null } : t));
      if (selectedProject === projectId) setSelectedProject(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeFilter === 'today' && !task.isToday) return false;
    if (activeFilter === 'done' && !task.isCompleted) return false;
    if (activeFilter === 'all' && task.isCompleted) return false;
    if (selectedProject && task.projectId !== selectedProject) return false;
    if (selectedProject === null && activeFilter === 'all' && task.projectId !== null) {
      const showInbox = expandedProjects.has('inbox');
      if (!showInbox) return false;
    }
    return true;
  });

  const inboxTasks = tasks.filter(t => !t.projectId && !t.isCompleted);
  const todayTasks = tasks.filter(t => t.isToday && !t.isCompleted);
  const doneTasks = tasks.filter(t => t.isCompleted);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex(t => t.id === targetTaskId);
    
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, removed);
    
    setTasks(newTasks);
    setDraggedTaskId(null);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      priority: task.priority,
      dueDate: task.dueDate || ''
    });
    setIsTaskDialogOpen(true);
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({ name: project.name, color: project.color });
    setIsProjectDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Projects</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {/* Quick Filters */}
          <div className="space-y-1 mb-4">
            <button
              onClick={() => { setActiveFilter('all'); setSelectedProject(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeFilter === 'all' && !selectedProject
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Inbox</span>
              {inboxTasks.length > 0 && (
                <Badge variant="secondary" className="ml-auto">{inboxTasks.length}</Badge>
              )}
            </button>
            
            <button
              onClick={() => { setActiveFilter('today'); setSelectedProject(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeFilter === 'today'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Today</span>
              {todayTasks.length > 0 && (
                <Badge variant="secondary" className="ml-auto">{todayTasks.length}</Badge>
              )}
            </button>
            
            <button
              onClick={() => { setActiveFilter('done'); setSelectedProject(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeFilter === 'done'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done</span>
              {doneTasks.length > 0 && (
                <Badge variant="secondary" className="ml-auto">{doneTasks.length}</Badge>
              )}
            </button>
          </div>
          
          {/* Projects List */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-sm font-medium text-gray-400">Projects</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsProjectDialogOpen(true)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {projects.map(project => {
                const projectTasks = tasks.filter(t => t.projectId === project.id && !t.isCompleted);
                return (
                  <div key={project.id} className="group">
                    <button
                      onClick={() => {
                        setSelectedProject(project.id);
                        setActiveFilter('all');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        selectedProject === project.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="flex-1 text-left truncate">{project.name}</span>
                      {projectTasks.length > 0 && (
                        <Badge variant="secondary" className="text-xs">{projectTasks.length}</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditProject(project)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => deleteProject(project.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">
              {activeFilter === 'today' ? 'Today' : 
               activeFilter === 'done' ? 'Completed' :
               selectedProject ? projects.find(p => p.id === selectedProject)?.name : 'Inbox'}
            </h1>
            <Button
              onClick={() => {
                setNewTask({ ...newTask, projectId: selectedProject });
                setEditingTask(null);
                setIsTaskDialogOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>
        
        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <CheckCircle2 className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">No tasks here</p>
              <p className="text-sm">Add a task to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={e => handleDragStart(e, task.id)}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, task.id)}
                  className={`group flex items-start gap-3 p-4 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all cursor-grab active:cursor-grabbing ${
                    draggedTaskId === task.id ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  
                  <button
                    onClick={() => toggleTaskComplete(task)}
                    className="mt-1 flex-shrink-0"
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className={`w-5 h-5 ${getPriorityColor(task.priority)}`} />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${task.isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {task.title}
                      </span>
                      {task.isToday && !task.isCompleted && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {task.projectId && (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: projects.find(p => p.id === task.projectId)?.color }}
                          />
                          <span className="text-xs text-gray-400">
                            {projects.find(p => p.id === task.projectId)?.name}
                          </span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleTaskToday(task)}
                      className={`h-8 w-8 p-0 ${task.isToday ? 'text-yellow-500' : 'text-gray-400'}`}
                    >
                      <Star className={`w-4 h-4 ${task.isToday ? 'fill-yellow-500' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditTask(task)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTask(task.id)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Title</label>
              <Input
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Description</label>
              <Textarea
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Add details..."
                className="bg-gray-700 border-gray-600 text-white resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Project</label>
                <select
                  value={newTask.projectId || ''}
                  onChange={e => setNewTask({ ...newTask, projectId: e.target.value || null })}
                  className="w-full h-10 px-3 rounded-md bg-gray-700 border border-gray-600 text-white"
                >
                  <option value="">Inbox</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full h-10 px-3 rounded-md bg-gray-700 border border-gray-600 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Due Date</label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTask} disabled={!newTask.title.trim()}>
              {editingTask ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Name</label>
              <Input
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Project name"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewProject({ ...newProject, color })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newProject.color === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProject} disabled={!newProject.name.trim()}>
              {editingProject ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TaskManager;
