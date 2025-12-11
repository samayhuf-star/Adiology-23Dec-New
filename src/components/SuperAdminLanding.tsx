import React from 'react';
import { Users, Shield, ArrowRight, Eye, Settings, Database } from 'lucide-react';

interface SuperAdminLandingProps {
  onSelectUserView: () => void;
  onSelectAdminPanel: () => void;
  onLogout: () => void;
}

export const SuperAdminLanding: React.FC<SuperAdminLandingProps> = ({
  onSelectUserView,
  onSelectAdminPanel,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-8">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
              <h1 className="text-4xl font-bold text-white">Super Admin Portal</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-semibold text-indigo-200">Adiology</span>
                  <span className="text-xs text-indigo-300">~ Samay</span>
                </div>
              </div>
            </div>
            <p className="text-indigo-200 ml-15">Choose your access level</p>
          </div>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all backdrop-blur-xl"
          >
            Logout
          </button>
        </div>

        {/* Two Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Normal User View */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:-translate-y-2 shadow-2xl h-full flex flex-col">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">Normal User View</h2>
                <p className="text-indigo-200 mb-6">
                  Experience the application exactly as your users see it. Perfect for testing features, 
                  understanding user workflows, and troubleshooting reported issues.
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-white/90">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm">See what users see</span>
                  </li>
                  <li className="flex items-center gap-2 text-white/90">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm">Test user workflows</span>
                  </li>
                  <li className="flex items-center gap-2 text-white/90">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm">All standard features available</span>
                  </li>
                </ul>
              </div>

              {/* Button */}
              <button
                onClick={onSelectUserView}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/50"
              >
                Enter User View
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Card 2: Super Admin Panel (includes Database) */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:-translate-y-2 shadow-2xl h-full flex flex-col">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">Super Admin Panel</h2>
                <p className="text-indigo-200 mb-6">
                  Full system control with comprehensive tools for managing users, database, billing, analytics, and all platform operations.
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-white/90">
                    <Settings className="w-4 h-4 text-pink-400" />
                    <span className="text-sm">Manage users & accounts</span>
                  </li>
                  <li className="flex items-center gap-2 text-white/90">
                    <Settings className="w-4 h-4 text-pink-400" />
                    <span className="text-sm">Database management & CRUD</span>
                  </li>
                  <li className="flex items-center gap-2 text-white/90">
                    <Settings className="w-4 h-4 text-pink-400" />
                    <span className="text-sm">Monitor system & usage</span>
                  </li>
                  <li className="flex items-center gap-2 text-white/90">
                    <Settings className="w-4 h-4 text-pink-400" />
                    <span className="text-sm">Configure billing & analytics</span>
                  </li>
                </ul>
              </div>

              {/* Button */}
              <button
                onClick={onSelectAdminPanel}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-pink-500/50"
              >
                Access Admin Panel
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
            <Shield className="w-4 h-4 text-indigo-300" />
            <p className="text-sm text-indigo-200">
              All admin actions are logged and monitored for security compliance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
