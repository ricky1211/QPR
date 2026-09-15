import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfGeneratorService {
  private getAssetPath(filename: string): string | null {
    const candidatePaths = [
      path.join(process.cwd(), 'assets', filename),
      path.join(process.cwd(), '..', 'Front-End', 'public', filename),
      path.join(__dirname, '..', '..', '..', 'assets', filename),
      path.join(__dirname, '..', '..', '..', '..', 'Front-End', 'public', filename),
      path.join('d:', 'MTM', 'QPR', 'QPR', 'Back-End', 'assets', filename),
      path.join('d:', 'MTM', 'QPR', 'QPR', 'Front-End', 'public', filename),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return null;
  }

  private formatSupplierForLetter(name?: string): string {
    if (!name) return 'Anugerah Daya Industri Komponen Utama, PT.';
    let clean = name.trim();
    if (/^PT\.?\s+/i.test(clean)) {
      clean = clean.replace(/^PT\.?\s+/i, '').trim() + ', PT.';
    } else if (!clean.endsWith(', PT.') && !clean.endsWith(', PT')) {
      clean = `${clean}, PT.`;
    }
    return clean;
  }

  /**
   * Generates a 1:1 pixel-accurate vector PDF for Confirmation Letter
   */
  async generateConfirmationLetterPdf(
    cl: any,
    vendorNameInput?: string,
    dueDateInput?: string,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 32, bottom: 32, left: 36, right: 36 },
          bufferPages: true,
          autoFirstPage: true,
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const leftMargin = 36;
        const rightMargin = pageWidth - 36;
        const contentWidth = rightMargin - leftMargin;

        const clNum = cl?.clNumber || 'CL-DRAFT';
        const qprNum =
          cl?.qpr?.qprNumber ||
          cl?.qprNumber ||
          (Array.isArray(cl?.qprNumbers) ? cl.qprNumbers.join(', ') : '01/QI/QPR/SUB/09/26');
        const rawVendorName = cl?.vendor?.vendorName || cl?.supplierName || vendorNameInput || 'PT. ARAI RUBBER SEAL IND';
        const formattedVendor = this.formatSupplierForLetter(rawVendorName);

        const dateObj = cl?.dateSent ? new Date(cl.dateSent) : new Date();
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];
        const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

        // 1. Header (Logos & Top Border)
        let currentY = 32;
        const logoMtmPath = this.getAssetPath('logo-mtm.png') || this.getAssetPath('logo-mtm.jpg');
        const stikerPath = this.getAssetPath('stiker.png');

        if (logoMtmPath) {
          doc.image(logoMtmPath, leftMargin, currentY, { height: 26 });
        } else {
          doc.font('Times-Bold').fontSize(14).text('MenaraTerusMakmur, PT', leftMargin, currentY);
        }

        if (stikerPath) {
          doc.image(stikerPath, rightMargin - 95, currentY, { height: 26 });
        }

        currentY += 34;
        doc
          .lineWidth(2)
          .moveTo(leftMargin, currentY)
          .lineTo(rightMargin, currentY)
          .stroke('#000000');

        currentY += 12;

        // 2. Title
        doc
          .font('Times-Bold')
          .fontSize(15)
          .text('CONFIRMATION LETTER', leftMargin, currentY, {
            width: contentWidth,
            align: 'center',
          });

        currentY += 22;

        // 3. Date (Right Aligned)
        doc
          .font('Times-Bold')
          .fontSize(10)
          .text(`Cikarang, ${formattedDate}`, leftMargin, currentY, {
            width: contentWidth,
            align: 'right',
          });

        currentY += 16;

        // 4. Recipient Details
        doc.font('Times-Bold').fontSize(10).text('To:', leftMargin, currentY);
        currentY += 13;
        doc.font('Times-Bold').fontSize(10.5).text(formattedVendor, leftMargin, currentY);
        currentY += 13;
        doc
          .font('Times-Roman')
          .fontSize(9.5)
          .text(cl?.supplierAddress || 'Jl. Science Timur I Blok A 5H', leftMargin, currentY);
        currentY += 12;
        doc
          .font('Times-Roman')
          .fontSize(9.5)
          .text(cl?.supplierCity || 'Cikarang Timur, Bekasi, Jawa Barat 17530', leftMargin, currentY);

        currentY += 18;

        // 5. Standard Opening Body Text
        doc
          .font('Times-Roman')
          .fontSize(9.5)
          .text(
            'According to quality problem report (QPR) that we have checked at Menara Terus Makmur, PT.:',
            leftMargin,
            currentY,
            { width: contentWidth, align: 'justify', lineGap: 2 },
          );
        currentY += 16;

        doc.text(
          'We would like to confirm to you that we have agreed if it is found some NG parts which are not caused by our internal process. NG parts and loss can be seen as follows:',
          leftMargin,
          currentY,
          { width: contentWidth, align: 'justify', lineGap: 2 },
        );
        currentY += 26;

        // 6. Financial Calculation & Items Table
        const parts = cl?.items || cl?.qpr?.qprParts || [];
        let dpp = 0;
        const rowData: Array<{
          no: number;
          desc: string;
          qty: number;
          price: number;
          amount: number;
        }> = [];

        if (parts.length > 0) {
          parts.forEach((p: any, idx: number) => {
            const desc =
              p.partName ||
              p.part?.partDesc ||
              p.part?.partNumber ||
              p.description ||
              'INNER TUBE,650 A';
            const qtyVal =
              p.qtyClaim !== undefined && p.qtyClaim !== null
                ? p.qtyClaim
                : p.billableQty !== undefined
                ? p.billableQty
                : p.qtyNg !== undefined
                ? p.qtyNg
                : p.qtyNG !== undefined
                ? p.qtyNG
                : p.qty || 25;
            const priceVal =
              typeof p.unitPrice === 'number'
                ? p.unitPrice
                : parseFloat(String(p.unitPrice || '85000')) || 85000;
            const amountVal = p.amount ?? p.subtotal ?? qtyVal * priceVal;
            dpp += amountVal;

            rowData.push({
              no: idx + 1,
              desc,
              qty: qtyVal,
              price: priceVal,
              amount: amountVal,
            });
          });
        } else {
          const rawTotal = Number(cl?.amount || 2358750);
          dpp = rawTotal > 0 ? Math.round(rawTotal / 1.11) : 2125000;
          rowData.push({
            no: 1,
            desc: cl?.partName || 'INNER TUBE,650 A',
            qty: cl?.qty || 25,
            price: 85000,
            amount: dpp,
          });
        }

        const rawClTotal = Number(cl?.amount || 0);
        let vat = Math.round(dpp * 0.11);
        let total = dpp + vat;
        if (rawClTotal > 0 && Math.abs(rawClTotal - total) <= 2) {
          total = rawClTotal;
        }

        // Table Column Specifications (Total width = contentWidth = 523.28)
        const colWidths = {
          no: 34,
          desc: 215,
          qty: 60,
          price: 94,
          amount: 120.28,
        };

        const tableX = leftMargin;
        const colX = {
          no: tableX,
          desc: tableX + colWidths.no,
          qty: tableX + colWidths.no + colWidths.desc,
          price: tableX + colWidths.no + colWidths.desc + colWidths.qty,
          amount: tableX + colWidths.no + colWidths.desc + colWidths.qty + colWidths.price,
        };

        // Header Row
        const headerHeight = 22;
        doc
          .rect(tableX, currentY, contentWidth, headerHeight)
          .fillAndStroke('#edf2f7', '#000000');

        doc.fillColor('#000000').font('Times-Bold').fontSize(9.5);
        doc.text('No', colX.no, currentY + 6, { width: colWidths.no, align: 'center' });
        doc.text('Description', colX.desc, currentY + 6, { width: colWidths.desc, align: 'center' });
        doc.text('Qty', colX.qty, currentY + 6, { width: colWidths.qty, align: 'center' });
        doc.text('Claim Cost', colX.price, currentY + 6, { width: colWidths.price, align: 'center' });
        doc.text('Amount (IDR)', colX.amount, currentY + 6, { width: colWidths.amount - 6, align: 'right' });

        // Vertical column lines for header
        doc
          .lineWidth(1)
          .moveTo(colX.desc, currentY)
          .lineTo(colX.desc, currentY + headerHeight)
          .moveTo(colX.qty, currentY)
          .lineTo(colX.qty, currentY + headerHeight)
          .moveTo(colX.price, currentY)
          .lineTo(colX.price, currentY + headerHeight)
          .moveTo(colX.amount, currentY)
          .lineTo(colX.amount, currentY + headerHeight)
          .stroke('#000000');

        currentY += headerHeight;

        // Item Rows
        const rowHeight = 20;
        rowData.forEach((row) => {
          doc
            .rect(tableX, currentY, contentWidth, rowHeight)
            .stroke('#000000');

          // Vertical dividers
          doc
            .moveTo(colX.desc, currentY)
            .lineTo(colX.desc, currentY + rowHeight)
            .moveTo(colX.qty, currentY)
            .lineTo(colX.qty, currentY + rowHeight)
            .moveTo(colX.price, currentY)
            .lineTo(colX.price, currentY + rowHeight)
            .moveTo(colX.amount, currentY)
            .lineTo(colX.amount, currentY + rowHeight)
            .stroke('#000000');

          doc.fillColor('#000000').font('Times-Roman').fontSize(9);
          doc.text(String(row.no), colX.no, currentY + 5, { width: colWidths.no, align: 'center' });

          doc.font('Times-Bold').text(row.desc, colX.desc + 6, currentY + 5, { width: colWidths.desc - 10, align: 'left' });

          doc.font('Times-Roman').text(row.qty.toLocaleString('id-ID'), colX.qty, currentY + 5, { width: colWidths.qty, align: 'center' });

          doc.text(row.price.toLocaleString('id-ID'), colX.price, currentY + 5, { width: colWidths.price, align: 'center' });

          doc.font('Times-Bold').text(row.amount.toLocaleString('id-ID'), colX.amount, currentY + 5, { width: colWidths.amount - 6, align: 'right' });

          currentY += rowHeight;
        });

        // VAT (11%) Row
        const vatHeight = 18;
        doc
          .rect(tableX, currentY, contentWidth, vatHeight)
          .stroke('#000000');
        doc
          .moveTo(colX.desc, currentY)
          .lineTo(colX.desc, currentY + vatHeight)
          .moveTo(colX.amount, currentY)
          .lineTo(colX.amount, currentY + vatHeight)
          .stroke('#000000');

        doc.fillColor('#000000').font('Times-Bold').fontSize(9);
        doc.text('VAT (11%)', colX.desc + 6, currentY + 4, { align: 'left' });
        doc.text(vat.toLocaleString('id-ID'), colX.amount, currentY + 4, { width: colWidths.amount - 6, align: 'right' });
        currentY += vatHeight;

        // Total Row with double underline
        const totalHeight = 20;
        doc
          .rect(tableX, currentY, contentWidth, totalHeight)
          .stroke('#000000');
        doc
          .moveTo(colX.desc, currentY)
          .lineTo(colX.desc, currentY + totalHeight)
          .moveTo(colX.amount, currentY)
          .lineTo(colX.amount, currentY + totalHeight)
          .stroke('#000000');

        doc.fillColor('#000000').font('Times-Bold').fontSize(10);
        doc.text('Total', colX.desc + 6, currentY + 5, { align: 'left' });
        doc.text(total.toLocaleString('id-ID'), colX.amount, currentY + 5, { width: colWidths.amount - 6, align: 'right' });

        // Double underline bottom border for amount
        doc
          .lineWidth(1)
          .moveTo(colX.amount, currentY + totalHeight - 2)
          .lineTo(tableX + contentWidth, currentY + totalHeight - 2)
          .moveTo(colX.amount, currentY + totalHeight - 4)
          .lineTo(tableX + contentWidth, currentY + totalHeight - 4)
          .stroke('#000000');

        currentY += totalHeight + 14;

        // 7. Closing Statement (10 Working Days Notice)
        doc
          .font('Times-Roman')
          .fontSize(9.5)
          .text(
            `Based on the data above, we will proceed with deducting the amount directly from the payment to ${formattedVendor} if we do not receive any confirmation within 10 (ten) working days. We look forward to your confirmation.`,
            leftMargin,
            currentY,
            { width: contentWidth, align: 'justify', lineGap: 2 },
          );
        currentY += 28;

        // 8. Attachment Notice
        doc.font('Times-Bold').fontSize(9.5).text('Attachment :', leftMargin, currentY);
        currentY += 12;
        doc
          .font('Times-Bold')
          .fontSize(10)
          .text(`QPR Number : ${qprNum}`, leftMargin, currentY);
        currentY += 20;

        // 9. Signatures Block
        doc.font('Times-Roman').fontSize(9.5).text('Yours Faithfully,', leftMargin, currentY);
        currentY += 12;
        doc.font('Times-Bold').fontSize(10.5).text('MenaraTerusMakmur, PT', leftMargin, currentY);
        currentY += 12;
        doc.font('Times-Roman').fontSize(9).text('Accounting & Finance Departement', leftMargin, currentY);
        currentY += 10;

        // Left Signature (Accounting) & Right Signature (Vendor)
        const sigY = currentY;
        const aninditaSigPath = this.getAssetPath('TTD-Anindita.jpeg');

        if (aninditaSigPath) {
          doc.image(aninditaSigPath, leftMargin, sigY, { height: 38 });
        }

        // Left Signer Text
        doc
          .font('Times-Bold')
          .fontSize(9.5)
          .text('Anindita Imilaningtyas', leftMargin, sigY + 42, { underline: true });
        doc
          .font('Times-Roman')
          .fontSize(8.5)
          .text('Dep. Head Accounting & Finance', leftMargin, sigY + 54);

        // Right Signer (Vendor)
        const rightSigX = rightMargin - 200;
        doc
          .font('Times-Bold')
          .fontSize(9.5)
          .text('Approved', rightSigX, sigY + 2, { width: 200, align: 'right' });
        doc
          .font('Times-Bold')
          .fontSize(9.5)
          .text(rawVendorName, rightSigX, sigY + 42, { width: 200, align: 'right', underline: true });
        doc
          .font('Times-Roman')
          .fontSize(8.5)
          .text('Vendor', rightSigX, sigY + 54, { width: 200, align: 'right' });

        // 10. Footer at bottom of page
        const footerY = pageHeight - 48;
        doc
          .lineWidth(1.5)
          .moveTo(leftMargin, footerY)
          .lineTo(rightMargin, footerY)
          .stroke('#000000');

        doc
          .font('Times-Bold')
          .fontSize(7.5)
          .text(
            'PT Menara Terus Makmur - Manufacturer : Forging Parts, Mechanical Jacks, Hand Tools & Machining Parts',
            leftMargin,
            footerY + 5,
            { width: contentWidth, align: 'center' },
          );

        doc
          .font('Times-Roman')
          .fontSize(6.8)
          .text(
            'Jl. Jababeka XI Blok H.3 - 12 Kawasan Industri Jababeka, Cikarang Utara, Kabupaten Bekasi, Jawa Barat - Indonesia 17530 / Telp. : +62-21-8934504 Fax. : +62-21-8934505',
            leftMargin,
            footerY + 16,
            { width: contentWidth, align: 'center' },
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generates a 1:1 pixel-accurate vector PDF for Quality Problem Report (PR4-FRM-08101)
   */
  async generateQprPdf(qpr: any): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 26, bottom: 26, left: 28, right: 28 },
          bufferPages: true,
          autoFirstPage: true,
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const leftMargin = 28;
        const rightMargin = pageWidth - 28;
        const contentWidth = rightMargin - leftMargin;

        const qprNum = qpr?.qprNumber || '01/QI/QPR/SUB/09/26';
        const rawVendorName = qpr?.vendor?.vendorName || qpr?.supplierName || 'PT TEMARU ENGINEERING INDONESIA';
        const parts = qpr?.qprParts || qpr?.parts || qpr?.items || [];
        const mainPart = parts[0]?.part?.partDesc || parts[0]?.partName || qpr?.partName || 'ALL TYPE PART FINISH';
        const mainPartNum = parts[0]?.part?.partNumber || parts[0]?.partNumber || qpr?.partNumber || 'IT-650';

        const dateObj = qpr?.date ? new Date(qpr.date) : new Date();
        const months = [
          'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
          'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
        ];
        const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

        let currentY = 26;

        // Outer Document Frame
        const frameHeight = pageHeight - 52;
        doc
          .rect(leftMargin, currentY, contentWidth, frameHeight)
          .lineWidth(1.2)
          .stroke('#000000');

        // 1. Company Header (Inner)
        const headerHeight = 44;
        const logoMtmPath = this.getAssetPath('logo-mtm.jpg') || this.getAssetPath('logo-mtm.png');
        if (logoMtmPath) {
          doc.image(logoMtmPath, leftMargin + 8, currentY + 9, { height: 26 });
        }

        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5);
        doc.text('PT MENARA TERUS MAKMUR', leftMargin + 130, currentY + 6, {
          width: contentWidth - 230,
          align: 'center',
        });

        doc.font('Helvetica').fontSize(6.8);
        doc.text(
          'Jl. Jababeka XI Blok H 1 No. 12, Jababeka Industrial Estate\n17530 CIKARANG BEKASI INDONESIA\nTELP: (62-21) 8934504, FAX: (62-21) 8934505',
          leftMargin + 130,
          currentY + 17,
          { width: contentWidth - 230, align: 'center', lineGap: 1.5 },
        );

        doc.font('Helvetica-Bold').fontSize(7.5);
        doc.text('(PR4-FRM-08101)', rightMargin - 90, currentY + 16, { width: 80, align: 'right' });

        currentY += headerHeight;
        doc.lineWidth(1).moveTo(leftMargin, currentY).lineTo(rightMargin, currentY).stroke('#000000');

        // 2. Title Banner
        const titleHeight = 28;
        doc
          .rect(leftMargin, currentY, contentWidth, titleHeight)
          .fillAndStroke('#ffffff', '#000000');

        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(14);
        doc.text('QUALITY PROBLEM REPORT', leftMargin, currentY + 4, { width: contentWidth, align: 'center' });
        doc.fontSize(7.5).text('( PR4-FRM-08101 )', leftMargin, currentY + 18, { width: contentWidth, align: 'center' });

        currentY += titleHeight;

        // 3. Supplier Info & Document Info (Two columns)
        const infoHeight = 126;
        const leftColWidth = 300;
        const rightColWidth = contentWidth - leftColWidth;
        const dividerX = leftMargin + leftColWidth;

        doc.rect(leftMargin, currentY, contentWidth, infoHeight).stroke('#000000');
        doc.moveTo(dividerX, currentY).lineTo(dividerX, currentY + infoHeight).stroke('#000000');

        // Left Column (Supplier Details)
        doc
          .rect(leftMargin, currentY, leftColWidth, 14)
          .fillAndStroke('#f1f5f9', '#000000');
        doc
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .text('SUPPLIER / VENDOR', leftMargin + 6, currentY + 3.5);

        let leftY = currentY + 18;
        doc.font('Helvetica-Bold').fontSize(9.5).text(rawVendorName, leftMargin + 6, leftY);
        leftY += 14;

        const infoItems = [
          { label: 'Part Name', val: mainPart },
          { label: 'Part Number', val: mainPartNum },
          { label: 'Model', val: qpr?.model || '-' },
          { label: 'Lot/Batch', val: qpr?.lotBatch || '-' },
          { label: 'Date', val: formattedDate },
          { label: 'Problem', val: qpr?.problem || 'Dimensi out of tolerance pada bagian komponen yang diverifikasi.' },
        ];

        doc.font('Helvetica').fontSize(7.5);
        infoItems.forEach((item) => {
          doc.font('Helvetica-Bold').text(item.label, leftMargin + 6, leftY, { width: 75 });
          doc.font('Helvetica').text(`: ${item.val}`, leftMargin + 75, leftY, { width: leftColWidth - 85 });
          leftY += 11.5;
        });

        // Right Column (Document Status & Info)
        let rightY = currentY;
        const rightRows = [
          { label: 'Doc No.', val: qprNum },
          { label: 'Revision', val: 'A' },
          { label: 'Issue Date', val: formattedDate },
        ];

        rightRows.forEach((r) => {
          doc.rect(dividerX, rightY, rightColWidth, 14).stroke('#000000');
          doc.font('Helvetica-Bold').fontSize(7).text(r.label, dividerX + 6, rightY + 3.5, { width: 65 });
          doc.font('Helvetica-Bold').fontSize(7).text(`: ${r.val}`, dividerX + 70, rightY + 3.5);
          rightY += 14;
        });

        // Sub-boxes inside right column
        const subBoxHeight = infoHeight - 42;
        const subMidX = dividerX + 115;
        doc.moveTo(subMidX, rightY).lineTo(subMidX, currentY + infoHeight).stroke('#000000');

        // Sub Left: Problem Occurrence
        doc.rect(dividerX, rightY, 115, 12).fillAndStroke('#f1f5f9', '#000000');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(6.5).text('Problem Occurance in 1 yr', dividerX + 4, rightY + 2.5);

        doc.font('Helvetica').fontSize(6.5);
        doc.text('1st time', dividerX + 6, rightY + 16);
        doc.rect(dividerX + 90, rightY + 15, 8, 8).stroke('#000000');

        doc.text('More Than one', dividerX + 6, rightY + 28);
        doc.rect(dividerX + 90, rightY + 27, 8, 8).fillAndStroke('#ef4444', '#000000'); // checked

        doc.font('Helvetica-Bold').fontSize(6.5).text('REF. TO NCR NO :', dividerX + 4, rightY + 44);
        doc.font('Helvetica-Bold').fontSize(6.5).text(qpr?.refNcrNumber || 'NCR/2026/09/005', dividerX + 4, rightY + 54);

        // Sub Right: STATUS + PART CATEGORY + NO QPR
        doc.rect(subMidX, rightY, rightColWidth - 115, 12).fillAndStroke('#f1f5f9', '#000000');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(6.5).text('STATUS', subMidX, rightY + 2.5, { width: rightColWidth - 115, align: 'center' });

        doc.font('Helvetica').fontSize(6);
        doc.text('Rework', subMidX + 4, rightY + 16);
        doc.rect(subMidX + 28, rightY + 15, 6, 6).stroke('#000000');

        doc.text('Return', subMidX + 42, rightY + 16);
        doc.rect(subMidX + 64, rightY + 15, 6, 6).stroke('#000000');

        doc.text('Reject', subMidX + 78, rightY + 16);
        doc.rect(subMidX + 102, rightY + 15, 6, 6).fillAndStroke('#ef4444', '#000000'); // checked

        doc.rect(subMidX, rightY + 26, rightColWidth - 115, 12).fillAndStroke('#f1f5f9', '#000000');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(6.5).text('PART CATEGORY', subMidX, rightY + 28.5, { width: rightColWidth - 115, align: 'center' });

        doc.font('Helvetica').fontSize(6);
        doc.text('Ordinary', subMidX + 2, rightY + 42);
        doc.rect(subMidX + 28, rightY + 41, 6, 6).stroke('#000000');

        doc.text('Function', subMidX + 40, rightY + 42);
        doc.rect(subMidX + 66, rightY + 41, 6, 6).fillAndStroke('#ef4444', '#000000'); // checked

        doc.text('Safety', subMidX + 78, rightY + 42);
        doc.rect(subMidX + 102, rightY + 41, 6, 6).stroke('#000000');

        doc.fillColor('#b91c1c').font('Helvetica-Bold').fontSize(7.5);
        doc.text(`NO QPR : ${qprNum}`, subMidX + 4, rightY + 58, { width: rightColWidth - 120 });

        currentY += infoHeight;

        // 4. Parts Table (PR4-FRM-08101 format)
        const colWidths = {
          no: 24,
          name: 155,
          totalQty: 65,
          qtyNg: 60,
          ngActual: 65,
          stdNg: 85,
          qtyClaim: 85.28,
        };

        const colX = {
          no: leftMargin,
          name: leftMargin + colWidths.no,
          totalQty: leftMargin + colWidths.no + colWidths.name,
          qtyNg: leftMargin + colWidths.no + colWidths.name + colWidths.totalQty,
          ngActual: leftMargin + colWidths.no + colWidths.name + colWidths.totalQty + colWidths.qtyNg,
          stdNg: leftMargin + colWidths.no + colWidths.name + colWidths.totalQty + colWidths.qtyNg + colWidths.ngActual,
          qtyClaim: leftMargin + colWidths.no + colWidths.name + colWidths.totalQty + colWidths.qtyNg + colWidths.ngActual + colWidths.stdNg,
        };

        const tableHeaderHeight = 22;
        doc.rect(leftMargin, currentY, contentWidth, tableHeaderHeight).stroke('#000000');

        // Header Backgrounds
        doc.rect(colX.no, currentY, colWidths.no, tableHeaderHeight).fillAndStroke('#f1f5f9', '#000000');
        doc.rect(colX.name, currentY, colWidths.name, tableHeaderHeight).fillAndStroke('#f1f5f9', '#000000');
        doc.rect(colX.totalQty, currentY, colWidths.totalQty, tableHeaderHeight).fillAndStroke('#f1f5f9', '#000000');
        doc.rect(colX.qtyNg, currentY, colWidths.qtyNg, tableHeaderHeight).fillAndStroke('#f1f5f9', '#000000');
        doc.rect(colX.ngActual, currentY, colWidths.ngActual, tableHeaderHeight).fillAndStroke('#ffffcc', '#000000');
        doc.rect(colX.stdNg, currentY, colWidths.stdNg, tableHeaderHeight).fillAndStroke('#dcfce7', '#000000');
        doc.rect(colX.qtyClaim, currentY, colWidths.qtyClaim, tableHeaderHeight).fillAndStroke('#fee2e2', '#000000');

        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(6.5);
        doc.text('NO', colX.no, currentY + 7, { width: colWidths.no, align: 'center' });
        doc.text('PART NAME', colX.name, currentY + 7, { width: colWidths.name, align: 'center' });
        doc.text('TOTAL QTY\n(PCS)', colX.totalQty, currentY + 3.5, { width: colWidths.totalQty, align: 'center' });
        doc.text('QTY NG\n(PCS)', colX.qtyNg, currentY + 3.5, { width: colWidths.qtyNg, align: 'center' });
        doc.text('NG ACTUAL\n(%)', colX.ngActual, currentY + 3.5, { width: colWidths.ngActual, align: 'center' });
        doc.text('STD NG ALLOWANCE\n0.5% (PCS)', colX.stdNg, currentY + 3.5, { width: colWidths.stdNg, align: 'center' });
        doc.text('QTY CLAIM\n(PCS)', colX.qtyClaim, currentY + 3.5, { width: colWidths.qtyClaim, align: 'center' });

        currentY += tableHeaderHeight;

        // Render Table Rows (min 4 rows)
        const tableParts = parts.length > 0 ? parts : [
          {
            partName: mainPart,
            totalQty: qpr?.totalQty || 1000,
            qtyNg: qpr?.totalQtyNg || qpr?.rejectItems || 25,
            stdAllowance: qpr?.totalStdAllowance || 5,
            qtyClaim: qpr?.billableQty || 20,
          }
        ];

        const rowHeight = 18;
        const totalRows = Math.max(4, tableParts.length);

        for (let i = 0; i < totalRows; i++) {
          const item = tableParts[i];
          doc.rect(leftMargin, currentY, contentWidth, rowHeight).stroke('#000000');

          // Dividers
          Object.values(colX).forEach((x) => {
            doc.moveTo(x, currentY).lineTo(x, currentY + rowHeight).stroke('#000000');
          });

          if (item) {
            const pName = item.part?.partDesc || item.partName || item.description || 'BRB GN5';
            const tQty = item.totalQty || 1000;
            const ng = item.qtyNg !== undefined ? item.qtyNg : item.qtyNG !== undefined ? item.qtyNG : (item.qty || 25);
            const std = item.stdAllowance !== undefined ? item.stdAllowance : Math.round(tQty * 0.005);
            const ngPct = tQty > 0 ? ((ng / tQty) * 100).toFixed(2) : '0.00';
            const claim = item.qtyClaim !== undefined ? item.qtyClaim : (item.billableQty || ng - std);

            doc.fillColor('#000000').font('Helvetica').fontSize(7);
            doc.text(String(i + 1), colX.no, currentY + 5, { width: colWidths.no, align: 'center' });
            doc.font('Helvetica-Bold').text(pName, colX.name + 4, currentY + 5, { width: colWidths.name - 8, align: 'left' });
            doc.font('Helvetica').text(tQty.toLocaleString('id-ID'), colX.totalQty, currentY + 5, { width: colWidths.totalQty, align: 'center' });
            doc.text(ng.toLocaleString('id-ID'), colX.qtyNg, currentY + 5, { width: colWidths.qtyNg, align: 'center' });
            doc.font('Helvetica-Bold').fillColor('#b91c1c').text(`${ngPct}%`, colX.ngActual, currentY + 5, { width: colWidths.ngActual, align: 'center' });
            doc.fillColor('#000000').font('Helvetica').text(std.toLocaleString('id-ID'), colX.stdNg, currentY + 5, { width: colWidths.stdNg, align: 'center' });
            doc.font('Helvetica-Bold').text(claim.toLocaleString('id-ID'), colX.qtyClaim, currentY + 5, { width: colWidths.qtyClaim, align: 'center' });
          }

          currentY += rowHeight;
        }

        // 5. Remarks Section
        const remarksHeight = 65;
        doc.rect(leftMargin, currentY, contentWidth, remarksHeight).stroke('#000000');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7.5).text('REMARKS :', leftMargin + 8, currentY + 6);
        doc.font('Helvetica').fontSize(7.5).text(
          qpr?.remarks ||
            'Komponen non-conforming telah diverifikasi oleh QA Dept. Sesuai keputusan claim, penyesuaian biaya dibebankan pada Confirmation Letter terlampir.',
          leftMargin + 65,
          currentY + 6,
          { width: contentWidth - 75, lineGap: 3 },
        );

        currentY += remarksHeight;

        // 6. Jenis Claim (Left) + Signatures Block (Right)
        const bottomSectionHeight = frameHeight - (currentY - 26);
        const splitX = leftMargin + 200;

        doc.rect(leftMargin, currentY, contentWidth, bottomSectionHeight).stroke('#000000');
        doc.moveTo(splitX, currentY).lineTo(splitX, currentY + bottomSectionHeight).stroke('#000000');

        // JENIS CLAIM Checkboxes
        const claimOptions = [
          'MATERIAL', 'PAINTING/PLATING',
          'PROSES PACKING', 'PARKEREZING',
          'PROSES CHECK', 'HEAT TREATMENT',
          'PROSES FORGING', 'PROSES M/C',
        ];

        let optY = currentY + 8;
        const claimTypes = Array.isArray(qpr?.claimType)
          ? qpr.claimType
          : typeof qpr?.claimType === 'string'
          ? qpr.claimType.split(',')
          : ['MATERIAL', 'PROSES M/C'];

        for (let i = 0; i < claimOptions.length; i += 2) {
          const opt1 = claimOptions[i];
          const opt2 = claimOptions[i + 1];

          // Col 1
          const checked1 = claimTypes.some((c: string) => c.trim().toUpperCase() === opt1);
          doc.rect(leftMargin + 8, optY, 7, 7).stroke('#000000');
          if (checked1) {
            doc.fillColor('#dc2626').font('Helvetica-Bold').fontSize(6).text('V', leftMargin + 9, optY + 0.5);
          }
          doc.fillColor('#000000').font('Helvetica').fontSize(6.5).text(opt1, leftMargin + 18, optY + 0.5);

          // Col 2
          if (opt2) {
            const checked2 = claimTypes.some((c: string) => c.trim().toUpperCase() === opt2);
            doc.rect(leftMargin + 105, optY, 7, 7).stroke('#000000');
            if (checked2) {
              doc.fillColor('#dc2626').font('Helvetica-Bold').fontSize(6).text('V', leftMargin + 106, optY + 0.5);
            }
            doc.fillColor('#000000').font('Helvetica').fontSize(6.5).text(opt2, leftMargin + 115, optY + 0.5);
          }

          optY += 12;
        }

        // Signatures Block on Right (5 columns)
        const sigColWidth = (contentWidth - 200) / 5;
        const dateHeaderHeight = 14;

        doc.rect(splitX, currentY, contentWidth - 200, dateHeaderHeight).fillAndStroke('#f8fafc', '#000000');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7).text(`Cikarang, ${formattedDate}`, splitX, currentY + 3.5, {
          width: contentWidth - 200,
          align: 'center',
        });

        const signers = [
          { type: 'Prepared', name: 'Deny M.', role: '(Creator)', img: 'TTD-DENY.M.png' },
          { type: 'Checked', name: 'Septian N.', role: '(Section Head)', img: 'TTD-PakSeptian.jpeg' },
          { type: 'Approved', name: 'Septian N.', role: '(Dept. Head Quality)', img: 'TTD-PakSeptian.jpeg' },
          { type: 'Approved', name: 'Putu R. S.', role: '(Div. Head)', img: 'TTD-PakPutu.jpeg' },
          { type: 'Acknowledged', name: 'Irvan H. N.', role: '(Purchasing)', img: 'TTD-PURCHASING.jpeg' },
        ];

        const sigBodyY = currentY + dateHeaderHeight;
        const sigBodyHeight = bottomSectionHeight - dateHeaderHeight;

        signers.forEach((s, idx) => {
          const colXPos = splitX + idx * sigColWidth;
          doc.rect(colXPos, sigBodyY, sigColWidth, sigBodyHeight).stroke('#000000');

          // Header Type
          doc.rect(colXPos, sigBodyY, sigColWidth, 12).fillAndStroke('#f8fafc', '#000000');
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(6.5).text(s.type, colXPos, sigBodyY + 2.5, {
            width: sigColWidth,
            align: 'center',
          });

          // Signature Image
          const sigImgPath = this.getAssetPath(s.img);
          if (sigImgPath) {
            doc.image(sigImgPath, colXPos + 6, sigBodyY + 16, { width: sigColWidth - 12, height: 26, fit: [sigColWidth - 12, 26], align: 'center' });
          }

          // Name & Role at Bottom
          const nameY = sigBodyY + sigBodyHeight - 20;
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(6).text(s.name, colXPos, nameY, {
            width: sigColWidth,
            align: 'center',
            underline: true,
          });
          doc.font('Helvetica').fontSize(5.5).text(s.role, colXPos, nameY + 8, {
            width: sigColWidth,
            align: 'center',
          });
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
