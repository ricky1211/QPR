import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding master data...');

  // 1. Seed Users (Inspectors / Admins / Employees)
  const usersData = [
    { name: 'Bagas Nur P', npk: 12345 },
    { name: 'Anindita I', npk: 54321 },
    { name: 'Evi Sulistyorini', npk: 98765 },
    { name: 'Bagas', npk: 11111 },
    { name: 'Anindita', npk: 22222 },
  ];

  const seededUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { npk: u.npk },
      update: { name: u.name },
      create: { name: u.name, npk: u.npk },
    });
    seededUsers.push(user);
  }
  console.log(`Seeded ${seededUsers.length} users.`);

  // 2. Seed Vendors
  const vendorsData = [
    { vendorCode: 'VND001', vendorName: 'PT TEMARU ENGINEERING INDONESIA' },
    { vendorCode: 'VND002', vendorName: 'PT SUKSES CIPTA MAKMUR' },
    { vendorCode: 'VND003', vendorName: 'PT ANUGERAH DAYA INDUSTRI KOMPONEN UTAMA' },
    { vendorCode: 'VND004', vendorName: 'PT JAYADI' },
    { vendorCode: 'VND005', vendorName: 'SHIJIAZHUANG RUICHENG TRADE CO., LTD' },
    { vendorCode: 'VND006', vendorName: 'PT IKAN BAKAR' },
  ];

  const seededVendors = [];
  for (const v of vendorsData) {
    const vendor = await prisma.vendor.upsert({
      where: { vendorCode: v.vendorCode },
      update: { vendorName: v.vendorName },
      create: { vendorCode: v.vendorCode, vendorName: v.vendorName },
    });
    seededVendors.push(vendor);
  }
  console.log(`Seeded ${seededVendors.length} vendors.`);

  // 3. Seed Parts
  const partsData = [
    { partNumber: 'MB-001', partDesc: 'Motherboard X1' },
    { partNumber: 'HD-002', partDesc: 'Harddisk 1TB' },
    { partNumber: 'IT-650', partDesc: 'INNER TUBE,650 A' },
    { partNumber: 'PARTS-001', partDesc: 'ALL TYPE PART FINISH' },
  ];

  const seededParts = [];
  for (const p of partsData) {
    const part = await prisma.part.upsert({
      where: { partNumber: p.partNumber },
      update: { partDesc: p.partDesc },
      create: { partNumber: p.partNumber, partDesc: p.partDesc },
    });
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
