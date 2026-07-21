/**
 * parseCLPdf.ts
 * Parses a Confirmation Letter PDF file and extracts billing data.
 * Uses pdfjs-dist to read raw text from the PDF, then uses regex/heuristics
 * to extract vendor name, items (description, qty, claim cost, amount), and total.
 */

export interface CLItem {
  no: number;
  partName: string;
  qty: number;
  claimCost: number;
  amount: number;
  unitPrice: number;
  subtotal: number;
  totalQty: number;
  qtyNG: number;
  ngActual: number;
  stdAllowance: number;
  qtyClaim: number;
}

export interface ParsedCL {
  supplierName: string;
  supplierAddress: string;
  items: CLItem[];
  vatAmount: number;
  totalAmount: number;
  /** Raw text lines extracted from the PDF for debugging */
  rawLines: string[];
}

/** Strip thousands separators and parse as integer */
function parseNum(s: string): number {
  return parseInt(s.replace(/[,.\s]/g, "").replace(/[^0-9]/g, ""), 10) || 0;
}

/**
 * Main entry point: reads a File object (PDF) and returns ParsedCL.
 * Throws if the file cannot be parsed.
 */
export async function parseCLPdf(file: File): Promise<ParsedCL> {
  // Dynamically import pdfjs-dist to avoid SSR issues in Next.js
  const pdfjsLib = await import("pdfjs-dist");

  // Point the worker at the bundled worker script
  // pdfjs-dist ships a pre-built worker; we reference it via CDN fallback for reliability
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Collect all text from all pages
  const allLines: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    // Each item in content.items is a TextItem; join items on the same y-line
    const items = content.items as Array<{ str: string; transform: number[] }>;

    // Group by approximate y-position (rounded to 1 decimal)
    const yMap = new Map<number, string[]>();
    for (const item of items) {
      const y = Math.round(item.transform[5] * 10) / 10;
      if (!yMap.has(y)) yMap.set(y, []);
      yMap.get(y)!.push(item.str);
    }

    // Sort by descending y (top → bottom) then join each line
    const sortedYs = Array.from(yMap.keys()).sort((a, b) => b - a);
    for (const y of sortedYs) {
      const lineText = yMap.get(y)!.join(" ").trim();
      if (lineText) allLines.push(lineText);
    }
  }

  return extractCLData(allLines);
}

/** Parse extracted text lines into structured CL data */
function extractCLData(lines: string[]): ParsedCL {
  let supplierName = "";
  let supplierAddress = "";
  const items: CLItem[] = [];
  let vatAmount = 0;
  let totalAmount = 0;

  // ── 1. Find "To:" block to get vendor name ─────────────────────────────────
  // The PDF format is:
  //   To:
  //   <Vendor Name>, PT.
  //   <Address line 1>
  //   <Address line 2>
  const toIdx = lines.findIndex(l => /^To\s*:/i.test(l.trim()));
  if (toIdx !== -1 && toIdx + 1 < lines.length) {
    supplierName = lines[toIdx + 1].trim();
    if (toIdx + 2 < lines.length) {
      supplierAddress = lines[toIdx + 2].trim();
    }
  }

  // ── 2. Find table rows ──────────────────────────────────────────────────────
  // Table header: No | Description | Qty | Claim Cost | Amount (IDR)
  // Data rows look like:  "1  HUB CLUTCH, IMV 683N  14  49,516  693,224"
  // We look for lines where the first token is a small integer, followed by text + numbers

  // A row pattern: starts with a digit (row number), then description, then 3 numbers
  // We'll scan all lines and try to parse
  const tableHeaderIdx = lines.findIndex(l =>
    /description/i.test(l) && /qty/i.test(l) && /claim/i.test(l)
  );

  if (tableHeaderIdx !== -1) {
    // Process lines after the table header until we hit "Total" or end
    for (let i = tableHeaderIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Stop conditions
      if (/^total\b/i.test(line)) {
        // Extract total amount from this line
        const nums = line.match(/[\d,]+/g);
        if (nums && nums.length > 0) {
          totalAmount = parseNum(nums[nums.length - 1]);
        }
        break;
      }

      // VAT line
      if (/^vat\b/i.test(line)) {
        const nums = line.match(/[\d,]+/g);
        if (nums && nums.length > 0) {
          vatAmount = parseNum(nums[nums.length - 1]);
        }
        continue;
      }

      // Try to match a data row: <number> <description text> <qty> <claimCost> <amount>
      // Pattern: optional leading number, then text, then 2-3 numbers at end
      const rowMatch = line.match(
        /^(\d+)\s+(.+?)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s*$/
      );
      if (rowMatch) {
        const no = parseInt(rowMatch[1], 10);
        const partName = rowMatch[2].trim();
        const qty = parseNum(rowMatch[3]);
        const claimCost = parseNum(rowMatch[4]);
        const amount = parseNum(rowMatch[5]);
        items.push({
          no,
          partName,
          qty,
          claimCost,
          unitPrice: claimCost,
          amount,
          subtotal: amount,
          totalQty: qty * 100, // approximate; not in the CL PDF
          qtyNG: qty,
          ngActual: 1.0,
          stdAllowance: 0,
          qtyClaim: qty,
        });
        continue;
      }

      // Alternative pattern without leading number
      const rowMatch2 = line.match(/^(.+?)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s*$/);
      if (rowMatch2 && items.length > 0) {
        // Could be a continuation or unlabeled row, skip
      }
    }
  }

  // ── 3. Fallback: if no table found, try a looser scan ─────────────────────
  if (items.length === 0) {
    // Look for lines with pattern: word(s) + 2-3 numbers
    let rowNo = 1;
    for (const line of lines) {
      const m = line.match(/^(.+?)\s+([\d,]{2,})\s+([\d,]{2,})\s+([\d,]{2,})\s*$/);
      if (m) {
        const partName = m[1].trim();
        if (/^(No|Description|Total|VAT|Based)/i.test(partName)) continue;
        const qty = parseNum(m[2]);
        const claimCost = parseNum(m[3]);
        const amount = parseNum(m[4]);
        if (qty > 0 && claimCost > 0 && amount > 0) {
          items.push({
            no: rowNo++,
            partName,
            qty,
            claimCost,
            unitPrice: claimCost,
            amount,
            subtotal: amount,
            totalQty: qty * 100,
            qtyNG: qty,
            ngActual: 1.0,
            stdAllowance: 0,
            qtyClaim: qty,
          });
        }
      }
    }
  }

  // ── 4. If still no total, compute from items + VAT ────────────────────────
  if (totalAmount === 0 && items.length > 0) {
    totalAmount = items.reduce((s, it) => s + it.amount, 0) + vatAmount;
  }

  return { supplierName, supplierAddress, items, vatAmount, totalAmount, rawLines: lines };
}
