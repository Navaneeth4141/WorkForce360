import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const month = 5;
  const year = 2026;

  console.log(`Searching for payroll batch of ${month}/${year}...`);
  const batch = await prisma.payrollBatch.findFirst({
    where: { payrollMonth: month, payrollYear: year }
  });

  if (!batch) {
    console.log("No payroll batch found for May 2026.");
    return;
  }

  console.log(`Found payroll batch ID: ${batch.id}, frozen status: ${batch.isFrozen}`);

  // Delete invoices if they exist to prevent foreign key errors on payroll regeneration
  const invoices = await prisma.invoiceBatch.findMany({
    where: { payrollBatchId: batch.id }
  });

  if (invoices.length > 0) {
    console.log(`Found ${invoices.length} linked invoices. Deleting invoice items and batches...`);
    for (const inv of invoices) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceBatchId: inv.id } });
      await prisma.invoiceBatch.delete({ where: { id: inv.id } });
      console.log(`Deleted invoice: ${inv.invoiceNumber}`);
    }
  }

  // Delete payslips linked to items in this batch
  const items = await prisma.payrollItem.findMany({
    where: { payrollBatchId: batch.id }
  });
  const itemIds = items.map(it => it.id);

  if (itemIds.length > 0) {
    const deletedPayslips = await prisma.payslip.deleteMany({
      where: { payrollItemId: { in: itemIds } }
    });
    console.log(`Deleted ${deletedPayslips.count} linked payslips.`);
  }

  // Unfreeze the payroll batch by setting isFrozen to false
  const updated = await prisma.payrollBatch.update({
    where: { id: batch.id },
    data: { isFrozen: false }
  });

  console.log(`Payroll batch of May 2026 is now UN-FROZEN! (isFrozen: ${updated.isFrozen})`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
