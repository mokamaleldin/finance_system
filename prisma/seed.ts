import { Currency, MovementType, TransactionStatus } from "@prisma/client";
import Decimal from "decimal.js";
import {
  calculateCrossRate,
  calculateTransactionProfit,
  deriveTransactionStatus,
  toDecimal,
  toMoneyString,
} from "../lib/calculations";
import { prisma } from "../lib/prisma";

function date(value: string) {
  return new Date(`${value}T10:00:00.000Z`);
}

async function refreshSeedGroup(groupId: string) {
  const group = await prisma.transactionGroup.findUniqueOrThrow({
    where: { id: groupId },
    include: { financialMovements: true },
  });
  let actualSource = new Decimal(0);
  let actualTarget = new Decimal(0);

  for (const movement of group.financialMovements) {
    if (
      movement.type === MovementType.RECEIVED &&
      (!group.sourceCurrency || movement.currency === group.sourceCurrency)
    ) {
      actualSource = actualSource.plus(toDecimal(movement.amount));
    }

    if (
      movement.type === MovementType.PAID &&
      (!group.targetCurrency || movement.currency === group.targetCurrency)
    ) {
      actualTarget = actualTarget.plus(toDecimal(movement.amount));
    }
  }

  const profit = calculateTransactionProfit({
    costRate: group.costRate,
    sellRate: group.sellRate,
    actualTargetAmount: actualTarget,
    actualSourceAmount: actualSource,
  });

  await prisma.transactionGroup.update({
    where: { id: group.id },
    data: {
      actualSourceAmount: toMoneyString(actualSource),
      actualTargetAmount: toMoneyString(actualTarget),
      profit: profit ? toMoneyString(profit) : null,
      status: deriveTransactionStatus({
        expectedSourceAmount: group.expectedSourceAmount,
        expectedTargetAmount: group.expectedTargetAmount,
        actualSourceAmount: actualSource,
        actualTargetAmount: actualTarget,
        movementCount: group.financialMovements.length,
      }),
    },
  });
}

async function main() {
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

  const rateRows = [
    { date: "2026-04-27", usdToEgp: "53.900000", usdToTry: "44.800000", notes: "افتتاح الأسبوع" },
    { date: "2026-04-28", usdToEgp: "54.100000", usdToTry: "44.900000", notes: "سعر السوق" },
    { date: "2026-04-29", usdToEgp: "54.300000", usdToTry: "45.000000", notes: "مثال 1.2066" },
    { date: "2026-05-01", usdToEgp: "54.650000", usdToTry: "45.120000", notes: "سعر اليوم" },
  ];

  for (const row of rateRows) {
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

  const openGroup = await prisma.transactionGroup.create({
    data: {
      customerId: refaat.id,
      title: "تحويل رفعت - EGP إلى USD",
      status: TransactionStatus.OPEN,
      costRate: "54.300000",
      sellRate: "54.100000",
      sourceCurrency: Currency.EGP,
      targetCurrency: Currency.USD,
      expectedSourceAmount: "543000.0000",
      expectedTargetAmount: "10000.0000",
      notes: "استلمنا الجنيه ولم يتم دفع الدولار بعد",
    },
  });

  const partialGroup = await prisma.transactionGroup.create({
    data: {
      customerId: ahmed.id,
      title: "تحويل أحمد - TRY إلى EGP",
      status: TransactionStatus.PARTIALLY_SETTLED,
      costRate: "1.206600",
      sellRate: "1.190000",
      sourceCurrency: Currency.TRY,
      targetCurrency: Currency.EGP,
      expectedSourceAmount: "100000.0000",
      expectedTargetAmount: "119000.0000",
      notes: "تسوية جزئية على دفعتين",
    },
  });

  const settledGroup = await prisma.transactionGroup.create({
    data: {
      customerId: yusuf.id,
      title: "تحويل يوسف - TRY إلى EGP",
      status: TransactionStatus.SETTLED,
      costRate: "1.206600",
      sellRate: "1.190000",
      sourceCurrency: Currency.TRY,
      targetCurrency: Currency.EGP,
      expectedSourceAmount: "100000.0000",
      expectedTargetAmount: "119000.0000",
      notes: "تمت التسوية بالكامل",
    },
  });

  await prisma.financialMovement.createMany({
    data: [
      {
        customerId: refaat.id,
        transactionGroupId: openGroup.id,
        date: date("2026-05-01"),
        type: MovementType.RECEIVED,
        currency: Currency.EGP,
        amount: "543000.0000",
        rate: "54.300000",
        notes: "استلام قيمة شراء الدولار",
      },
      {
        customerId: ahmed.id,
        transactionGroupId: partialGroup.id,
        date: date("2026-04-29"),
        type: MovementType.RECEIVED,
        currency: Currency.TRY,
        amount: "100000.0000",
        rate: "1.206600",
        notes: "استلام ليرة تركية",
      },
      {
        customerId: ahmed.id,
        transactionGroupId: partialGroup.id,
        date: date("2026-05-01"),
        type: MovementType.PAID,
        currency: Currency.EGP,
        amount: "60000.0000",
        rate: "1.190000",
        notes: "دفعة أولى بالجنيه",
      },
      {
        customerId: yusuf.id,
        transactionGroupId: settledGroup.id,
        date: date("2026-04-28"),
        type: MovementType.RECEIVED,
        currency: Currency.TRY,
        amount: "100000.0000",
        rate: "1.206600",
        notes: "استلام الليرة",
      },
      {
        customerId: yusuf.id,
        transactionGroupId: settledGroup.id,
        date: date("2026-04-29"),
        type: MovementType.PAID,
        currency: Currency.EGP,
        amount: "119000.0000",
        rate: "1.190000",
        notes: "دفع كامل المقابل بالجنيه",
      },
      {
        customerId: yusuf.id,
        transactionGroupId: settledGroup.id,
        date: date("2026-04-29"),
        type: MovementType.FEE,
        currency: Currency.EGP,
        amount: "250.0000",
        notes: "عمولة خدمة",
      },
      {
        customerId: refaat.id,
        date: date("2026-04-30"),
        type: MovementType.ADJUSTMENT,
        currency: Currency.USD,
        amount: "-50.0000",
        notes: "تصحيح رصيد سابق",
      },
    ],
  });

  await Promise.all([
    refreshSeedGroup(openGroup.id),
    refreshSeedGroup(partialGroup.id),
    refreshSeedGroup(settledGroup.id),
  ]);

  console.log("Seed data created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
