/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Util to draw high-fidelity simulated enrollment/quiz forms onto a canvas for actual tesseract.js scanning!
// This satisfies the request for local handwriting processing completely client-side.

export function drawStudentQuizForm(
  canvas: HTMLCanvasElement,
  data: {
    parentName: string;
    childName: string;
    classGrade: string;
    email: string;
    address: string;
    phone?: string;
  }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas dimensions
  canvas.width = 600;
  canvas.height = 750;

  // Outer Background - Soft turquoise gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#1a73e8');
  bgGrad.addColorStop(0.3, '#34a853');
  bgGrad.addColorStop(1, '#0f9d58');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative Circles in Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(60, 80, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(540, 150, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(200, 700, 120, 0, Math.PI * 2);
  ctx.fill();

  // Draw Header Banner
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  // Round rect
  const rx = 20, ry = 20, rw = 560, rh = 130;
  ctx.roundRect ? ctx.roundRect(20, 20, rw, rh, 16) : ctx.rect(20, 20, rw, rh);
  ctx.fill();

  // Banner Header Text
  ctx.fillStyle = '#1e3a8a';
  ctx.font = '900 34px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STUDENT QUIZ:', canvas.width / 2, 70);

  ctx.fillStyle = '#2563eb';
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('TEST YOUR KNOWLEDGE!', canvas.width / 2, 105);

  // Draw Cute Kids Avatars placeholder
  ctx.fillStyle = '#fef08a'; // yellowish stage
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(20, 165, 560, 140, 12) : ctx.rect(20, 165, 560, 140);
  ctx.fill();

  // Draw stick children on the stage
  const childPositions = [100, 200, 300, 400, 500];
  const childColors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc'];
  
  childPositions.forEach((x, idx) => {
    // Head
    ctx.fillStyle = childColors[idx];
    ctx.beginPath();
    ctx.arc(x, 210, 18, 0, Math.PI * 2);
    ctx.fill();
    // Happy face
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, 210, 10, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 6, 205, 3, 0, Math.PI * 2);
    ctx.arc(x + 6, 205, 3, 0, Math.PI * 2);
    ctx.fill();
    // Body / Shirt (Triangle/trapezoid)
    ctx.fillStyle = childColors[idx];
    ctx.beginPath();
    ctx.moveTo(x - 22, 280);
    ctx.lineTo(x + 22, 280);
    ctx.lineTo(x + 12, 232);
    ctx.lineTo(x - 12, 232);
    ctx.closePath();
    ctx.fill();
    // Book / Accessory
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText('✏️', x, 255);
  });

  // Main Lead Registration Card (White background with gold border)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(20, 320, 560, 360, 16) : ctx.rect(20, 320, 560, 360);
  ctx.fill();

  // Elegant golden decorative borders
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 332, 536, 336);

  // Field Labels (Printed text)
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'left';
  ctx.lineWidth = 1;
  ctx.font = '700 20px "Courier New", Courier, monospace'; // monospace printed look

  const startY = 380;
  const gapY = 54;

  const fields = [
    { label: 'Parent Name:', value: data.parentName },
    { label: 'Child Name:', value: data.childName },
    { label: 'Class/Grade:', value: data.classGrade },
    { label: 'Email:', value: data.email },
    { label: 'Address:', value: data.address },
  ];

  if (data.phone) {
    fields.push({ label: 'Phone:', value: data.phone });
  }

  fields.forEach((field, idx) => {
    const y = startY + idx * gapY;
    
    // Draw Label text
    ctx.fillStyle = '#111827';
    ctx.font = '700 18px Arial, sans-serif';
    ctx.fillText(field.label, 48, y);

    // Draw Handwriting Guide Line (dashed lines)
    const labelWidth = ctx.measureText(field.label).width;
    const lineStartX = 55 + labelWidth;
    ctx.strokeStyle = '#9ca3af';
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(lineStartX, y + 4);
    ctx.lineTo(540, y + 4);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw Private Client Handwriting text (using handwritten font style)
    ctx.fillStyle = '#2563eb'; // Deep signature blue pen ink
    ctx.font = 'italic 500 23px "Comic Sans MS", "Chalkboard SE", "Brush Script MT", cursive';
    // Center-ish on the handwritten line
    ctx.fillText(field.value, lineStartX + 10, y - 2);
  });

  // Return challenge footers
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FILL OUT & RETURN  -OR-  CONTACT US: offline_hq@leads.local', canvas.width / 2, 650);

  // Draw a cute watermark indicating "SECURE LOCAL HANDWRITING PROCESSING"
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(140, 700, 320, 34, 17) : ctx.rect(140, 700, 320, 34);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('🔒 COMPLETE DATA PRIVACY • 100% OFFLINE', canvas.width / 2, 721);
}

export const PRESET_SAMPLES = [
  {
    id: 'quiz-sujal',
    name: 'Sample Quiz',
    description: 'Match exact user screenshot with parent Sujal',
    parentName: 'Sujal',
    childName: 'singh ka beta',
    classGrade: '8th class',
    email: 'Sujal1234@gmail.com',
    address: 'new ashok nagar',
    phone: '9876543210'
  },
  {
    id: 'admission-beckham',
    name: 'School Admission Form',
    description: 'Kensington school registration form sample',
    parentName: 'David Beckham',
    childName: 'Romeo Beckham',
    classGrade: '10th grade',
    email: 'david.b@sportsmail.co.uk',
    address: '12 Kensington Palace Gdns, London',
    phone: '+44 20 7946 0192'
  },
  {
    id: 'camp-sharapova',
    name: 'Tennis Camp Enrollment',
    description: 'Florida youth sports camp signup card',
    parentName: 'Maria Sharapova',
    childName: 'Leo Sharapov',
    classGrade: '5th class',
    email: 'm.shara@tennisacademy.org',
    address: '45 Coral Gables, Miami, FL',
    phone: '305-555-0143'
  }
];
