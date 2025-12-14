import React, { useState, useRef, useEffect } from 'react';
import { Zap, Check, AlertCircle, Download, Save, Loader2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { notifications } from '../utils/notifications';

interface GeneratedCampaign {
  id: string;
  campaign_name: string;
  business_name: string;
  website_url: string;
  monthly_budget: number;
  csvData: string;
  campaign_data: {
    analysis: {
      businessName: string;
      mainValue: string;
      keyBenefits: string[];
      targetAudience: string;
      industry: string;
      products: string[];
    };
    structure: {
      campaignName: string;
      dailyBudget: number;
      adGroupThemes: string[];
    };
    keywords: string[];
    adGroups: Array<{
      name: string;
      keywords: string[];
    }>;
    adCopy: {
      headlines: Array<{ text: string }>;
      descriptions: Array<{ text: string }>;
      callouts: string[];
    };
  };
}

interface ProgressStep {
  step: number;
  status: string;
  progress: number;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'action' | 'progress';
}

export function OneClickCampaignBuilder() {
  const [currentStep, setCurrentStep] = useState<'input' | 'generating' | 'results'>('input');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [resultsTimestamp, setResultsTimestamp] = useState<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLogEntry = (message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour12: false });
    setLogEntries(prev => [...prev, { timestamp, message, type }]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logEntries]);

  const handleAnalyze = async () => {
    if (!websiteUrl) {
      setError('Please enter a website URL');
      return;
    }

    let formattedUrl = websiteUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
      setWebsiteUrl(formattedUrl);
    }

    setError('');
    setCurrentStep('generating');
    setProgress(0);
    setIsGenerating(true);
    setLogEntries([]);
    setAnalysisComplete(false);
    
    addLogEntry('Initializing campaign builder...', 'info');
    addLogEntry(`Target URL: ${formattedUrl}`, 'progress');
    addLogEntry('Connecting to AI engine...', 'action');

    try {
      const response = await fetch('/api/campaigns/one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          websiteUrl: formattedUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate campaign');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                  setCurrentStatus(data.status || '');
                }
                if (data.log) {
                  addLogEntry(data.log.message, data.log.type || 'info');
                }
                if (data.complete && data.campaign) {
                  setAnalysisComplete(true);
                  setGeneratedCampaign(data.campaign);
                  addLogEntry('Analysis complete! Ready to proceed.', 'success');
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error('Parse error:', parseError);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Campaign generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate campaign');
      setCurrentStep('input');
      notifications.error('Failed to generate campaign', {
        title: 'Error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const proceedToResults = () => {
    if (generatedCampaign) {
      setResultsTimestamp(new Date().toLocaleTimeString('en-US', { hour12: false }));
      setCurrentStep('results');
      notifications.success('Campaign generated successfully!', {
        title: 'Success',
        description: `Generated ${generatedCampaign.campaign_data?.keywords?.length || 100}+ keywords`
      });
    }
  };

  const downloadCSV = () => {
    if (!generatedCampaign?.csvData) {
      notifications.error('No CSV data available');
      return;
    }

    const element = document.createElement('a');
    const file = new Blob([generatedCampaign.csvData], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = `${generatedCampaign.campaign_name || 'campaign'}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    notifications.success('CSV downloaded!', {
      title: 'Download Complete',
      description: 'Import this file into Google Ads Editor'
    });
  };

  const saveCampaign = async () => {
    if (!generatedCampaign) return;

    try {
      const response = await fetch('/api/campaigns/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generatedCampaign,
          source: 'one-click-builder'
        })
      });

      if (!response.ok) throw new Error('Failed to save campaign');

      notifications.success('Campaign saved!', {
        title: 'Saved',
        description: 'View it in "Saved Campaigns"'
      });
    } catch (err) {
      console.error('Save error:', err);
      notifications.error('Failed to save campaign', {
        title: 'Error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const resetBuilder = () => {
    setCurrentStep('input');
    setWebsiteUrl('');
    setProgress(0);
    setCurrentStatus('');
    setGeneratedCampaign(null);
    setError('');
    setLogEntries([]);
    setAnalysisComplete(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 p-6">
      {currentStep === 'input' && (
        <div className="max-w-2xl mx-auto">
          <Card className="border-purple-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-yellow-300" />
                <div>
                  <CardTitle className="text-2xl">1-Click Campaign Builder</CardTitle>
                  <CardDescription className="text-purple-100">
                    Paste your URL and let AI do the rest
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <p className="text-slate-600">
                Enter your landing page URL and our AI will automatically:
              </p>
              <ul className="text-sm text-slate-600 space-y-2 ml-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Analyze your website content
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Generate 100+ targeted keywords
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Create high-converting ad copy
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Build complete campaign structure
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Export ready-to-import CSV
                </li>
              </ul>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Landing Page URL
                </label>
                <Input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                <p className="text-sm text-purple-700">
                  <strong>Default Settings:</strong> Mobile + Desktop, Search Network, USA, English
                </p>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Generate Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'generating' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Website URL</label>
            <div className="flex items-center gap-3">
              <Input
                type="url"
                value={websiteUrl}
                disabled
                className="flex-1 bg-white border-slate-300"
              />
              <Button
                variant="outline"
                disabled
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Build
              </Button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Building Campaign Console</span>
              </div>
              <div className="flex items-center gap-2">
                {analysisComplete ? (
                  <Badge className="bg-green-600 text-white flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Complete
                  </Badge>
                ) : (
                  <Badge className="bg-purple-600 text-white flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Building...
                  </Badge>
                )}
              </div>
            </div>
            
            <div 
              ref={logContainerRef}
              className="p-4 h-80 overflow-y-auto font-mono text-sm"
            >
              {logEntries.map((entry, index) => (
                <div key={index} className="flex gap-2 py-0.5">
                  <span className="text-slate-500 shrink-0">[{entry.timestamp}]</span>
                  <span className={`
                    ${entry.type === 'success' ? 'text-green-400' : ''}
                    ${entry.type === 'action' ? 'text-yellow-400' : ''}
                    ${entry.type === 'progress' ? 'text-cyan-400' : ''}
                    ${entry.type === 'info' ? 'text-slate-400' : ''}
                  `}>
                    {entry.type === 'success' && <span className="text-green-400 mr-1">{'\u2713'}</span>}
                    {entry.type === 'action' && <span className="text-yellow-400 mr-1">{'>'}</span>}
                    {entry.type === 'progress' && <span className="text-cyan-400 mr-1">{'\u2192'}</span>}
                    {entry.message}
                  </span>
                </div>
              ))}
              {!analysisComplete && logEntries.length > 0 && (
                <div className="flex items-center gap-2 py-0.5 text-purple-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="animate-pulse">Building campaign...</span>
                </div>
              )}
            </div>

            {analysisComplete && (
              <div className="p-4 border-t border-slate-700">
                <Button
                  onClick={proceedToResults}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-5 text-base font-medium"
                >
                  Next: View Campaign Details
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {!analysisComplete && (
            <div className="text-center">
              <p className="text-sm text-slate-500">
                This usually takes 30-60 seconds depending on website complexity
              </p>
            </div>
          )}
        </div>
      )}

      {currentStep === 'results' && generatedCampaign && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Campaign Export Console</span>
              </div>
              <Badge className="bg-green-600 text-white flex items-center gap-1">
                <Check className="w-3 h-3" />
                Ready to Export
              </Badge>
            </div>
            
            <div className="p-4 font-mono text-sm space-y-1">
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-green-400">
                  <span className="mr-1">{'\u2713'}</span>
                  Campaign generation complete
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-cyan-400">
                  <span className="mr-1">{'\u2192'}</span>
                  Campaign: <span className="text-yellow-300">{generatedCampaign.campaign_name}</span>
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-cyan-400">
                  <span className="mr-1">{'\u2192'}</span>
                  Keywords: <span className="text-yellow-300">{generatedCampaign.campaign_data?.keywords?.length || '100+'}</span>
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-cyan-400">
                  <span className="mr-1">{'\u2192'}</span>
                  Ad Groups: <span className="text-yellow-300">{generatedCampaign.campaign_data?.adGroups?.length || '5'}</span>
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-cyan-400">
                  <span className="mr-1">{'\u2192'}</span>
                  Daily Budget: <span className="text-yellow-300">${generatedCampaign.campaign_data?.structure?.dailyBudget || '100'}</span>
                </span>
              </div>
              <div className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-green-400">
                  <span className="mr-1">{'\u2713'}</span>
                  CSV file ready for Google Ads Editor import
                </span>
              </div>
              <div className="flex gap-2 py-0.5 mt-2">
                <span className="text-slate-500 shrink-0">[{resultsTimestamp}]</span>
                <span className="text-purple-400 animate-pulse">
                  <span className="mr-1">{'>'}</span>
                  Awaiting export command...
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-3 flex-wrap">
              <Button
                onClick={downloadCSV}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                <Download className="w-5 h-5 mr-2" />
                Download CSV for Google Ads
              </Button>

              <Button
                onClick={saveCampaign}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Save className="w-5 h-5 mr-2" />
                Save to Saved Campaigns
              </Button>

              <Button
                onClick={resetBuilder}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Generate Another
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-700">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Website Analysis</span>
              </div>
              <ScrollArea className="h-48 p-4">
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(generatedCampaign.campaign_data?.analysis, null, 2)}
                </pre>
              </ScrollArea>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-700">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Campaign Structure</span>
              </div>
              <ScrollArea className="h-48 p-4">
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(generatedCampaign.campaign_data?.structure, null, 2)}
                </pre>
              </ScrollArea>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-700">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Sample Keywords ({generatedCampaign.campaign_data?.keywords?.length || 0} total)</span>
              </div>
              <ScrollArea className="h-48 p-4">
                <div className="space-y-1 font-mono text-xs">
                  {generatedCampaign.campaign_data?.keywords?.slice(0, 20).map((kw: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-green-400">{'\u2713'}</span>
                      <span className="text-slate-300">{kw}</span>
                    </div>
                  ))}
                  {(generatedCampaign.campaign_data?.keywords?.length || 0) > 20 && (
                    <div className="text-slate-500 mt-2">
                      ... and {(generatedCampaign.campaign_data?.keywords?.length || 0) - 20} more keywords
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-700">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-slate-300 text-sm font-medium">Ad Copy Preview</span>
              </div>
              <ScrollArea className="h-48 p-4">
                <div className="space-y-3 font-mono text-xs">
                  {generatedCampaign.campaign_data?.adCopy?.headlines?.slice(0, 5).map((h: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-400 shrink-0">H{idx + 1}:</span>
                      <span className="text-slate-300">{h.text || h}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-700 my-2 pt-2" />
                  {generatedCampaign.campaign_data?.adCopy?.descriptions?.slice(0, 3).map((d: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0">D{idx + 1}:</span>
                      <span className="text-slate-300">{d.text || d}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GenerationStep({ step, title, progress, threshold }: { step: number; title: string; progress: number; threshold: number }) {
  const isComplete = progress >= threshold;
  const isActive = progress >= threshold - 15 && progress < threshold;

  return (
    <div className="flex items-center gap-3">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
        ${isComplete
          ? 'bg-green-500 text-white'
          : isActive
            ? 'bg-purple-500 text-white animate-pulse'
            : 'bg-slate-200 text-slate-500'
        }
      `}>
        {isComplete ? <Check className="w-4 h-4" /> : step}
      </div>
      <span className={`text-sm ${isComplete ? 'text-green-600 font-medium' : isActive ? 'text-purple-600 font-medium' : 'text-slate-500'}`}>
        {title}
      </span>
      {isActive && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-purple-700 truncate">{value}</p>
    </div>
  );
}

function DetailSection({ title, icon, data }: { title: string; icon: string; data: any }) {
  if (!data) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      <ScrollArea className="h-40">
        <pre className="text-xs text-slate-600 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </ScrollArea>
    </div>
  );
}

export default OneClickCampaignBuilder;
