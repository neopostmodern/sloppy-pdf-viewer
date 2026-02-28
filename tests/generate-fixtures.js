import { PDFDocument, StandardFonts, rgb, PDFName, PDFHexString } from 'pdf-lib';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

mkdirSync(fixturesDir, { recursive: true });

async function createSimplePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= 3; i++) {
    const page = doc.addPage([612, 792]); // US Letter
    page.drawText(`Page ${i}`, {
      x: 50,
      y: 700,
      size: 36,
      font,
      color: rgb(0, 0, 0),
    });
  }

  const bytes = await doc.save();
  writeFileSync(join(fixturesDir, 'simple.pdf'), bytes);
  console.log('Created simple.pdf (3 pages)');
}

async function createSearchablePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1: various searchable text
  const page1 = doc.addPage([612, 792]);
  const lines = [
    'The quick brown fox jumps over the lazy dog.',
    'FOX is an uppercase word for case testing.',
    'word word word repeated for whole word testing.',
    'This is a test document for find functionality.',
  ];
  lines.forEach((line, idx) => {
    page1.drawText(line, {
      x: 50,
      y: 700 - idx * 40,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
  });

  // Page 2: more text
  const page2 = doc.addPage([612, 792]);
  const lines2 = [
    'resume and résumé for diacritics testing.',
    'Another fox appears here for multi-page search.',
    'End of searchable document.',
  ];
  lines2.forEach((line, idx) => {
    page2.drawText(line, {
      x: 50,
      y: 700 - idx * 40,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
  });

  const bytes = await doc.save();
  writeFileSync(join(fixturesDir, 'searchable.pdf'), bytes);
  console.log('Created searchable.pdf (2 pages)');
}

async function createWithOutlinePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const pages = [];
  for (let i = 1; i <= 3; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText(`Chapter ${i}`, {
      x: 50,
      y: 700,
      size: 36,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Content for chapter ${i}`, {
      x: 50,
      y: 650,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
    pages.push(page);
  }

  // Add outline/bookmarks using the PDF document catalog
  const pageRefs = pages.map((p) => p.ref);

  // Build outline tree manually via the low-level PDFDocument context
  const context = doc.context;

  // Create outline items (last to first so we can link them)
  // Note: Title must be a PDFHexString (not PDFName which context.obj() would create from strings)
  const dict3 = context.obj({
    Dest: [pageRefs[2], 'Fit'],
  });
  dict3.set(PDFName.of('Title'), PDFHexString.fromText('Chapter 3'));
  const item3 = context.register(dict3);

  const dict2 = context.obj({
    Dest: [pageRefs[1], 'Fit'],
    Next: item3,
  });
  dict2.set(PDFName.of('Title'), PDFHexString.fromText('Chapter 2'));
  const item2 = context.register(dict2);

  const dict1 = context.obj({
    Dest: [pageRefs[0], 'Fit'],
    Next: item2,
  });
  dict1.set(PDFName.of('Title'), PDFHexString.fromText('Chapter 1'));
  const item1 = context.register(dict1);

  // Set Prev links
  context.lookup(item2).set(PDFName.of('Prev'), item1);
  context.lookup(item3).set(PDFName.of('Prev'), item2);

  // Create outline root
  const outlineRoot = context.register(
    context.obj({
      Type: 'Outlines',
      First: item1,
      Last: item3,
      Count: 3,
    })
  );

  // Set parent refs
  context.lookup(item1).set(PDFName.of('Parent'), outlineRoot);
  context.lookup(item2).set(PDFName.of('Parent'), outlineRoot);
  context.lookup(item3).set(PDFName.of('Parent'), outlineRoot);

  // Set outline root on catalog
  doc.catalog.set(PDFName.of('Outlines'), outlineRoot);

  const bytes = await doc.save();
  writeFileSync(join(fixturesDir, 'with-outline.pdf'), bytes);
  console.log('Created with-outline.pdf (3 pages with outline)');
}

await createSimplePdf();
await createSearchablePdf();
await createWithOutlinePdf();

console.log('All fixtures generated.');
