import React, { useState } from 'react';
import { Globe, Search, Settings, CreditCard, Server } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { EnhancedCard, StatCard } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';

interface DomainManagementProps {
  user?: any;
}

export const DomainManagement: React.FC<DomainManagementProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleDomainSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      return;
    }

    setSearching(true);
    try {
      // Get selected TLDs
      const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
      const selectedTlds = Array.from(checkboxes).map(cb => {
        const label = cb.parentElement?.textContent?.trim() || '';
        return label;
      }).filter(tld => tld.startsWith('.'));

      // Mock search results for now - replace with actual API call
      const mockResults = selectedTlds.map(tld => ({
        domain: `${query.toLowerCase()}${tld}`,
        available: Math.random() > 0.4,
        price: Math.floor(Math.random() * 20) + 10,
        registrar: 'ResellerClub'
      }));

      setSearchResults(mockResults);
    } catch (error) {
      console.error('Domain search error:', error);
    } finally {
      setSearching(false);
    }
  };

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
            <CardContent className="space-y-6">
              {/* Domain Search Input */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter domain name (e.g., mybusiness)"
                    className="pl-10 pr-4 py-3 w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        handleDomainSearch(target.value);
                      }
                    }}
                  />
                </div>
                <Button 
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="domain name"]') as HTMLInputElement;
                    if (input) handleDomainSearch(input.value);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* TLD Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Select Extensions</h3>
                <div className="flex flex-wrap gap-2">
                  {['.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.biz'].map((tld) => (
                    <label key={tld} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={['.com', '.net', '.org'].includes(tld)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{tld}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Search Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Search Results</h3>
                <div className="grid gap-3">
                  {/* Sample results - replace with actual search results */}
                  <div className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm border border-white/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-800">example.com</span>
                      <Badge variant="secondary" className="text-xs">Available</Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-800">$12.99/year</span>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm border border-white/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-gray-800">example.net</span>
                      <Badge variant="destructive" className="text-xs">Taken</Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">Not available</span>
                    </div>
                  </div>
                </div>
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