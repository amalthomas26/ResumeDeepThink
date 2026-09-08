import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function generateFixtures() {
  const fixturesDir = path.join(__dirname);

  // 1. Clean Resume PDF
  const cleanTxt = fs.readFileSync(path.join(fixturesDir, 'clean-resume.txt'), 'utf-8');
  const cleanDoc = await PDFDocument.create();
  const font = await cleanDoc.embedFont(StandardFonts.Helvetica);
  
  let page = cleanDoc.addPage([612, 792]);
  const lines = cleanTxt.split('\n');
  let y = 750;

  for (const line of lines) {
    if (y < 40) {
      page = cleanDoc.addPage([612, 792]);
      y = 750;
    }
    const cleanLine = line.replace(/[\r\t]/g, ' ').slice(0, 95);
    page.drawText(cleanLine, {
      x: 40,
      y,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 14;
  }
  const cleanPdfBytes = await cleanDoc.save();
  fs.writeFileSync(path.join(fixturesDir, 'clean-resume.pdf'), cleanPdfBytes);

  // 2. Scanned / Image-Only Resume PDF (blank page with no text layer)
  const scannedDoc = await PDFDocument.create();
  scannedDoc.addPage([612, 792]);
  const scannedPdfBytes = await scannedDoc.save();
  fs.writeFileSync(path.join(fixturesDir, 'scanned-image-resume.pdf'), scannedPdfBytes);

  console.log('PDF fixtures generated successfully.');
}

generateFixtures().catch(console.error);
