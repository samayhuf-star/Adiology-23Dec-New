import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Table, Users, FileText, Globe, Ticket, Layout, DollarSign } from 'lucide-react';

interface ReactAdminPanelProps {
  onBack?: () => void;
}

export const ReactAdminPanel = ({ onBack }: ReactAdminPanelProps) => {
  const [activeTable, setActiveTable] = useState('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);

  const tables = [
    { id: 'users', name: 'Users', icon: Users },
    { id: 'admin_templates', name: 'Templates', icon: FileText },
    { id: 'admin_websites', name: 'Websites', icon: Globe },
    { id: 'admin_deployments', name: 'Deployments', icon: Layout },
    { id: 'admin_expenses', name: 'Expenses', icon: DollarSign },
    { id: 'campaign_structures', name: 'Campaign Structures', icon: Table },
    { id: 'support_tickets', name: 'Support Tickets', icon: Ticket },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: result, error } = await supabase
          .from(activeTable)
          .select('*')
          .limit(100);
        
        if (error) throw error;
        
        if (result && result.length > 0) {
          setColumns(Object.keys(result[0]));
          setData(result);
        } else {
          setData([]);
          setColumns([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setData([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTable]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {onBack && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
          >
            <span>← Back to Dashboard</span>
          </button>
        </div>
      )}

      <div className="flex flex-1 gap-4 p-6">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 rounded-lg p-4 flex flex-col gap-2 h-fit">
          <h2 className="text-lg font-bold text-white mb-2">Database Tables</h2>
          {tables.map((table) => {
            const Icon = table.icon;
            return (
              <button
                key={table.id}
                onClick={() => setActiveTable(table.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  activeTable === table.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{table.name}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-800 rounded-lg p-6 flex flex-col">
          <h1 className="text-2xl font-bold text-white mb-4">
            {tables.find(t => t.id === activeTable)?.name}
          </h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading data...</div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">No data found in this table</div>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2 text-left text-gray-300 font-semibold"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-700 hover:bg-gray-700 transition-colors"
                    >
                      {columns.map((col) => (
                        <td
                          key={`${idx}-${col}`}
                          className="px-4 py-2 text-gray-300"
                        >
                          <div className="max-w-xs truncate">
                            {typeof row[col] === 'object'
                              ? JSON.stringify(row[col]).slice(0, 50)
                              : String(row[col] || '-')}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-400 text-center">
            Showing {data.length} records from {activeTable}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactAdminPanel;
