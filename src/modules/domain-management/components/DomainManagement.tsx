import React, { useState } from 'react';
import { Globe, Search, Settings, CreditCard, Server } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { EnhancedCard, StatCard } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';

interface DomainManagementProps {
  user?: any;
}

export const DomainManagement: React.FC<DomainManagementProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Domain Management
          </h1>
          <p className="text-gray-600 mt-1">
            Search, purchase, and manage your domains with integrated DNS management
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50/50 backdrop-blur-sm border border-green-200/50 rounded-lg glass-effect">
          <CreditCard className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            Wallet: $0.00
          </span>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 glass-card">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Domains
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            My Domains
          </TabsTrigger>
          <TabsTrigger value="dns" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            DNS Management
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Wallet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <EnhancedCard className="glass-card">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Domain Search
              </CardTitle>
              <CardDescription>
                Search for available domains across multiple registrars
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                Domain search functionality will be implemented here
              </div>
            </CardContent>
          </EnhancedCard>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <EnhancedCard className="glass-card">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Domain Portfolio
              </CardTitle>
              <CardDescription>
                Manage your registered domains and renewal settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                Domain portfolio will be implemented here
              </div>
            </CardContent>
          </EnhancedCard>
        </TabsContent>

        <TabsContent value="dns" className="space-y-6">
          <EnhancedCard className="glass-card">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                DNS Management
              </CardTitle>
              <CardDescription>
                Configure DNS records for your domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                DNS management interface will be implemented here
              </div>
            </CardContent>
          </EnhancedCard>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-6">
          <EnhancedCard className="glass-card">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Wallet Management
              </CardTitle>
              <CardDescription>
                Manage your prepaid credits and auto-recharge settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                Wallet management will be implemented here
              </div>
            </CardContent>
          </EnhancedCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DomainManagement;