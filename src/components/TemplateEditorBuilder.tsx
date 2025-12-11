import { useState, useCallback } from 'react';
import { ArrowLeft, Save, Download, Upload, Eye, EyeOff } from 'lucide-react';
import SectionsEditor from './SectionsEditor';
import { TemplateData, SavedWebsite, updateSavedWebsite, downloadTemplate } from '../utils/savedWebsites';
import { supabase } from '../utils/supabase/client';

function LivePreview({ html, css, title }: { html: string; css: string; title: string }) {
  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; }
        ${css}
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;

  return (
    <iframe
      srcDoc={iframeContent}
      className="w-full h-full border-0"
      title="Live Preview"
      sandbox="allow-same-origin"
    />
  );
}

interface TemplateEditorBuilderProps {
  savedWebsite: SavedWebsite;
  onClose: () => void;
  onUpdate: (website: SavedWebsite) => void;
}

export default function TemplateEditorBuilder({ savedWebsite, onClose, onUpdate }: TemplateEditorBuilderProps) {
  const [templateData, setTemplateData] = useState<TemplateData>(savedWebsite.data);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [exportedHtml, setExportedHtml] = useState<string>('');
  const [exportedCss, setExportedCss] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  console.log('📝 TemplateEditorBuilder loaded with:', {
    id: savedWebsite.id,
    name: savedWebsite.name,
    hasData: !!savedWebsite.data,
    dataKeys: savedWebsite.data ? Object.keys(savedWebsite.data) : [],
  });

  const handleBuilderUpdate = useCallback((html: string, css: string) => {
    setExportedHtml(html);
    setExportedCss(css);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = async () => {
    // Save both the template data and the raw HTML/CSS from the visual builder
    const updatedData = {
      ...templateData,
      rawHtml: exportedHtml || templateData.rawHtml,
      rawCss: exportedCss || templateData.rawCss,
    };
    setTemplateData(updatedData);
    const updated = updateSavedWebsite(savedWebsite.id, { data: updatedData });
    if (updated) {
      onUpdate(updated);
    }
    setHasUnsavedChanges(false);
  };

  const handleDownload = () => {
    if (exportedHtml) {
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateData.seo?.title || templateData.title}</title>
  <meta name="description" content="${templateData.seo?.description || ''}">
  <style>${exportedCss}</style>
</head>
<body>
${exportedHtml}
</body>
</html>`;
      
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${savedWebsite.name.toLowerCase().replace(/\s+/g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      downloadTemplate(templateData, `${savedWebsite.name.toLowerCase().replace(/\s+/g, '-')}.html`);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const domain = (savedWebsite as any).domain || `${savedWebsite.name.toLowerCase().replace(/\s+/g, '-')}.adiology.app`;
      
      const { error } = await supabase.from('admin_websites').upsert({
        id: savedWebsite.id,
        name: savedWebsite.name,
        user_email: user?.email || 'unknown',
        domain: domain,
        status: 'Published',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) throw error;
      alert('✅ Website published! Domain: ' + domain);
      console.log('🚀 Website published to admin_websites:', domain);
    } catch (error) {
      console.error('Error publishing website:', error);
      alert('❌ Failed to publish website');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{savedWebsite.name}</h2>
            <p className="text-xs text-gray-500">Sections Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors"
          >
            {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              hasUnsavedChanges
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Save className="w-4 h-4" />
            {hasUnsavedChanges ? 'Save' : 'Saved'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex gap-0">
        <div className={`flex-1 overflow-hidden transition-all ${!showPreview ? 'w-full' : 'w-1/2'}`}>
          <SectionsEditor
            templateData={templateData}
            onUpdate={handleBuilderUpdate}
            onSave={handleSave}
          />
        </div>
        
        {showPreview && (
          <div className="w-1/2 overflow-hidden border-l bg-gray-50 flex flex-col">
            <div className="px-4 py-2 bg-white border-b text-xs font-medium text-gray-600">
              Live Preview
            </div>
            <div className="flex-1 overflow-auto">
              <LivePreview 
                html={exportedHtml} 
                css={exportedCss} 
                title={savedWebsite.name}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
