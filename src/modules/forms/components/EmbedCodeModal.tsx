import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Copy, Check } from 'lucide-react';

interface EmbedCodeModalProps {
  formId: string;
  formName: string;
  onClose: () => void;
}

export function EmbedCodeModal({ formId, formName, onClose }: EmbedCodeModalProps) {
  const [copied, setCopied] = useState(false);
  
  const apiBaseUrl = window.location.origin;
  const embedCode = `<div id="adiology-form-container"></div>

<script>
  (function() {
    const FORM_ID = '${formId}';
    const API_URL = '${apiBaseUrl}/api/forms';
    
    fetch(\`\${API_URL}/\${FORM_ID}\`)
      .then(r => r.json())
      .then(({ data: form }) => {
        if (!form || form.status !== 'published') {
          document.getElementById('adiology-form-container').innerHTML = '<p>Form not available</p>';
          return;
        }
        
        let html = \`<form id="adiology-form-\${FORM_ID}" style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\`;
        
        form.fields.forEach(field => {
          const required = field.required ? 'required' : '';
          const label = \`<label style="display: block; margin-bottom: 8px; font-weight: 500;">\${field.label}\${field.required ? '<span style="color:red">*</span>' : ''}</label>\`;
          
          switch (field.field_type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'number':
              const type = field.field_type === 'phone' ? 'tel' : field.field_type;
              html += \`
                <div style="margin-bottom: 15px;">
                  \${label}
                  <input type="\${type}" name="\${field.id}" placeholder="\${field.placeholder || ''}" \${required} 
                    style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
                </div>
              \`;
              break;
            case 'textarea':
              html += \`
                <div style="margin-bottom: 15px;">
                  \${label}
                  <textarea name="\${field.id}" placeholder="\${field.placeholder || ''}" \${required}
                    style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; resize: vertical; font-size: 14px; box-sizing: border-box; font-family: inherit;" rows="4"></textarea>
                </div>
              \`;
              break;
            case 'select':
              html += \`
                <div style="margin-bottom: 15px;">
                  \${label}
                  <select name="\${field.id}" \${required} style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
                    <option value="">Select...</option>
                    \${field.options.map(opt => \`<option value="\${opt}">\${opt}</option>\`).join('')}
                  </select>
                </div>
              \`;
              break;
            case 'checkbox':
              html += \`
                <div style="margin-bottom: 15px;">
                  \${label}
                  \${field.options.map((opt, i) => \`
                    <div style="margin-bottom: 8px;">
                      <input type="checkbox" name="\${field.id}" value="\${opt}" id="check-\${i}" />
                      <label for="check-\${i}" style="margin-left: 8px;">\${opt}</label>
                    </div>
                  \`).join('')}
                </div>
              \`;
              break;
            case 'radio':
              html += \`
                <div style="margin-bottom: 15px;">
                  \${label}
                  \${field.options.map((opt, i) => \`
                    <div style="margin-bottom: 8px;">
                      <input type="radio" name="\${field.id}" value="\${opt}" id="radio-\${i}" \${required} />
                      <label for="radio-\${i}" style="margin-left: 8px;">\${opt}</label>
                    </div>
                  \`).join('')}
                </div>
              \`;
              break;
          }
        });
        
        html += \`<button type="submit" style="padding: 12px 30px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: 500; transition: background 0.2s;">Submit</button></form>\`;
        
        document.getElementById('adiology-form-container').innerHTML = html;
        
        document.getElementById(\`adiology-form-\${FORM_ID}\`).addEventListener('submit', (e) => {
          e.preventDefault();
          
          const data = {};
          form.fields.forEach(field => {
            if (field.field_type === 'checkbox') {
              const checked = document.querySelectorAll(\`[name="\${field.id}"]:checked\`);
              data[field.label] = Array.from(checked).map(c => c.value).join(', ');
            } else {
              const input = document.querySelector(\`[name="\${field.id}"]\`);
              if (input) {
                data[field.label] = input.value;
              }
            }
          });
          
          fetch(\`\${API_URL}/\${FORM_ID}/submit\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
          })
          .then(r => r.json())
          .then(result => {
            if (result.success) {
              alert('Thank you for your submission!');
              document.getElementById(\`adiology-form-\${FORM_ID}\`).reset();
            } else {
              alert('Error submitting form. Please try again.');
            }
          })
          .catch(err => {
            console.error('Submission error:', err);
            alert('Error submitting form. Please try again.');
          });
        });
      })
      .catch(err => {
        console.error('Error loading form:', err);
        document.getElementById('adiology-form-container').innerHTML = '<p>Error loading form</p>';
      });
  })();
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Embed Form: {formName}</DialogTitle>
          <DialogDescription>
            Copy and paste this code into your website to embed this form
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Embed Code</Label>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={embedCode}
              readOnly
              className="font-mono text-xs"
              rows={20}
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-semibold text-sm mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Copy the code above</li>
              <li>Paste it into your HTML page where you want the form to appear</li>
              <li>The form will automatically load and be ready to accept submissions</li>
              <li>Submissions will be saved to your Adiology account</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

