/**
 * Workspace Performance Monitor Component
 * Tracks and displays workspace performance metrics for optimization
 */

import React, { useState, useEffect } from 'react';
import { Activity, Clock, Database, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { WorkspaceCacheManager } from '../utils/workspace-cache';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface PerformanceMetrics {
  cacheHitRate: number;
  averageLoadTime: number;
  totalWorkspaces: number;
  activeUsers: number;
  lastUpdated: Date;
  cacheSize: number;
  maxCacheSize: number;
}

export const WorkspacePerformanceMonitor: React.FC = () => {
  const { workspaces, isLoading, lastUpdated } = useWorkspace();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loadTimes, setLoadTimes] = useState<number[]>([]);

  // Track workspace loading performance
  useEffect(() => {
    const startTime = performance.now();
    
    if (!isLoading && workspaces.length > 0) {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      setLoadTimes(prev => [...prev.slice(-9), loadTime]); // Keep last 10 measurements
    }
  }, [isLoading, workspaces.length]);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const cacheStats = WorkspaceCacheManager.getCacheMetrics();
      const averageLoadTime = loadTimes.length > 0 
        ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
        : 0;

      setMetrics({
        cacheHitRate: cacheStats.hitRate,
        averageLoadTime,
        totalWorkspaces: workspaces.length,
        activeUsers: 1, // Would be calculated from actual user data
        lastUpdated: lastUpdated || new Date(),
        cacheSize: cacheStats.size,
        maxCacheSize: cacheStats.maxSize
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [workspaces.length, lastUpdated, loadTimes]);

  // Only show in development or for admin users
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const isAdmin = workspaces.some(w => w.is_admin_workspace);
    setIsVisible(isDev || isAdmin);
  }, [workspaces]);

  if (!isVisible || !metrics) {
    return null;
  }

  const getPerformanceStatus = (loadTime: number): { status: string; color: string } => {
    if (loadTime < 1000) return { status: 'Excellent', color: 'bg-green-500' };
    if (loadTime < 2000) return { status: 'Good', color: 'bg-yellow-500' };
    return { status: 'Needs Improvement', color: 'bg-red-500' };
  };

  const performanceStatus = getPerformanceStatus(metrics.averageLoadTime);
  const cacheUtilization = (metrics.cacheSize / metrics.maxCacheSize) * 100;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Workspace Performance
            <Badge variant="outline" className="ml-auto">
              {performanceStatus.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Load Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Avg Load Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${performanceStatus.color}`} />
              <span className="text-sm font-mono">
                {metrics.averageLoadTime.toFixed(0)}ms
              </span>
            </div>
          </div>

          {/* Cache Performance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Cache Usage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(cacheUtilization, 100)}%` }}
                />
              </div>
              <span className="text-sm font-mono">
                {metrics.cacheSize}/{metrics.maxCacheSize}
              </span>
            </div>
          </div>

          {/* Workspace Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Workspaces</span>
            </div>
            <span className="text-sm font-mono">{metrics.totalWorkspaces}</span>
          </div>

          {/* Last Updated */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Last Updated</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {metrics.lastUpdated.toLocaleTimeString()}
            </span>
          </div>

          {/* Performance Warnings */}
          {metrics.averageLoadTime > 2000 && (
            <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium">Slow Loading Detected</p>
                <p>Consider clearing cache or checking network connection.</p>
              </div>
            </div>
          )}

          {cacheUtilization > 90 && (
            <div className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-xs text-orange-800">
                <p className="font-medium">Cache Nearly Full</p>
                <p>Cache will start evicting old entries soon.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                WorkspaceCacheManager.getCacheMetrics();
                window.location.reload();
              }}
              className="flex-1 text-xs"
            >
              Clear Cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-xs"
            >
              Hide
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(WorkspacePerformanceMonitor);