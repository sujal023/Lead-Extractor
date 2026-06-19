/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead } from '../types';

/**
 * Intelligent client-side NLP-style parser. Maps raw OCR words and multi-line handwriting outputs
 * to structured lead entities safely, strictly adhering to privacy goals.
 */
export function parseOcrText(rawText: string): Partial<Lead> {
  const result: Partial<Lead> = {
    parentName: '',
    childName: '',
    classGrade: '',
    email: '',
    address: '',
    phone: '',
    notes: '',
  };

  if (!rawText) return result;

  // Split into lines and clean whitespace
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Helper patterns matching labels (with tolerance for handwritten OCR typos)
  const parentMatchers = [/parent\s*name/i, /parent/i, /father/i, /mother/i, /guardian/i, /sponsor/i];
  const childMatchers = [/child\s*name/i, /child/i, /student\s*name/i, /student/i, /son/i, /daughter/i, /kid/i];
  const classMatchers = [/class\s*[\/|\|]\s*grade/i, /class/i, /grade/i, /standard/i, /std/i, /year/i];
  const emailMatchers = [/email/i, /e-mail/i, /mail/i, /email\s*address/i];
  const addressMatchers = [/address/i, /addr/i, /location/i, /residency/i, /street/i];
  const phoneMatchers = [/phone/i, /contact/i, /mobile/i, /tel/i, /telephone/i, /ph\.?/i];

  // Store lines that haven't been matched yet to use as fallback notes or custom attributes
  const unmatchedLines: string[] = [];

  // Try standard line-by-line parsing first
  lines.forEach(line => {
    let matched = false;

    // Clean up typical form delimiters, dashes, or OCR visual dividers
    const cleanLineContent = (val: string) => {
      return val
        .replace(/^[:;=\-\s•\._]+/, '') // Leading punctuations/dividers
        .replace(/^[-\s•\._]+[:;=\s]/, '') // Delimiter combos
        .replace(/[_|\-\s:.]{2,}/g, ' ') // Multiple underscores or dashes
        .trim();
    };

    // Sub-function to extract value after key
    const getValueAfterLabel = (lineStr: string, regexList: RegExp[]): string | null => {
      for (const matcher of regexList) {
        const match = lineStr.match(matcher);
        if (match && match.index !== undefined) {
          const matchedAnchor = match[0];
          const remainingPart = lineStr.substring(match.index + matchedAnchor.length);
          // Only return if it actually has content after cleaning
          const cleaned = cleanLineContent(remainingPart);
          if (cleaned.length > 0) {
            return cleaned;
          }
        }
      }
      return null;
    };

    // Check parent name
    const parentVal = getValueAfterLabel(line, parentMatchers);
    if (parentVal && !result.parentName) {
      result.parentName = parentVal;
      matched = true;
    }

    // Check child name
    const childVal = getValueAfterLabel(line, childMatchers);
    if (childVal && !result.childName) {
      result.childName = childVal;
      matched = true;
    }

    // Check class grade
    const classVal = getValueAfterLabel(line, classMatchers);
    if (classVal && !result.classGrade) {
      result.classGrade = classVal;
      matched = true;
    }

    // Check email
    const emailVal = getValueAfterLabel(line, emailMatchers);
    if (emailVal && !result.email) {
      // Clean up common OCR artifacts in emails (e.g. spaces around @ or dots)
      result.email = emailVal.replace(/\s+/g, '');
      matched = true;
    }

    // Check address
    const addressVal = getValueAfterLabel(line, addressMatchers);
    if (addressVal && !result.address) {
      result.address = addressVal;
      matched = true;
    }

    // Check phone
    const phoneVal = getValueAfterLabel(line, phoneMatchers);
    if (phoneVal && !result.phone) {
      result.phone = phoneVal;
      matched = true;
    }

    if (!matched) {
      unmatchedLines.push(line);
    }
  });

  // FALLBACK SCANNING: If key-value fields are still empty, scan whole text with regex or contextual cues
  const fullRaw = rawText.replace(/\r/g, ' ');

  // 1. Regex to catch ANY valid email anywhere in the text
  if (!result.email) {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const foundEmail = fullRaw.match(emailRegex);
    if (foundEmail) {
      result.email = foundEmail[1].trim();
    }
  }

  // 2. Regex to catch valid-looking phone numbers
  if (!result.phone) {
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const foundPhones = fullRaw.match(phoneRegex);
    if (foundPhones && foundPhones.length > 0) {
      result.phone = foundPhones[0].trim();
    }
  }

  // 3. Fallbacks based on typical text blocks if labels were missed entirely
  if (!result.parentName && lines[0] && !lines[0].toLowerCase().includes('quiz') && !lines[0].toLowerCase().includes('test')) {
    // If the first line is simply "Parent Name: Sujal" but without label, parse
    const rawFirstLine = lines[0];
    if (rawFirstLine.split(' ').length <= 4) {
      result.parentName = rawFirstLine;
    }
  }

  // Trim or set default descriptive notes
  if (unmatchedLines.length > 0) {
    result.notes = `Extracted from raw text. Unmatched details:\n${unmatchedLines.slice(0, 5).join('\n')}`;
  } else {
    result.notes = 'Fully resolved fields locally.';
  }

  return result;
}

/**
 * Format OCR logs for the console output in the application
 */
export function generateLog(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
  return {
    id: Math.random().toString(36).substring(2),
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
  };
}
