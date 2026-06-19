/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lead {
  id: string;
  folderId: string; // "all" or specific folder ID
  parentName: string;
  childName: string;
  classGrade: string;
  email: string;
  address: string;
  phone: string;
  createdAt: string;
  ocrTextRaw: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Follow-Up' | 'Lost';
  notes: string;
  customFields?: Record<string, string>;
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  color: string; // hex or Tailwind color class prefix
  createdAt: string;
}

export interface ParsingLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface SampleImage {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  mockRawText: string; // Fallback or accurate simulation if browser canvas fails
}
