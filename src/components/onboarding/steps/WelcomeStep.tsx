import React from 'react';
import { 
  Sparkles, 
  Target, 
  BarChart3, 
  Zap, 
  Users, 
  Globe,
  CheckCircle
} from 'lucide-react';

export const WelcomeStep: React.FC = () => {
  const features = [
    {
      icon: <Target className="w-6 h-6 text-indigo-600" />,
      title: 'Campaign Builder',
      description: 'Create powerful marketing campaigns with our intuitive builder'
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-green-600" />,
      title: 'Analytics & Insights',
      description: 'Track performance and optimize your marketing efforts'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: 'Automation Tools',
      description: 'Automate repetitive tasks and scale your marketing'
    },
    {
      icon: <Users className="w-6 h-6 text-purple-600" />,
      title: 'Team Collaboration',
      description: 'Work together with your team on marketing projects'
    },
    {
      icon: <Globe className="w-6 h-6 text-blue-600" />,
      title: 'Multi-Channel Reach',
      description: 'Reach your audience across multiple platforms'
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
      title: 'Easy Integration',
      description: 'Connect with your existing tools and workflows'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to the Future of Marketing
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Adiology is your all-in-one marketing automation platform. We'll help you create, 
          manage, and optimize campaigns that drive real results for your business.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Ready to Get Started?
        </h3>
        <p className="text-gray-600 mb-4">
          This quick setup will take less than 5 minutes and help us personalize your experience.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Free 14-day trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};