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
      name: 'Cicik Andria',
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
