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
      name: 'Putu Ratna Saputra',
      npk: 1335,
      role: 'QA Division Head',
      roles: ['QA Division Head'],
      status: 'Aktif',
    },
    {
      name: 'Irvan H. N.',
      npk: 3790,
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
  for (const vendor of seededVendors) {
    for (const part of seededParts) {
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

  // 5. Seed QPRs for testing approval workflow (including Purchasing)
  console.log('Seeding QPR mock testing records...');
  const defaultVendor = seededVendors[0];
  const defaultPart = seededParts[0];

  if (defaultVendor && defaultPart) {
    const qprMockRecords = [
      {
        qprNumber: 'QPR/2026/06/001',
        date: new Date('2026-06-12'),
        status: 'WAITING_APPROVAL' as const,
        requiredRole: 'Purchasing',
        refNcrNumber: 'NCR/2026/06/012',
        problem: 'Defect visual scratch & burr pada outer diameter komponen Inner Tube.',
        claimType: 'MATERIAL, PROSES M/C',
        totalQty: 1200,
        totalQtyNg: 45,
        totalStdAllowance: 6,
        billableQty: 39,
        claimAmount: 3500000,
        progress: {
          checksumSectionHead: Buffer.from('APPROVED_BY_SECTION_HEAD_1784631200'),
          remarksSectionHead: 'Hasil inspeksi lot 06-A membuktikan defect melebihi standard allowance.',
          approvedAtSectionHead: new Date('2026-06-12T10:00:00Z'),
          checksumDeptHead: Buffer.from('APPROVED_BY_DEPT_HEAD_1784631250'),
          remarksDeptHead: 'Disetujui Dept Head, diteruskan ke Div Head.',
          approvedAtDeptHead: new Date('2026-06-12T11:30:00Z'),
          checksumDivHead: Buffer.from('APPROVED_BY_DIV_HEAD_1784631300'),
          remarksDivHead: 'Disetujui Div Head, mohon Purchasing tindak lanjuti ke vendor & terbitkan CL.',
          approvedAtDivHead: new Date('2026-06-12T14:00:00Z'),
        },
      },
      {
        qprNumber: 'QPR/2026/06/002',
        date: new Date('2026-06-15'),
        status: 'WAITING_APPROVAL' as const,
        requiredRole: 'Purchasing',
        refNcrNumber: 'NCR/2026/06/015',
        problem: 'Ketidaksesuaian dimensi pin poros melebihi toleransi drawing.',
        claimType: 'PROSES M/C, HEAT TREATMENT',
        totalQty: 2500,
        totalQtyNg: 80,
        totalStdAllowance: 12,
        billableQty: 68,
        claimAmount: 6200000,
        progress: {
          checksumSectionHead: Buffer.from('APPROVED_BY_SECTION_HEAD_1784631400'),
          remarksSectionHead: 'Sampling lot 06-B menunjukkan 80 pcs NG.',
          approvedAtSectionHead: new Date('2026-06-15T09:00:00Z'),
          checksumDeptHead: Buffer.from('APPROVED_BY_DEPT_HEAD_1784631450'),
          remarksDeptHead: 'Disetujui QA Dept Head.',
          approvedAtDeptHead: new Date('2026-06-15T11:00:00Z'),
          checksumDivHead: Buffer.from('APPROVED_BY_DIV_HEAD_1784631500'),
          remarksDivHead: 'Approved. Lanjutkan otorisasi Purchasing.',
          approvedAtDivHead: new Date('2026-06-15T13:30:00Z'),
        },
      },
      {
        qprNumber: 'QPR/2026/06/003',
        date: new Date('2026-06-18'),
        status: 'WAITING_APPROVAL' as const,
        requiredRole: 'Div Head',
        refNcrNumber: 'NCR/2026/06/018',
        problem: 'Defect porous pada casting bracket aluminium.',
        claimType: 'MATERIAL, PROSES CHECK',
        totalQty: 900,
        totalQtyNg: 30,
        totalStdAllowance: 4,
        billableQty: 26,
        claimAmount: 2100000,
        progress: {
          checksumSectionHead: Buffer.from('APPROVED_BY_SECTION_HEAD_1784631600'),
          remarksSectionHead: 'Disetujui Section Head.',
          approvedAtSectionHead: new Date('2026-06-18T08:30:00Z'),
          checksumDeptHead: Buffer.from('APPROVED_BY_DEPT_HEAD_1784631650'),
          remarksDeptHead: 'Disetujui Dept Head, menunggu approval Div Head.',
          approvedAtDeptHead: new Date('2026-06-18T10:00:00Z'),
        },
      },
      {
        qprNumber: 'QPR/2026/06/004',
        date: new Date('2026-06-20'),
        status: 'WAITING_APPROVAL' as const,
        requiredRole: 'Section Head',
        refNcrNumber: 'NCR/2026/06/020',
        problem: 'Karat / korosi pada permukaan coating setelah uji salt spray.',
        claimType: 'PAINTING/PLATING',
        totalQty: 1500,
        totalQtyNg: 40,
        totalStdAllowance: 7,
        billableQty: 33,
        claimAmount: 2800000,
        progress: {},
      },
      {
        qprNumber: 'QPR/2026/05/009',
        date: new Date('2026-05-28'),
        status: 'APPROVED' as const,
        requiredRole: 'Purchasing',
        refNcrNumber: 'NCR/2026/05/009',
        problem: 'Dimensi ulang finish grind out of spec.',
        claimType: 'PROSES M/C',
        totalQty: 1000,
        totalQtyNg: 30,
        totalStdAllowance: 5,
        billableQty: 25,
        claimAmount: 2250000,
        progress: {
          checksumSectionHead: Buffer.from('APPROVED_BY_SECTION_HEAD_1784630000'),
          remarksSectionHead: 'Approved.',
          approvedAtSectionHead: new Date('2026-05-28T09:00:00Z'),
          checksumDeptHead: Buffer.from('APPROVED_BY_DEPT_HEAD_1784630100'),
          remarksDeptHead: 'Approved.',
          approvedAtDeptHead: new Date('2026-05-28T10:00:00Z'),
          checksumDivHead: Buffer.from('APPROVED_BY_DIV_HEAD_1784630200'),
          remarksDivHead: 'Approved.',
          approvedAtDivHead: new Date('2026-05-28T11:00:00Z'),
          checksumPurchasing: Buffer.from('APPROVED_BY_PURCHASING_1784630300'),
          remarksPurchasing: 'Disetujui Purchasing. Dokumen telah selesai diotorisasi.',
          approvedAtPurchasing: new Date('2026-05-28T14:00:00Z'),
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
          vendorId: defaultVendor.id,
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
          partId: defaultPart.id,
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
    console.log(`Seeded ${qprMockRecords.length} QPR testing records.`);
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
