/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Sparkles, Folder, Lock, Laptop
} from 'lucide-react';
import { Lead, Folder as FolderType } from './types';
import FolderList from './components/FolderList';
import OcrScanner from './components/OcrScanner';
import LeadTable from './components/LeadTable';

// Unique IDs for default folders
const DEFAULT_FOLDERS: FolderType[] = [
  {
    id: 'school-quiz-folder',
    name: 'High School Student Quiz',
    description: 'Leads generated from student quiz forms (including Sujal form)',
    color: 'border-indigo-500 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sports-camp-folder',
    name: 'Youth Sports Camp',
    description: 'Camp registration cards and signups',
    color: 'border-emerald-500 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100',
    createdAt: new Date().toISOString()
  }
];

// Default sample leads
const DEFAULT_LEADS: Lead[] = [
  {
    id: 'lead-sujal-default',
    folderId: 'school-quiz-folder',
    parentName: 'Sujal',
    childName: 'singh ka beta',
    classGrade: '8th class',
    email: 'Sujal1234@gmail.com',
    address: 'new ashok nagar',
    phone: '9876543210',
    createdAt: new Date().toISOString(),
    ocrTextRaw: 'STUDENT QUIZ: TEST YOUR KNOWLEDGE!\nParent Name: Sujal\nChild Name: singh ka beta\nClass/Grade: 8th class\nEmail: Sujal1234@gmail.com\nAddress: new ashok nagar',
    status: 'New',
    notes: 'Parsed locally from uploaded quiz scan. Matches handwritten inputs.'
  },
  {
    id: 'lead-sharapov-default',
    folderId: 'sports-camp-folder',
    parentName: 'Maria Sharapova',
    childName: 'Leo Sharapov',
    classGrade: '5th class',
    email: 'm.shara@tennisacademy.org',
    address: '45 Coral Gables, Miami, FL',
    phone: '305-555-0143',
    createdAt: new Date().toISOString(),
    ocrTextRaw: 'TENNIS SPORTS CAMP\nParent Name: Maria Sharapova\nChild Name: Leo Sharapov\nClass: 5th class\nEmail: m.shara@tennisacademy.org\nAddress: 45 Coral Gables, Miami, FL\nPhone: 305-555-0143',
    status: 'Qualified',
    notes: 'Extracted automatically from Florida camp application cards.'
  }
];

export default function App() {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'stage' | 'database'>('stage');

  // Load from localStorage or defaults
  useEffect(() => {
    const cachedFolders = localStorage.getItem('ocr_lead_folders');
    const cachedLeads = localStorage.getItem('ocr_lead_records');
    
    if (cachedFolders) {
      setFolders(JSON.parse(cachedFolders));
    } else {
      setFolders(DEFAULT_FOLDERS);
      localStorage.setItem('ocr_lead_folders', JSON.stringify(DEFAULT_FOLDERS));
    }

    if (cachedLeads) {
      setLeads(JSON.parse(cachedLeads));
    } else {
      setLeads(DEFAULT_LEADS);
      localStorage.setItem('ocr_lead_records', JSON.stringify(DEFAULT_LEADS));
    }
  }, []);

  // Sync to localStorage
  const saveFoldersToStorage = (newFolders: FolderType[]) => {
    setFolders(newFolders);
    localStorage.setItem('ocr_lead_folders', JSON.stringify(newFolders));
  };

  const saveLeadsToStorage = (newLeads: Lead[]) => {
    setLeads(newLeads);
    localStorage.setItem('ocr_lead_records', JSON.stringify(newLeads));
  };

  // Folder Operations
  const handleCreateFolder = (name: string, description: string, color: string) => {
    const newFolder: FolderType = {
      id: `folder-${Math.random().toString(36).substring(2)}`,
      name,
      description,
      color,
      createdAt: new Date().toISOString()
    };
    const updated = [...folders, newFolder];
    saveFoldersToStorage(updated);
  };

  const handleDeleteFolder = (id: string) => {
    // Delete folders but move its leads back to the general pool (all)
    const updatedFolders = folders.filter(f => f.id !== id);
    const updatedLeads = leads.map(lead => {
      if (lead.folderId === id) {
        return { ...lead, folderId: 'all' };
      }
      return lead;
    });
    
    saveFoldersToStorage(updatedFolders);
    saveLeadsToStorage(updatedLeads);
    
    if (activeFolderId === id) {
      setActiveFolderId('all');
    }
  };

  // Lead Operations
  const handleAddLead = (newLead: Lead) => {
    const updated = [newLead, ...leads];
    saveLeadsToStorage(updated);
    // Switch to database and active folder after extraction
    setActiveFolderId(newLead.folderId);
    setActiveTab('database');
  };

  const handleDeleteLead = (leadId: string) => {
    const updated = leads.filter(l => l.id !== leadId);
    saveLeadsToStorage(updated);
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    const updated = leads.map(l => (l.id === updatedLead.id ? updatedLead : l));
    saveLeadsToStorage(updated);
  };

  const handleMoveLeadFolder = (leadId: string, targetFolderId: string) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return { ...l, folderId: targetFolderId };
      }
      return l;
    });
    saveLeadsToStorage(updated);
  };

  // Build folder count statistics mapping Folder ID -> Lead count
  const leadCounts: Record<string, number> = {};
  leads.forEach(lead => {
    if (lead.folderId) {
      // General pool is all
      if (lead.folderId !== 'all') {
        leadCounts[lead.folderId] = (leadCounts[lead.folderId] || 0) + 1;
      }
    }
  });

  const activeFolder = folders.find(f => f.id === activeFolderId);
  const filteredLeadCount = activeFolderId === 'all' 
    ? leads.length 
    : leads.filter(l => l.folderId === activeFolderId).length;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden text-slate-900" id="app-wrapper">
      
      {/* LEFT: Sidebar folders organization - Matches Sleek Interface theme exactly */}
      <FolderList
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectFolder={setActiveFolderId}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        leadCounts={leadCounts}
      />

      {/* RIGHT: Main Dashboard Shell flexcontainer */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden" id="main-content-panel">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-xs z-1">
          <div className="flex items-center gap-4 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {activeFolderId === 'all' ? 'All Leads Collection' : (activeFolder?.name || 'Custom Folder')}
            </h2>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide shrink-0">
              {filteredLeadCount} Leads
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Elegant Tab Toggles for switching tasks cleanly */}
            <button
              onClick={() => setActiveTab('stage')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'stage'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              id="tab-btn-stage"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              1. Extract New Lead
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'database'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              id="tab-btn-database"
            >
              <Folder className="w-4 h-4 shrink-0" />
              2. Organized Database
            </button>
          </div>
        </header>

        {/* Content Body Scrollable Workspace */}
        <div className="flex-1 p-8 overflow-y-auto space-y-6">
          
          {/* Active component render based on dynamic routes */}
          <div className="min-h-[500px]">
            {activeTab === 'stage' ? (
              <div className="animate-fade-in" id="workspace-ocr-stage">
                <OcrScanner
                  folders={folders}
                  currentFolderId={activeFolderId}
                  onLeadAdded={handleAddLead}
                />
              </div>
            ) : (
              <div className="animate-fade-in" id="workspace-lead-database">
                <LeadTable
                  leads={leads}
                  folders={folders}
                  activeFolderId={activeFolderId}
                  onDeleteLead={handleDeleteLead}
                  onUpdateLead={handleUpdateLead}
                  onMoveLead={handleMoveLeadFolder}
                />
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
}
