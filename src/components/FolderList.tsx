/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Folder, FolderPlus, Trash2, Hash, ShieldCheck } from 'lucide-react';
import { Folder as FolderType } from '../types';

interface FolderListProps {
  folders: FolderType[];
  activeFolderId: string;
  onSelectFolder: (id: string) => void;
  onCreateFolder: (name: string, description: string, color: string) => void;
  onDeleteFolder: (id: string) => void;
  leadCounts: Record<string, number>;
}

const PRESET_COLORS = [
  { name: 'Indigo', value: 'border-indigo-500 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100', dot: 'bg-indigo-500' },
  { name: 'Emerald', value: 'border-emerald-500 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100', dot: 'bg-emerald-500' },
  { name: 'Amber', value: 'border-amber-500 bg-amber-50/50 text-amber-700 hover:bg-amber-100', dot: 'bg-amber-500' },
  { name: 'Rose', value: 'border-rose-500 bg-rose-50/50 text-rose-700 hover:bg-rose-100', dot: 'bg-rose-500' },
  { name: 'Cyan', value: 'border-cyan-500 bg-cyan-50/50 text-cyan-700 hover:bg-cyan-100', dot: 'bg-cyan-500' },
];

export default function FolderList({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  leadCounts,
}: FolderListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderDesc.trim(), selectedColor);
    setNewFolderName('');
    setNewFolderDesc('');
    setIsCreating(false);
  };

  const totalAllLeads = Object.values(leadCounts).reduce((acc, count) => acc + count, 0);

  return (
    <aside className="w-66 bg-slate-900 border-r border-slate-850 flex flex-col h-full shrink-0 justify-between text-slate-350 select-none" id="sidebar-folder-sync">
      
      {/* Sidebar Header Brand block matches Q4 Real Estate theme logo style */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8.5 h-8.5 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-550/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-white tracking-tight text-lg leading-tight">LeadSync</span>
            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold">Local Extractor</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-2">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Collections</p>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="p-1 px-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold"
            title="Create and organize new folder"
            id="btn-add-folder"
          >
            <FolderPlus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>

      {/* Embedded form to insert folder */}
      {isCreating && (
        <div className="px-6 mb-4 animate-fade-in">
          <form onSubmit={handleSubmit} className="p-3.5 bg-slate-950/45 rounded-xl border border-slate-800 text-[11px] flex flex-col gap-2.5 shadow-inner">
            <div>
              <label className="block font-bold text-slate-400 mb-1">Folder Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Inbound Leads"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">Description (Optional)</label>
              <textarea
                placeholder="Brief description..."
                rows={2}
                value={newFolderDesc}
                onChange={e => setNewFolderDesc(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 font-bold transition-all"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Folders Navigation List */}
      <div className="flex-grow overflow-y-auto space-y-1 px-4 scrollbar-thin">
        {/* All Leads Group */}
        <button
          onClick={() => onSelectFolder('all')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all text-left ${
            activeFolderId === 'all'
              ? 'bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500 font-bold shadow-xs'
              : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
          }`}
          id="folder-btn-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Hash className={`w-4 h-4 ${activeFolderId === 'all' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span className="truncate">All Leads Pool</span>
          </div>
          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
            activeFolderId === 'all' ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-800 text-slate-400'
          }`}>
            {totalAllLeads}
          </span>
        </button>

        {/* Dynamic customized leads folders */}
        <div className="pt-2.5 space-y-1">
          {folders.length === 0 ? (
            <div className="text-center py-5 px-3 bg-slate-950/20 rounded-xl border border-dashed border-slate-805">
              <p className="text-[10px] text-slate-500">No database folders compiled yet.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="text-[10px] font-bold text-indigo-400 mt-1.5 hover:underline hover:text-indigo-300 block w-full"
              >
                + Create custom folder
              </button>
            </div>
          ) : (
            folders.map(folder => {
              const count = leadCounts[folder.id] || 0;
              const isActive = activeFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  className={`group relative flex items-center rounded-lg text-xs transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                  id={`folder-btn-${folder.id}`}
                >
                  <button
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex-1 flex flex-col px-3 py-2 text-left focus:outline-none min-w-0"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className={`w-4 h-4 shrink-0 col-span-1 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className="truncate block font-medium">{folder.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded shrink-0 ml-1.5 ${
                        isActive ? 'bg-indigo-500/35 text-indigo-200' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </div>
                    {folder.description && (
                      <span className="text-[10px] text-slate-500 font-normal truncate mt-0.5 max-w-[150px]">
                        {folder.description}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteFolder(folder.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-slate-500 hover:text-rose-450 hover:bg-rose-950/40 rounded transition-all shrink-0 z-1"
                    title="Remove folder (Leads will be safe inside pool)"
                    id={`btn-delete-folder-${folder.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

    </aside>
  );
}
