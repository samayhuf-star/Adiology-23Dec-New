import React, { useState, useEffect } from 'react';
import { formApi } from '../services/formApi';
import { Button } from '../../../components/ui/button';
import { Trash2, Download } from 'lucide-react';

interface SubmissionsTableProps {
  formId: string;
}

export function SubmissionsTable({ formId }: SubmissionsTableProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, [formId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await formApi.getSubmissions(formId);
      if (response.success) {
        setSubmissions(response.data);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await formApi.exportSubmissions(formId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `submissions-${formId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!window.confirm('Delete this submission?')) return;
    
    try {
      const response = await formApi.deleteSubmission(formId, submissionId);
      if (response.success) {
        setSubmissions(submissions.filter(s => s.id !== submissionId));
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>No submissions yet</p>
      </div>
    );
  }

  const headers = Object.keys(submissions[0].submission_data || {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{submissions.length} Submissions</h3>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-semibold">Date</th>
              {headers.map(h => (
                <th key={h} className="text-left p-2 font-semibold">
                  {h}
                </th>
              ))}
              <th className="text-left p-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(submission => (
              <tr key={submission.id} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  {new Date(submission.created_at).toLocaleDateString()}
                </td>
                {headers.map(h => (
                  <td key={h} className="p-2">
                    {submission.submission_data[h] || ''}
                  </td>
                ))}
                <td className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(submission.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

