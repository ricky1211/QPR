import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding master data...');

  // 1. Seed Users (Inspectors / Admins / Employees)
  const usersData = [
    { name: 'Administrator', npk: 999, role: 'admin', status: 'Aktif' },
    { name: 'Septian Nugraha', npk: 2301, role: 'sect_dept_head', status: 'Aktif' },
    { name: 'Deny Maulana', npk: 3079, role: 'foreman', status: 'Aktif' },
    { name: 'Putu Ratna Saputra', npk: 1335, role: 'div_head', status: 'Aktif' },
    { name: 'Cicik Andria', npk: 3790, role: 'purchasing', status: 'Aktif' },
    { name: 'Anindita Irnilaningtyas', npk: 3123, role: 'accounting', status: 'Aktif' },
    { name: 'Bagas Nur Pratama', npk: 3616, role: 'finance', status: 'Aktif' },
  ];

  const seededUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { npk: u.npk },
      update: { name: u.name, role: u.role, status: u.status },
      create: { name: u.name, npk: u.npk, role: u.role, status: u.status },
    });
    seededUsers.push(user);
  }
  console.log(`Seeded ${seededUsers.length} users.`);

  // 2. Seed Vendors
  const vendorsData = [
    { vendorCode: '31012100', vendorName: 'PT TEMARU ENGINEERING INDONESIA', status: 'Aktif' },
    { vendorCode: 'VND002', vendorName: 'PT SUKSES CIPTA MAKMUR', status: 'Aktif' },
    { vendorCode: 'VND003', vendorName: 'Anugerah Daya Industri Komponen Utama, PT.', status: 'Aktif' },
    { vendorCode: 'VND004', vendorName: 'PT JAYADI', status: 'Aktif' },
    { vendorCode: 'VND005', vendorName: 'SHIJIAZHUANG RUICHENG TRADE CO., LTD', status: 'Aktif' },
    { vendorCode: 'VND006', vendorName: 'PT IKAN BAKAR', status: 'Aktif' },
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
    { partNumber: 'MB-001', partDesc: 'Motherboard X1', allowanceRatio: 0.5 },
    { partNumber: 'HD-002', partDesc: 'Harddisk 1TB', allowanceRatio: 0.8 },
    { partNumber: 'IT-650', partDesc: 'INNER TUBE,650 A', allowanceRatio: 0.5 },
    { partNumber: 'PARTS-001', partDesc: 'ALL TYPE PART FINISH', allowanceRatio: null },
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
