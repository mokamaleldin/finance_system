import { Currency, MovementType } from "@prisma/client";
import {
  calculateCrossRate,
  toMoneyString,
} from "../lib/calculations";
import { createTransferTransaction } from "../lib/transfer-service";
import { prisma } from "../lib/prisma";

function date(value: string) {
  return new Date(`${value}T10:00:00.000Z`);
}

async function main() {
  await prisma.transferTransaction.deleteMany();
  await prisma.financialMovement.deleteMany();
  await prisma.transactionGroup.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.customer.deleteMany();

  const [refaat, ahmed, yusuf] = await Promise.all([
    prisma.customer.create({
      data: {
        name: "رفعت عبد الرحمن",
        phone: "+201001112233",
        country: "مصر",
        notes: "عميل تحويلات متكرر بين القاهرة وإسطنبول",
      },
    }),
    prisma.customer.create({
      data: {
        name: "أحمد كمال",
        phone: "+905551234567",
        country: "تركيا",
      },
    }),
    prisma.customer.create({
      data: {
        name: "يوسف المصري",
        phone: "+201222333444",
        country: "مصر",
      },
    }),
  ]);

  // تبقى هذه الأسعار القديمة فقط حتى لا تنكسر الجداول القديمة غير المستخدمة.
  for (const row of [
    { date: "2026-04-29", usdToEgp: "54.300000", usdToTry: "45.000000", notes: "سعر مرجعي قديم" },
    { date: "2026-05-02", usdToEgp: "54.650000", usdToTry: "45.120000", notes: "سعر مرجعي قديم" },
  ]) {
    await prisma.exchangeRate.create({
      data: {
        date: date(row.date),
        usdToEgp: row.usdToEgp,
        usdToTry: row.usdToTry,
        crossRate: toMoneyString(calculateCrossRate(row.usdToEgp, row.usdToTry), 6),
        notes: row.notes,
      },
    });
  }

  await createTransferTransaction({
    date: date("2026-05-02"),
    customerId: refaat.id,
    customerName: refaat.name,
    quickCustomerName: "",
    phone: refaat.phone || "",
    createCustomer: false,
    type: "EGYPT_TO_TURKEY",
    receivedCurrency: "EGP",
    receivedAmount: "120000",
    usdToEgp: "54.30",
    usdToTry: "45",
    customerRate: "1.22",
    deliveredCurrency: "TRY",
    deliveredAmount: "",
    receivedStatus: "RECEIVED",
    deliveredStatus: "NOT_DELIVERED",
    notes: "مثال: استلمنا في مصر ولم يتم التسليم في تركيا بعد",
  });

  await createTransferTransaction({
    date: date("2026-05-02"),
    customerId: ahmed.id,
    customerName: ahmed.name,
    quickCustomerName: "",
    phone: ahmed.phone || "",
    createCustomer: false,
    type: "TURKEY_TO_EGYPT",
    receivedCurrency: "TRY",
    receivedAmount: "10000",
    usdToEgp: "54",
    usdToTry: "45",
    customerRate: "1.19",
    deliveredCurrency: "EGP",
    deliveredAmount: "",
    receivedStatus: "RECEIVED",
    deliveredStatus: "DELIVERED",
    notes: "مثال: المفروض التسليم 11900 جنيه والربح 100 جنيه",
  });

  await createTransferTransaction({
    date: date("2026-05-02"),
    customerId: yusuf.id,
    customerName: yusuf.name,
    quickCustomerName: "",
    phone: yusuf.phone || "",
    createCustomer: false,
    type: "TURKEY_TO_EGYPT",
    receivedCurrency: "TRY",
    receivedAmount: "5000",
    usdToEgp: "54",
    usdToTry: "45",
    customerRate: "1.18",
    deliveredCurrency: "EGP",
    deliveredAmount: "",
    receivedStatus: "NOT_RECEIVED",
    deliveredStatus: "DELIVERED",
    notes: "سلمنا في مصر وباقي لنا الاستلام في تركيا",
  });

  // قيد قديم صغير فقط حتى لا تظهر الجداول القديمة فارغة إذا فتحها أحد.
  await prisma.financialMovement.create({
    data: {
      customerId: refaat.id,
      date: date("2026-05-02"),
      type: MovementType.RECEIVED,
      currency: Currency.EGP,
      amount: "120000.0000",
      notes: "قيد قديم غير مستخدم في الواجهة الجديدة",
    },
  });

  console.log("Seed data created for transfer workflow.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
