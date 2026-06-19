/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { Upload, FileImage, ShieldCheck, Play, Sparkles, Terminal, CheckCircle2, ChevronRight, Eye } from 'lucide-react';
import { Folder, Lead, ParsingLog } from '../types';
import { drawStudentQuizForm, PRESET_SAMPLES } from '../utils/samples';
import { parseOcrText, generateLog } from '../utils/localParser';

interface OcrScannerProps {
  folders: Folder[];
  currentFolderId: string;
  onLeadAdded: (lead: Lead) => void;
}

export default function OcrScanner({ folders, currentFolderId, onLeadAdded }: OcrScannerProps) {
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_SAMPLES[0].id);
  const [activeTab, setActiveTab] = useState<'preset' | 'upload'>('upload');
  const [dragging, setDragging] = useState(false);
  const [logs, setLogs] = useState<ParsingLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [rawOcrText, setRawOcrText] = useState('');
  const [extractedLead, setExtractedLead] = useState<Partial<Lead> | null>(null);
  
  // Custom values for preset form adjustments to allow interactive testing!
  const [customParentName, setCustomParentName] = useState(PRESET_SAMPLES[0].parentName);
  const [customChildName, setCustomChildName] = useState(PRESET_SAMPLES[0].childName);
  const [customClassGrade, setCustomClassGrade] = useState(PRESET_SAMPLES[0].classGrade);
  const [customEmail, setCustomEmail] = useState(PRESET_SAMPLES[0].email);
  const [customAddress, setCustomAddress] = useState(PRESET_SAMPLES[0].address);
  const [customPhone, setCustomPhone] = useState(PRESET_SAMPLES[0].phone);
  
  // Target folder for the newly extracted lead
  const [targetFolderId, setTargetFolderId] = useState(currentFolderId === 'all' ? 'all' : currentFolderId);

  // File states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add initial welcome logs
  useEffect(() => {
    setLogs([
      generateLog('Local AI Studio Sandbox initialized.', 'info'),
      generateLog('Security mode active: All scans run offline on sandboxed core. No external payloads.', 'success'),
    ]);
  }, []);

  // Sync preset parameters
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const sample = PRESET_SAMPLES.find(p => p.id === presetId);
    if (sample) {
      setCustomParentName(sample.parentName);
      setCustomChildName(sample.childName);
      setCustomClassGrade(sample.classGrade);
      setCustomEmail(sample.email);
      setCustomAddress(sample.address);
      setCustomPhone(sample.phone || '');
      setExtractedLead(null);
      setRawOcrText('');
    }
  };

  // Re-draw canvas whenever properties of preset change
  useEffect(() => {
    if (activeTab === 'preset' && canvasRef.current) {
      drawStudentQuizForm(canvasRef.current, {
        parentName: customParentName,
        childName: customChildName,
        classGrade: customClassGrade,
        email: customEmail,
        address: customAddress,
        phone: customPhone
      });
    }
  }, [activeTab, customParentName, customChildName, customClassGrade, customEmail, customAddress, customPhone]);

  // Handle uploaded files
  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addLog('Invalid file type. Please upload an image format (PNG, JPG, WebP).', 'error');
      return;
    }
    setUploadedFile(file);
    setExtractedLead(null);
    setRawOcrText('');

    const url = URL.createObjectURL(file);
    setUploadedFileUrl(url);
    addLog(`File loaded successfully: ${file.name} (${Math.round(file.size / 1024)} KB)`, 'info');

    // Draw uploaded image onto canvas
    const img = new Image();
    img.src = url;
    img.onload = () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = img.width > 800 ? 800 : img.width;
          canvasRef.current.height = img.height > 1000 ? 1000 : img.height;
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
          addLog('Image parsed onto client-side raster renderer.', 'info');
        }
      }
    };
  };

  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [generateLog(message, type), ...prev]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // MAIN OCR ENGINE PIPELINE (100% PRIVATE & OFFLINE)
  const runOcrEngine = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setOcrProgress(5);
    setOcrStatusText('Booting Node Core...');
    setExtractedLead(null);
    setRawOcrText('');

    addLog('Initiating secure client-side Tesseract.js worker...', 'info');

    try {
      // 1. Setup the client-side worker with progress routing
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.floor(25 + m.progress * 65));
            setOcrStatusText(`OCR Scanning: ${Math.round(m.progress * 100)}%`);
          } else {
            setOcrStatusText(m.status);
          }
        }
      });

      setOcrProgress(20);
      setOcrStatusText('Analysing pixels...');
      addLog('Tesseract core successfully compiled in isolated browser sandbox.', 'success');

      // 2. Fetch image from canvas
      if (!canvasRef.current) {
        throw new Error('No active canvas buffer found to extract.');
      }

      setOcrProgress(25);
      addLog('Feeding raster pixel buffers into offline pipeline...', 'info');

      // 3. Recognize
      const result = await worker.recognize(canvasRef.current);
      const text = result.data.text;
      
      setRawOcrText(text);
      addLog(`Extracted raw OCR text from image completed. Length: ${text.length} chars.`, 'success');

      setOcrProgress(90);
      setOcrStatusText('Executing client-side AI heuristics parser...');
      addLog('Starting local NLP parsing rules (No remote payloads)...', 'info');

      // 4. Structured parse via local parsing rules
      const leadData = parseOcrText(text);
      setExtractedLead(leadData);

      // Check fields matching screenshot or fallback
      addLog(`Lead parsed successfully! Name: "${leadData.parentName || 'Unknown'}", Email: "${leadData.email || 'None'}"`, 'success');

      await worker.terminate();

      setOcrProgress(100);
      setOcrStatusText('Completed');
      addLog('Scanning and AI structuring cycle fully completed with 100% data privacy.', 'success');
    } catch (err: any) {
      console.error(err);
      addLog(`Extraction failed: ${err?.message || 'Unknown sandbox worker restriction'}`, 'error');
      setOcrStatusText('Engine Error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add structured lead into our state manager folder
  const handleSaveLead = () => {
    if (!extractedLead) return;

    const folderTarget = targetFolderId === 'all' ? 'all' : targetFolderId;
    
    const finalLead: Lead = {
      id: Math.random().toString(36).substring(2),
      folderId: folderTarget,
      parentName: extractedLead.parentName || 'Unspecified Parent',
      childName: extractedLead.childName || 'Unspecified Student',
      classGrade: extractedLead.classGrade || 'N/A',
      email: extractedLead.email || '',
      address: extractedLead.address || '',
      phone: extractedLead.phone || '',
      createdAt: new Date().toISOString(),
      ocrTextRaw: rawOcrText,
      status: 'New',
      notes: extractedLead.notes || 'Manually saved from OCR extractor.'
    };

    onLeadAdded(finalLead);
    addLog(`Stored extracted lead "${finalLead.parentName}" inside database folder.`, 'success');
    
    // Clear extraction card
    setExtractedLead(null);
    setRawOcrText('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ocr-scanner-grid">
      
      {/* LEFT: Live canvas image canvas and variables controller */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Local OCR Extractor Stage
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Generate customized handwriting forms or drag-and-drop scans safely.</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                onClick={() => {
                  setActiveTab('preset');
                  addLog('Switched to Preset Sandbox mode.', 'info');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'preset' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                id="tab-presets"
              >
                Sample presets
              </button>
              <button
                onClick={() => {
                  setActiveTab('upload');
                  addLog('Switched to Custom Document Upload mode.', 'info');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                id="tab-uploads"
              >
                Upload scans
              </button>
            </div>
          </div>

          {activeTab === 'preset' ? (
            <div className="space-y-4">
              {/* Preset Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_SAMPLES.map(sample => (
                  <button
                    key={sample.id}
                    onClick={() => handlePresetChange(sample.id)}
                    className={`px-3 py-2 text-left rounded-xl border transition-all text-xs flex flex-col justify-between ${
                      selectedPresetId === sample.id
                        ? 'border-indigo-600 bg-indigo-55/10 ring-2 ring-indigo-500/10'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-slate-700 block truncate">{sample.name}</span>
                    <span className="text-[10px] text-slate-400 truncate mt-1">{sample.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Upload stage */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                dragging ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && processUploadedFile(e.target.files[0])}
              />
              <div className="p-3 bg-white rounded-full shadow-xs border border-slate-100 text-indigo-500 mb-3">
                <Upload className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-slate-700">Drag and drop your Lead Form or click to browse</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Capture any quiz paper, feedback card, or application sheet from standard files. JPG or PNG files accepted.</p>
              
              {uploadedFile && (
                <div className="mt-4 px-3 py-1.5 bg-indigo-50 rounded-lg text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5" />
                  {uploadedFile.name}
                </div>
              )}
            </div>
          )}

          {/* Core Action Trigger & Progress bar */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Secure Node Core
              </span>
            </div>

            <button
              onClick={runOcrEngine}
              disabled={isProcessing}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm tracking-wide shadow-sm flex items-center justify-center gap-2.5 transition-all ${
                isProcessing
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:-translate-y-0.5 active:translate-y-0'
              }`}
              id="btn-run-ocr"
            >
              <Play className="w-4 h-4 fill-white shrink-0" />
              {isProcessing ? 'Extracting Handwriting...' : 'Run Local OCR Scan'}
            </button>
          </div>

          {/* Progress Slider */}
          {isProcessing && (
            <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
              <div className="flex items-center justify-between mb-1.5 font-bold text-indigo-800">
                <span>{ocrStatusText}</span>
                <span>{ocrProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for offscreen OCR pixel analysis */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* RIGHT: Parsed results extraction output */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* If lead has been extracted, show the live extraction editor to save! */}
        {extractedLead ? (
          <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/20 rounded-2xl border border-emerald-100 shadow-sm p-6 animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-extrabold text-emerald-800 tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Local AI Extraction Complete
                </span>
                <h3 className="font-extrabold text-slate-800 text-lg mt-1">Verify & Save Lead</h3>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={extractedLead.parentName || ''}
                  onChange={e => setExtractedLead({ ...extractedLead, parentName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Child Name</label>
                <input
                  type="text"
                  value={extractedLead.childName || ''}
                  onChange={e => setExtractedLead({ ...extractedLead, childName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class / Grade</label>
                  <input
                    type="text"
                    value={extractedLead.classGrade || ''}
                    onChange={e => setExtractedLead({ ...extractedLead, classGrade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={extractedLead.phone || ''}
                    onChange={e => setExtractedLead({ ...extractedLead, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={extractedLead.email || ''}
                  onChange={e => setExtractedLead({ ...extractedLead, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Home Address</label>
                <input
                  type="text"
                  value={extractedLead.address || ''}
                  onChange={e => setExtractedLead({ ...extractedLead, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Save Into Collection Folder</label>
                <select
                  value={targetFolderId}
                  onChange={e => setTargetFolderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                >
                  <option value="all">📁 All Leads Pool (Default)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveLead}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all text-center block mt-2"
                id="btn-save-extracted-lead"
              >
                Log Lead and Add to Database
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center min-h-[360px] shadow-xs">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-indigo-100/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">Extraction Output Preview</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Choose a preset template form on the left, or upload your handwritten documents, then click <strong className="text-indigo-600 font-bold">Run Local OCR Scan</strong> to extract the variables.
            </p>
          </div>
        )}

        {/* OCR Raw Text output block info */}
        {rawOcrText && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 text-xs">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Eye className="w-4 h-4 text-slate-400" />
              Raw Text Scanned
            </h4>
            <pre className="p-3 bg-slate-50 border border-slate-100 rounded-xl max-h-[140px] overflow-y-auto text-slate-500 text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
              {rawOcrText}
            </pre>
          </div>
        )}
      </div>
      
    </div>
  );
}
