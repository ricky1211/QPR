import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding master data...');

  // 1. Seed Master Roles
  const rolesData = [
    { name: 'QA/QC Operator (Foreman)', code: 'foreman', description: 'Membuat dokumen QPR' },
    { name: 'QA Section Head', code: 'qa_section_head', description: 'Approval QPR level Section Head' },
    { name: 'QA Dept Head', code: 'qa_dept_head', description: 'Approval QPR level Dept Head' },
    { name: 'QA Division Head', code: 'div_head', description: 'Approval QPR level Division Head' },
    { name: 'Purchasing Departemen', code: 'purchasing', description: 'Membuat CL, memantau QPR/CL approval as acknowledge' },
    { name: 'Dept Accounting', code: 'accounting', description: 'Approval Confirmation Letter (CL)' },
    { name: 'Finance Accounting', code: 'finance', description: 'Membuat SSC Billing & Payments' },
    { name: 'System Administrator', code: 'admin', description: 'Akses penuh sistem dan master data' },
  ];

  const roleMap: Record<string, any> = {};
  for (const r of rolesData) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { code: r.code, description: r.description },
      create: { name: r.name, code: r.code, description: r.description },
    });
    roleMap[r.name] = roleRecord;
    if (r.code) roleMap[r.code] = roleRecord;
  }
  console.log(`Seeded ${rolesData.length} master roles.`);

  // 2. Seed Users (Inspectors / Admins / Employees) with multiple roles support
  const usersData = [
    {
      name: 'Administrator',
      npk: 999,
      role: 'System Administrator',
      roles: ['System Administrator'],
      status: 'Aktif',
    },
    {
      name: 'Septian Nugraha',
      npk: 2301,
      role: 'QA Section Head, QA Dept Head',
      roles: ['QA Section Head', 'QA Dept Head'],
      status: 'Aktif',
    },
    {
      name: 'Deny Maulana',
      npk: 3079,
      role: 'QA/QC Operator (Foreman)',
      roles: ['QA/QC Operator (Foreman)'],
      status: 'Aktif',
    },
    {
      name: 'Hendrik S.',
      npk: 890,
      role: 'QA/QC Operator (Foreman)',
      roles: ['QA/QC Operator (Foreman)'],
      status: 'Aktif',
    },
    {
      name: 'Putu Ratna Saputra',
      npk: 1335,
      role: 'QA Division Head',
      roles: ['QA Division Head'],
      status: 'Aktif',
    },
    {
      name: 'Cicik Andria',
      npk: 3790,
      role: 'Purchasing Departemen',
      roles: ['Purchasing Departemen'],
      status: 'Aktif',
    },
    {
      name: 'Irvan H. N.',
      npk: 1175,
      role: 'Purchasing Departemen',
      roles: ['Purchasing Departemen'],
      status: 'Aktif',
    },
    {
      name: 'Anindita Irnilaningtyas',
      npk: 3123,
      role: 'Dept Accounting',
      roles: ['Dept Accounting'],
      status: 'Aktif',
    },
    {
      name: 'Bagas Nur Pratama',
      npk: 3616,
      role: 'Finance Accounting',
      roles: ['Finance Accounting'],
      status: 'Aktif',
    },
  ];

  const seededUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { npk: u.npk },
      update: { name: u.name, role: u.role, status: u.status },
      create: { name: u.name, npk: u.npk, role: u.role, status: u.status },
    });

    // Sync UserRole table
    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    for (const rName of u.roles) {
      const matchedRole = roleMap[rName];
      if (matchedRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: matchedRole.id,
          },
        });
      }
    }
    seededUsers.push(user);
  }
  console.log(`Seeded ${seededUsers.length} users with many-to-many roles.`);

  // 2. Seed Vendors
  const vendorsData = [
    { vendorCode: '31012100', vendorName: 'PT TEMARU ENGINEERING INDONESIA', status: 'Aktif' },
    { vendorCode: '31012200', vendorName: 'PT ASTRA OTOPARTS TBK', status: 'Aktif' },
    { vendorCode: '31012300', vendorName: 'PT TOYOTA BOSHOKU INDONESIA', status: 'Aktif' },
  ];

  const seededVendors = [];
  for (const v of vendorsData) {
    let vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { vendorCode: v.vendorCode },
          { vendorName: v.vendorName }
        ]
      }
    });

    if (vendor) {
      vendor = await prisma.vendor.update({
        where: { id: vendor.id },
        data: { vendorName: v.vendorName, vendorCode: v.vendorCode, status: v.status }
      });
    } else {
      vendor = await prisma.vendor.create({
        data: { vendorCode: v.vendorCode, vendorName: v.vendorName, status: v.status }
      });
    }
    seededVendors.push(vendor);
  }
  console.log(`Seeded ${seededVendors.length} vendors.`);

  // 3. Seed Parts
  const partsData = [
    { partNumber: 'IT-650', partDesc: 'INNER TUBE,650 A', allowanceRatio: 0.5 },
    { partNumber: 'PIN-880', partDesc: 'PIN PIVOT 880 B', allowanceRatio: 0.5 },
    { partNumber: 'BRK-102', partDesc: 'BRACKET FORGING 102', allowanceRatio: 0.8 },
    { partNumber: 'GL-001', partDesc: 'GUIDE LEVER 001', allowanceRatio: 0.5 },
  ];

  const seededParts = [];
  for (const p of partsData) {
    let part = await prisma.part.findFirst({
      where: {
        OR: [
          { partNumber: p.partNumber },
          { partDesc: p.partDesc }
        ]
      }
    });

    if (part) {
      part = await prisma.part.update({
        where: { id: part.id },
        data: { partDesc: p.partDesc, partNumber: p.partNumber, allowanceRatio: p.allowanceRatio, status: 'Aktif' }
      });
    } else {
      part = await prisma.part.create({
        data: { partNumber: p.partNumber, partDesc: p.partDesc, allowanceRatio: p.allowanceRatio, status: 'Aktif' }
      });
    }
    seededParts.push(part);
  }
  console.log(`Seeded ${seededParts.length} parts.`);

  // 4. Seed VendorParts (Mapping Parts to Vendors)
  console.log('Mapping parts to vendors (VendorPart)...');
  for (let i = 0; i < seededVendors.length; i++) {
    const vendor = seededVendors[i];
    // Map each vendor to specific parts
    const vendorPartsToMap = i === 0 
      ? [seededParts[0], seededParts[1]] 
      : i === 1 
      ? [seededParts[1], seededParts[2]] 
      : [seededParts[2], seededParts[3]];

    for (const part of vendorPartsToMap) {
      await prisma.vendorPart.upsert({
        where: {
          vendorId_partId: {
            vendorId: vendor.id,
            partId: part.id,
          },
        },
        update: {},
        create: {
          vendorId: vendor.id,
          partId: part.id,
        },
      });
    }
  }
  console.log('Vendor-part associations created.');

  // 5. Seed QPRs for testing approval workflow (including Section Head, Dept Head, Div Head, and Purchasing)
  console.log('Seeding QPR mock testing records across all workflow stages...');
  const v1 = seededVendors[0];
  const v2 = seededVendors[1];
  const p1 = seededParts[0];
  const p2 = seededParts[1];

  const qprMockRecords = [
    // Stage 1: Waiting for Section Head
    {
      qprNumber: '01/QI/QPR/SUB/09/26',
      date: new Date('2026-09-01'),
      vendorId: v1.id,
      partId: p1.id,
      status: 'WAITING_APPROVAL' as const,
      requiredRole: 'Section Head',
      refNcrNumber: 'NCR/2026/09/001',
      problem: 'Defect visual scratch & burr pada outer diameter komponen Inner Tube.',
      claimType: 'MATERIAL, PROSES M/C',
      totalQty: 1000,
      totalQtyNg: 30,
      totalStdAllowance: 5,
      billableQty: 25,
      claimAmount: 2125000,
      progress: {},
    },
    // Stage 2: Waiting for Dept Head
    {
      qprNumber: '02/QI/QPR/SUB/09/26',
      date: new Date('2026-09-02'),
      vendorId: v1.id,
      partId: p1.id,
      status: 'WAITING_APPROVAL' as const,
      requiredRole: 'Dept Head',
      refNcrNumber: 'NCR/2026/09/002',
      problem: 'Porous defect pada casting bracket melebihi spesifikasi standar.',
      claimType: 'MATERIAL, PROSES CHECK',
      totalQty: 1200,
      totalQtyNg: 45,
      totalStdAllowance: 6,
      billableQty: 39,
      claimAmount: 3315000,
      progress: {
        checksumSectionHead: Buffer.from('APPROVED_BY_SECTION_HEAD_1788700100'),
        remarksSectionHead: 'Inspeksi sampling lot 09-B menunjukkan 45 pcs NG.',
        approvedAtSectionHead: new Date('2026-09-02T09:00:00Z'),
      },
    },
    // Stage 3: Waiting for Div Head
    {
      qprNumber: '03/QI/QPR/SUB/09/26',
      date: new Date('2026-09-03'),
      vendorId: v2.id,
      partId: p2.id,
      status: 'WAITING_APPROVAL' as const,
      requiredRole: 'Div Head',
      refNcrNumber: 'NCR/2026/09/003',
      problem: 'Ketidaksesuaian dimensi pin poros melebihi toleransi drawing QA.',
      claimType: 'PROSES M/C, HEAT TREATMENT',
      totalQty: 2000,
      totalQtyNg: 60,
      totalStdAllowance: 10,
      billableQty: 50,
      claimAmount: 4250000,
      progress: {
        checksumSectionHead: Buffer.from('APPROVED_BY_SECTION_HEAD_1788700200'),
        remarksSectionHead: 'Disetujui Section Head.',
        approvedAtSectionHead: new Date('2026-09-03T08:30:00Z'),
        checksumDeptHead: Buffer.from('APPROVED_BY_DEPT_HEAD_1788700250'),
        remarksDeptHead: 'Disetujui Dept Head, mohon persetujuan Div Head.',
        approvedAtDeptHead: new Date('2026-09-03T10:00:00Z'),
      },
    },
    // Stage 4: Waiting for Purchasing (Testing login 1175 Irvan H. N. / 3790 Cicik)
    {
      qprNumber: '04/QI/QPR/SUB/09/26',
      date: new Date('2026-09-04'),
      vendorId: v1.id,
      partId: p1.id,
      status: 'WAITING_APPROVAL' as const,
      requiredRole: 'Purchasing',
      refNcrNumber: 'NCR/2026/09/004',
      problem: 'Karat / korosi pada permukaan coating setelah uji salt spray 48 jam.',
      claimType: 'PAINTING/PLATING',
      totalQty: 1500,
      totalQtyNg: 50,
      totalStdAllowance: 7,
      billableQty: 43,
      claimAmount: 3655000,
      progress: {
        checksumSectionHead: Buffer.from('APPROVED_BY_SECTION_HEAD_1788700300'),
        remarksSectionHead: 'Disetujui Section Head.',
        approvedAtSectionHead: new Date('2026-09-04T08:30:00Z'),
        checksumDeptHead: Buffer.from('APPROVED_BY_DEPT_HEAD_1788700350'),
        remarksDeptHead: 'Disetujui Dept Head.',
        approvedAtDeptHead: new Date('2026-09-04T10:00:00Z'),
        checksumDivHead: Buffer.from('APPROVED_BY_DIV_HEAD_1788700400'),
        remarksDivHead: 'Disetujui Div Head. Lanjutkan otorisasi Purchasing dan terbitkan CL.',
        approvedAtDivHead: new Date('2026-09-04T13:30:00Z'),
      },
    },
    // Stage 5: Full Approved by Purchasing (Ready to Create Confirmation Letter / Buat CL)
    {
      qprNumber: '05/QI/QPR/SUB/09/26',
      date: new Date('2026-09-05'),
      vendorId: v1.id,
      partId: p1.id,
      status: 'APPROVED' as const,
      requiredRole: 'Purchasing',
      refNcrNumber: 'NCR/2026/09/005',
      problem: 'Dimensi ulang finish grind out of spec pada batch 09-E.',
      claimType: 'PROSES M/C',
      totalQty: 2500,
      totalQtyNg: 80,
      totalStdAllowance: 12,
      billableQty: 68,
      claimAmount: 5780000,
      progress: {
        checksumSectionHead: Buffer.from('APPROVED_BY_SECTION_HEAD_1788700500'),
        remarksSectionHead: 'Disetujui Section Head.',
        approvedAtSectionHead: new Date('2026-09-05T08:30:00Z'),
        checksumDeptHead: Buffer.from('APPROVED_BY_DEPT_HEAD_1788700550'),
        remarksDeptHead: 'Disetujui Dept Head.',
        approvedAtDeptHead: new Date('2026-09-05T10:00:00Z'),
        checksumDivHead: Buffer.from('APPROVED_BY_DIV_HEAD_1788700600'),
        remarksDivHead: 'Approved Div Head.',
        approvedAtDivHead: new Date('2026-09-05T11:30:00Z'),
        checksumPurchasing: Buffer.from('APPROVED_BY_PURCHASING_1788700650'),
        remarksPurchasing: 'Disetujui Purchasing. Dokumen siap diterbitkan Confirmation Letter.',
        approvedAtPurchasing: new Date('2026-09-05T14:00:00Z'),
      },
    },
  ];

  for (const q of qprMockRecords) {
    const qprRecord = await prisma.qpr.upsert({
      where: { qprNumber: q.qprNumber },
      update: {
        date: q.date,
        status: q.status,
        requiredRole: q.requiredRole,
        refNcrNumber: q.refNcrNumber,
        problem: q.problem,
        claimType: q.claimType,
        totalQty: q.totalQty,
        totalQtyNg: q.totalQtyNg,
        totalStdAllowance: q.totalStdAllowance,
        billableQty: q.billableQty,
        claimAmount: q.claimAmount,
      },
      create: {
        qprNumber: q.qprNumber,
        date: q.date,
        vendorId: q.vendorId,
        status: q.status,
        requiredRole: q.requiredRole,
        refNcrNumber: q.refNcrNumber,
        problem: q.problem,
        claimType: q.claimType,
        totalQty: q.totalQty,
        totalQtyNg: q.totalQtyNg,
        totalStdAllowance: q.totalStdAllowance,
        billableQty: q.billableQty,
        claimAmount: q.claimAmount,
      },
    });

    // Upsert QprPart
    await prisma.qprPart.deleteMany({ where: { qprId: qprRecord.id } });
    await prisma.qprPart.create({
      data: {
        qprId: qprRecord.id,
        partId: q.partId,
        totalQty: q.totalQty,
        qtyNg: q.totalQtyNg,
        stdAllowance: q.totalStdAllowance,
        qtyClaim: q.billableQty,
        unitPrice: 85000,
        taxRate: 0.11,
      },
    });

    // Upsert QprApprovalProgress
    await prisma.qprApprovalProgress.upsert({
      where: { qprId: qprRecord.id },
      update: {
        checksumSectionHead: q.progress.checksumSectionHead || null,
        remarksSectionHead: q.progress.remarksSectionHead || null,
        approvedAtSectionHead: q.progress.approvedAtSectionHead || null,
        checksumDeptHead: q.progress.checksumDeptHead || null,
        remarksDeptHead: q.progress.remarksDeptHead || null,
        approvedAtDeptHead: q.progress.approvedAtDeptHead || null,
        checksumDivHead: q.progress.checksumDivHead || null,
        remarksDivHead: q.progress.remarksDivHead || null,
        approvedAtDivHead: q.progress.approvedAtDivHead || null,
        checksumPurchasing: q.progress.checksumPurchasing || null,
        remarksPurchasing: q.progress.remarksPurchasing || null,
        approvedAtPurchasing: q.progress.approvedAtPurchasing || null,
      },
      create: {
        qprId: qprRecord.id,
        checksumSectionHead: q.progress.checksumSectionHead || null,
        remarksSectionHead: q.progress.remarksSectionHead || null,
        approvedAtSectionHead: q.progress.approvedAtSectionHead || null,
        checksumDeptHead: q.progress.checksumDeptHead || null,
        remarksDeptHead: q.progress.remarksDeptHead || null,
        approvedAtDeptHead: q.progress.approvedAtDeptHead || null,
        checksumDivHead: q.progress.checksumDivHead || null,
        remarksDivHead: q.progress.remarksDivHead || null,
        approvedAtDivHead: q.progress.approvedAtDivHead || null,
        checksumPurchasing: q.progress.checksumPurchasing || null,
        remarksPurchasing: q.progress.remarksPurchasing || null,
        approvedAtPurchasing: q.progress.approvedAtPurchasing || null,
      },
    });
  }
  console.log(`Seeded ${qprMockRecords.length} QPR workflow testing records.`);

  // 6. Seed Confirmation Letters (CL) across stages
  console.log('Seeding Confirmation Letters testing records...');
  const seededQprs = await prisma.qpr.findMany();
  const fullApprovedQpr = seededQprs.find(q => q.status === 'APPROVED') || seededQprs[0];

  if (fullApprovedQpr) {
    const clRecord = await prisma.confirmationLetter.upsert({
      where: { clNumber: 'CL/MTM/2026/09/001' },
      update: {
        amount: 5780000,
        status: 'PENDING',
        purchasingSentCl: false,
        vendorApproved: false,
      },
      create: {
        clNumber: 'CL/MTM/2026/09/001',
        dateSent: new Date('2026-09-06'),
        amount: 5780000,
        status: 'PENDING',
        qprId: fullApprovedQpr.id,
        vendorId: fullApprovedQpr.vendorId,
        purchasingSentCl: false,
        vendorApproved: false,
      },
    });
    console.log(`Seeded Confirmation Letter ${clRecord.clNumber} (Status: PENDING Dept Accounting approval).`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
