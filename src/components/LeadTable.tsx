/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, Download, Trash2, Edit2, FolderInput, CheckCircle2, 
  HelpCircle, MoreHorizontal, User, Mail, MapPin, GraduationCap, Phone, Calendar, Clock
} from 'lucide-react';
import { Lead, Folder } from '../types';

interface LeadTableProps {
  leads: Lead[];
  folders: Folder[];
  activeFolderId: string;
  onDeleteLead: (id: string) => void;
  onUpdateLead: (lead: Lead) => void;
  onMoveLead: (leadId: string, folderId: string) => void;
}

export default function LeadTable({
  leads,
  folders,
  activeFolderId,
  onDeleteLead,
  onUpdateLead,
  onMoveLead,
}: LeadTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  
  // Inline edit state
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  // Filter leads by search query and status filter
  const filteredLeads = leads
    .filter(lead => {
      // Must belong to active folder or active is 'all'
      if (activeFolderId !== 'all' && lead.folderId !== activeFolderId) {
        return false;
      }
      return true;
    })
    .filter(lead => {
      // Match status
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .filter(lead => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        lead.parentName.toLowerCase().includes(query) ||
        lead.childName.toLowerCase().includes(query) ||
        lead.classGrade.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.address.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query)
      );
    });

  // Export to Excel sheet using the 'xlsx' package
  const exportToExcel = () => {
    if (filteredLeads.length === 0) {
      alert('No leads available to export in this folder filter view.');
      return;
    }

    // Format leads for cleaner spreadsheet columns
    const formattedData = filteredLeads.map((lead, idx) => ({
      'S.No': idx + 1,
      'Name': lead.parentName,
      'Child Name/Student Name': lead.childName,
      'Class/Grade': lead.classGrade,
      'Email ID': lead.email,
      'Contact Phone': lead.phone || 'N/A',
      'Residential Address': lead.address,
      'Lead Status': lead.status,
      'Date Extracted': new Date(lead.createdAt).toLocaleDateString(),
      'Source Folder': folders.find(f => f.id === lead.folderId)?.name || 'General Pool',
      'Raw Scan Notes': lead.notes || ''
    }));

    // Create local worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Adjust column widths automatically for clean spreadsheet styling
    const maxLens = Object.keys(formattedData[0] || {}).map(() => 15);
    formattedData.forEach(row => {
      Object.values(row).forEach((val, colIdx) => {
        const len = String(val || '').length;
        if (len > maxLens[colIdx]) {
          maxLens[colIdx] = Math.min(len, 45); // Limit column width to 45 max for ease
        }
      });
    });
    worksheet['!cols'] = maxLens.map(w => ({ wch: w + 2 }));

    // Create workbook and download
    const workbook = XLSX.utils.book_new();
    const folderName = activeFolderId === 'all' ? 'All_Leads' : (folders.find(f => f.id === activeFolderId)?.name || 'Folder_Leads');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Leads');
    
    // Trigger download
    XLSX.writeFile(workbook, `Extracted_Leads_${folderName.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleStartEdit = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditForm({ ...lead });
  };

  const handleSaveInline = () => {
    if (editingLeadId && editForm) {
      onUpdateLead(editForm as Lead);
      setEditingLeadId(null);
    }
  };

  // Status Style Maps
  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Qualified':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Follow-Up':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Lost':
        return 'bg-slate-50 text-slate-700 border border-slate-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5" id="leads-table-container">
      
      {/* Search and export controller */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-slate-50">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, student, class, address or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50/50"
              id="search-leads-input"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 bg-white min-w-[130px]"
            id="filter-status-select"
          >
            <option value="all">🔍 All Statuses</option>
            <option value="New">🔵 New</option>
            <option value="Contacted">🟡 Contacted</option>
            <option value="Qualified">🟢 Qualified</option>
            <option value="Follow-Up">🟣 Follow-Up</option>
            <option value="Lost">⚫ Lost</option>
          </select>
        </div>

        {/* Export and stats */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-450 mr-2 font-mono font-medium">
            Showing {filteredLeads.length} of {leads.length} leads
          </span>

          <button
            onClick={exportToExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0"
            id="btn-export-excel"
          >
            <Download className="w-4 h-4" />
            Export Clean Excel
          </button>
        </div>
      </div>

      {editingLeadId && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-205">
            <h4 className="font-bold text-slate-800 flex items-center gap-1">
              <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
              Quick Edit Extracted Lead
            </h4>
            <div className="flex gap-1.5">
              <button
                onClick={() => setEditingLeadId(null)}
                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-md font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInline}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 animate-pulse"
              >
                Save Changes
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-bold">Name</label>
              <input
                type="text"
                value={editForm.parentName || ''}
                onChange={e => setEditForm({ ...editForm, parentName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-bold">Child/Student Name</label>
              <input
                type="text"
                value={editForm.childName || ''}
                onChange={e => setEditForm({ ...editForm, childName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-bold">Class / Grade</label>
              <input
                type="text"
                value={editForm.classGrade || ''}
                onChange={e => setEditForm({ ...editForm, classGrade: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-bold">Email</label>
              <input
                type="email"
                value={editForm.email || ''}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-bold">Phone Number</label>
              <input
                type="text"
                value={editForm.phone || ''}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-bold">Status Pipeline</label>
              <select
                value={editForm.status || 'New'}
                onChange={e => setEditForm({ ...editForm, status: e.target.value as Lead['status'] })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              >
                <option value="New">🔵 New</option>
                <option value="Contacted">🟡 Contacted</option>
                <option value="Qualified">🟢 Qualified</option>
                <option value="Follow-Up">🟣 Follow-Up</option>
                <option value="Lost">⚫ Lost</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] text-slate-500 mb-1 font-bold">Address</label>
              <input
                type="text"
                value={editForm.address || ''}
                onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table presentation */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full border-collapse text-left text-xs text-slate-600">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="px-5 py-3 shadow-inner">Lead Info (Name / Child)</th>
              <th className="px-5 py-3">Class/Grade</th>
              <th className="px-5 py-3">Contact Email</th>
              <th className="px-5 py-3">Address & Phone</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date Added</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 px-4 text-slate-400 font-normal">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <p className="font-bold text-slate-700 text-sm">No Extracted Leads Found</p>
                    <p className="text-xs text-slate-400 mt-1">Run an OCR Scan on the simulator panel on the left or change active filters, and the structured leads will land right here!</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                  
                  {/* Lead Info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-start gap-2.5 min-w-[150px]">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block truncate leading-tight" title={lead.parentName}>
                          {lead.parentName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5 leading-snug">
                          Student: {lead.childName || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Class / Grade */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{lead.classGrade || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Contact Email */}
                  <td className="px-5 py-3.5">
                    {lead.email ? (
                      <a 
                        href={`mailto:${lead.email}`} 
                        className="flex items-center gap-1.5 text-indigo-650 hover:underline min-w-[120px] font-semibold break-all"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {lead.email}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">No email</span>
                    )}
                  </td>

                  {/* Address & Phone */}
                  <td className="px-5 py-3.5">
                    <div className="max-w-[200px] flex flex-col gap-1">
                      {lead.phone && (
                        <span className="text-slate-700 font-mono text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.address && (
                        <span className="text-slate-500 truncate block text-[11px] flex items-center gap-1" title={lead.address}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {lead.address}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Pipeline Status */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[10px]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* Trigger operations & actions */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      
                      {/* Move Folder trigger selection */}
                      <div className="relative inline-block text-left">
                        <select
                          title="Move Lead Folder"
                          value={lead.folderId}
                          onChange={e => onMoveLead(lead.id, e.target.value)}
                          className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white hover:border-slate-300 focus:outline-none transition-colors mr-1.5 font-bold"
                        >
                          <option value="all">📁 Move (All Pool)</option>
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>
                              📁 {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleStartEdit(lead)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Edit lead"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                        title="Delete lead"
                        id={`btn-delete-lead-${lead.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-indigo-50/20 rounded-xl border border-dashed border-indigo-100 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-905 flex-1">
          <p className="font-bold text-indigo-900">Offline Spreadsheet Interoperability</p>
          <p className="text-indigo-700 leading-relaxed mt-0.5">Clicking "Export Clean Excel" runs automatic cell geometry alignments completely inside the browser client thread. This will download a genuine multi-column `.xlsx` table document compatible directly with Microsoft Excel, Google Sheets, or LibreOffice, protecting privacy end-to-end.</p>
        </div>
      </div>

    </div>
  );
}
