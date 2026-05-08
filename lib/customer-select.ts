import { Prisma } from "@prisma/client";

export const customerSelect = {
  id: true,
  name: true,
  kind: true,
  phone: true,
  country: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

export const customerOptionSelect = {
  id: true,
  name: true,
  kind: true,
  phone: true,
} satisfies Prisma.CustomerSelect;
