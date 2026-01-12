import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Tag, Plus, Check, X, Search, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface ProjectTagSelectorProps {
  itemType: string;
  itemId: string;
  itemName: string;
  itemMetadata?: Record<string, any>;
  linkedProjects?: { id: string; name: string; color: string }[];
  onProjectsChange?: (projects: { id: string; name: string; color: string }[]) => void;
  size?: 'sm' | 'md';
}

const PROJECT_COLORS = [
  '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6',
  '#6366F1', '#14B8A6', '#F97316', '#EF4444', '#84CC16'
];

export function ProjectTagSelector({
  itemType,
  itemId,
  itemName,
  itemMetadata,
  linkedProjects = [],
  onProjectsChange,
  size = 'md'
}: ProjectTagSelectorProps) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>(linkedProjects);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedProjects(linkedProjects);
  }, [linkedProjects]);

  useEffect(() => {
    if (open) {
      fetchProjects();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

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
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = async (project: Project) => {
    const isSelected = selectedProjects.some(p => p.id === project.id);
    
    try {
      setLinking(project.id);
      const token = await getToken();
      
      if (isSelected) {
        const response = await fetch(`/api/workspace-projects/${project.id}/items/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          const updated = selectedProjects.filter(p => p.id !== project.id);
          setSelectedProjects(updated);
          onProjectsChange?.(updated);
        }
      } else {
        const response = await fetch(`/api/workspace-projects/${project.id}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            itemType,
            itemId,
            itemName,
            ...(itemMetadata && { itemMetadata })
          })
        });
        const data = await response.json();
        if (data.success) {
          const updated = [...selectedProjects, project];
          setSelectedProjects(updated);
          onProjectsChange?.(updated);
        }
      }
    } catch (err) {
      console.error('Error toggling project:', err);
    } finally {
      setLinking(null);
    }
  };

  const createAndLink = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setCreating(true);
      const token = await getToken();
      const randomColor = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
      
      const createResponse = await fetch('/api/workspace-projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: searchQuery.trim(),
          color: randomColor
        })
      });
      const createData = await createResponse.json();
      
      if (createData.success) {
        const newProject = createData.data;
        setProjects(prev => [...prev, newProject]);
        
        const linkResponse = await fetch(`/api/workspace-projects/${newProject.id}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            itemType,
            itemId,
            itemName,
            ...(itemMetadata && { itemMetadata })
          })
        });
        const linkData = await linkResponse.json();
        
        if (linkData.success) {
          const updated = [...selectedProjects, newProject];
          setSelectedProjects(updated);
          onProjectsChange?.(updated);
        }
        
        setSearchQuery('');
      }
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setCreating(false);
    }
  };

  const removeProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    await toggleProject(project);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showCreateOption = searchQuery.trim() && 
    !filteredProjects.some(p => p.name.toLowerCase() === searchQuery.toLowerCase().trim());

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const tagSize = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {selectedProjects.map(project => (
        <span
          key={project.id}
          className={`inline-flex items-center gap-1 rounded-full border ${tagSize}`}
          style={{ 
            backgroundColor: `${project.color}15`,
            borderColor: `${project.color}40`,
            color: project.color
          }}
        >
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: project.color }}
          />
          <span className="font-medium">{project.name}</span>
          <button
            onClick={(e) => removeProject(e, project)}
            className="ml-0.5 hover:opacity-70 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${size === 'sm' ? 'h-6 px-1.5' : 'h-7 px-2'} text-slate-500 hover:text-slate-700 hover:bg-slate-100`}
          >
            <Tag className={iconSize} />
            {selectedProjects.length === 0 && (
              <span className={`ml-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>+ Add project</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              ref={inputRef}
              placeholder="Search or create..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && showCreateOption) {
                  createAndLink();
                }
              }}
              className="pl-8 h-9"
            />
          </div>
          
          <div className="mt-2 max-h-48 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                {showCreateOption && (
                  <button
                    onClick={createAndLink}
                    disabled={creating}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 text-indigo-500" />
                    )}
                    <span>
                      + Add "<span className="font-medium">{searchQuery}</span>" to projects
                    </span>
                  </button>
                )}
                
                {filteredProjects.length === 0 && !showCreateOption ? (
                  <p className="text-sm text-slate-500 text-center py-3">
                    Type to add a new project
                  </p>
                ) : (
                  filteredProjects.map(project => {
                    const isSelected = selectedProjects.some(p => p.id === project.id);
                    const isLinking = linking === project.id;
                    
                    return (
                      <button
                        key={project.id}
                        onClick={() => toggleProject(project)}
                        disabled={isLinking}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-left hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          <span>{project.name}</span>
                        </div>
                        {isLinking ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : isSelected ? (
                          <Check className="w-4 h-4 text-indigo-500" />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
