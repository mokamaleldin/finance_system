import { Currency, MovementType } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  calculateCrossRate,
  toMoneyString,
} from "../lib/calculations";
import { customerSelect } from "../lib/customer-select";
import { createTransferTransaction } from "../lib/transfer-service";
import { prisma } from "../lib/prisma";

function date(value: string) {
  return new Date(`${value}T10:00:00.000Z`);
}

const noCommission = {
  commissionEnabled: false,
  commissionPersonName: "",
  commissionType: "FIXED" as const,
  commissionBase: "RECEIVED_AMOUNT" as const,
  commissionValue: "",
  commissionCurrency: "EGP" as const,
  commissionNotes: "",
};

async function main() {
  const passwordSaltRounds = 10;

  await Promise.all([
    prisma.user.upsert({
      where: { email: "omar@admin.com" },
      update: {
        passwordHash: await bcrypt.hash("omaradmin", passwordSaltRounds),
        role: "FULL_ADMIN",
      },
      create: {
        email: "omar@admin.com",
        passwordHash: await bcrypt.hash("omaradmin", passwordSaltRounds),
        role: "FULL_ADMIN",
      },
    }),
    prisma.user.upsert({
      where: { email: "ahmed@admin.com" },
      update: {
        passwordHash: await bcrypt.hash("ahmedadmin", passwordSaltRounds),
        role: "OPERATOR",
      },
      create: {
        email: "ahmed@admin.com",
        passwordHash: await bcrypt.hash("ahmedadmin", passwordSaltRounds),
        role: "OPERATOR",
      },
    }),
    prisma.user.upsert({
      where: { email: "normal@admin.com" },
      update: {
        passwordHash: await bcrypt.hash("normaladdmin", passwordSaltRounds),
        role: "VIEWER",
      },
      create: {
        email: "normal@admin.com",
        passwordHash: await bcrypt.hash("normaladdmin", passwordSaltRounds),
        role: "VIEWER",
      },
    }),
  ]);

  await prisma.commission.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.transferTransaction.deleteMany();
  await prisma.financialMovement.deleteMany();
  await prisma.transactionGroup.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.customer.deleteMany();

  const [refaat, ahmed, yusuf] = await Promise.all([
    prisma.customer.create({
      data: {
        name: "رفعت عبد الرحمن",
        kind: "CUSTOMER",
        phone: "+201001112233",
        country: "مصر",
        notes: "عميل تحويلات متكرر بين القاهرة وإسطنبول",
      },
      select: customerSelect,
    }),
    prisma.customer.create({
      data: {
        name: "أحمد كمال",
        kind: "TRADER",
        phone: "+905551234567",
        country: "تركيا",
      },
      select: customerSelect,
    }),
    prisma.customer.create({
      data: {
        name: "يوسف المصري",
        kind: "CUSTOMER",
        phone: "+201222333444",
        country: "مصر",
      },
      select: customerSelect,
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
    type: "TRANSFER",
    receiveLocation: "مصر",
    deliverLocation: "تركيا",
    receivedCurrency: "EGP",
    receivedAmount: "120000",
    usdRates: { USD: "1", EGP: "54.30", TRY: "45", EUR: "0.92" },
    usdToEgp: "",
    usdToTry: "",
    costRate: "",
    customerRate: "1.22",
    deliveredCurrency: "TRY",
    deliveredAmount: "",
    receivedStatus: "RECEIVED",
    deliveredStatus: "NOT_DELIVERED",
    notes: "مثال: استلمنا في مصر ولم يتم التسليم في تركيا بعد",
    ...noCommission,
  });

  await createTransferTransaction({
    date: date("2026-05-02"),
    customerId: ahmed.id,
    customerName: ahmed.name,
    quickCustomerName: "",
    phone: ahmed.phone || "",
    createCustomer: false,
    type: "TRANSFER",
    receiveLocation: "تركيا",
    deliverLocation: "مصر",
    receivedCurrency: "TRY",
    receivedAmount: "10000",
    usdRates: { USD: "1", EGP: "54.30", TRY: "45", EUR: "0.92" },
    usdToEgp: "",
    usdToTry: "",
    costRate: "",
    customerRate: "1.19",
    deliveredCurrency: "EGP",
    deliveredAmount: "",
    receivedStatus: "RECEIVED",
    deliveredStatus: "DELIVERED",
    notes: "مثال: المفروض التسليم 11900 جنيه والربح حوالي 166 جنيه",
    commissionEnabled: true,
    commissionPersonName: "مندوب التحويل",
    commissionType: "PERCENTAGE",
    commissionBase: "PROFIT",
    commissionValue: "10",
    commissionCurrency: "EGP",
    commissionNotes: "عمولة على ربح العملية",
  });

  await createTransferTransaction({
    date: date("2026-05-02"),
    customerId: yusuf.id,
    customerName: yusuf.name,
    quickCustomerName: "",
    phone: yusuf.phone || "",
    createCustomer: false,
    type: "TRANSFER",
    receiveLocation: "تركيا",
    deliverLocation: "مصر",
    receivedCurrency: "TRY",
    receivedAmount: "5000",
    usdRates: { USD: "1", EGP: "54", TRY: "45", EUR: "0.92" },
    usdToEgp: "",
    usdToTry: "",
    costRate: "",
    customerRate: "1.18",
    deliveredCurrency: "EGP",
    deliveredAmount: "",
    receivedStatus: "NOT_RECEIVED",
    deliveredStatus: "DELIVERED",
    notes: "سلمنا في مصر وباقي لنا الاستلام في تركيا",
    ...noCommission,
  });

  await createTransferTransaction({
    date: date("2026-05-02"),
    customerId: yusuf.id,
    customerName: yusuf.name,
    quickCustomerName: "",
    phone: yusuf.phone || "",
    createCustomer: false,
    type: "DIRECT_EXCHANGE",
    receiveLocation: "المكتب",
    deliverLocation: "المكتب",
    receivedCurrency: "USD",
    receivedAmount: "1000",
    usdRates: { USD: "1", EGP: "54.30", TRY: "45", EUR: "0.92" },
    usdToEgp: "",
    usdToTry: "",
    costRate: "",
    customerRate: "44.5",
    deliveredCurrency: "TRY",
    deliveredAmount: "",
    receivedStatus: "RECEIVED",
    deliveredStatus: "DELIVERED",
    notes: "تبديل مباشر: كل 1 دولار = سعر العميل بالليرة",
    ...noCommission,
  });

  await createTransferTransaction({
    date: date("2026-05-02"),
    customerId: yusuf.id,
    customerName: yusuf.name,
    quickCustomerName: "",
    phone: yusuf.phone || "",
    createCustomer: false,
    type: "DIRECT_EXCHANGE",
    receiveLocation: "المكتب",
    deliverLocation: "المكتب",
    receivedCurrency: "EUR",
    receivedAmount: "920",
    usdRates: { USD: "1", EGP: "54.30", TRY: "45", EUR: "0.92" },
    usdToEgp: "",
    usdToTry: "",
    costRate: "",
    customerRate: "0.93",
    deliveredCurrency: "USD",
    deliveredAmount: "",
    receivedStatus: "RECEIVED",
    deliveredStatus: "DELIVERED",
    notes: "تبديل مباشر: يورو إلى دولار",
    ...noCommission,
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

  await prisma.expense.createMany({
    data: [
      {
        date: date("2026-05-02"),
        category: "INTERNET",
        description: "إنترنت المكتب",
        amount: "850.0000",
        currencyCode: "EGP",
        notes: "مصروف شهري",
      },
      {
        date: date("2026-05-02"),
        category: "HOSPITALITY",
        description: "ضيافة عملاء",
        amount: "300.0000",
        currencyCode: "TRY",
        notes: "قهوة وضيافة",
      },
    ],
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
