import React, { useState, useEffect } from 'react';
import { formApi } from '../services/formApi';
import { Card } from '../../../components/ui/card';
import { TrendingUp, Users, Calendar, Clock } from 'lucide-react';

interface FormAnalyticsProps {
  formId: string;
}

export function FormAnalytics({ formId }: FormAnalyticsProps) {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    todaySubmissions: 0,
    weekSubmissions: 0,
    monthSubmissions: 0,
    averagePerDay: 0,
    lastSubmission: null as string | null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [formId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await formApi.getSubmissions(formId);
      
      if (response.success) {
        const submissions = response.data;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const todaySubs = submissions.filter((s: any) => {
          const date = new Date(s.created_at);
          return date >= today;
        }).length;
        
        const weekSubs = submissions.filter((s: any) => {
          const date = new Date(s.created_at);
          return date >= weekAgo;
        }).length;
        
        const monthSubs = submissions.filter((s: any) => {
          const date = new Date(s.created_at);
          return date >= monthAgo;
        }).length;
        
        const lastSubmission = submissions.length > 0 
          ? submissions[0].created_at 
          : null;
        
        // Calculate average per day (last 30 days)
        const daysDiff = submissions.length > 0
          ? Math.max(1, Math.floor((now.getTime() - new Date(submissions[submissions.length - 1].created_at).getTime()) / (24 * 60 * 60 * 1000)))
          : 1;
        const averagePerDay = monthSubs / Math.min(30, daysDiff);
        
        setStats({
          totalSubmissions: submissions.length,
          todaySubmissions: todaySubs,
          weekSubmissions: weekSubs,
          monthSubmissions: monthSubs,
          averagePerDay: Math.round(averagePerDay * 10) / 10,
          lastSubmission,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading analytics...</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-gray-600">Total</span>
        </div>
        <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
        <div className="text-xs text-gray-500 mt-1">All time</div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-600">Today</span>
        </div>
        <div className="text-2xl font-bold">{stats.todaySubmissions}</div>
        <div className="text-xs text-gray-500 mt-1">Last 24 hours</div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-600">This Week</span>
        </div>
        <div className="text-2xl font-bold">{stats.weekSubmissions}</div>
        <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-600">This Month</span>
        </div>
        <div className="text-2xl font-bold">{stats.monthSubmissions}</div>
        <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-medium text-gray-600">Avg/Day</span>
        </div>
        <div className="text-2xl font-bold">{stats.averagePerDay}</div>
        <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Last</span>
        </div>
        <div className="text-sm font-bold">
          {stats.lastSubmission
            ? new Date(stats.lastSubmission).toLocaleDateString()
            : 'Never'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.lastSubmission
            ? new Date(stats.lastSubmission).toLocaleTimeString()
            : 'No submissions'}
        </div>
      </Card>
    </div>
  );
}

