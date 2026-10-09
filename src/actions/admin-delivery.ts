"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult = {
  success: boolean;
  error?: string;
};

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in.",
    } as const;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return {
      success: false,
      error: "You do not have permission to manage delivery settings.",
    } as const;
  }

  return {
    success: true,
    session,
  } as const;
}

/*
|--------------------------------------------------------------------------
| DELIVERY ZONES
|--------------------------------------------------------------------------
*/

export async function createDeliveryZone(
  formData: FormData
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const feeValue = String(formData.get("fee") ?? "").trim();

  if (!name) {
    return {
      success: false,
      error: "Zone name is required.",
    };
  }

  const fee = Number(feeValue);

  if (!Number.isFinite(fee) || fee < 0) {
    return {
      success: false,
      error: "Delivery fee must be a valid non-negative number.",
    };
  }

  await prisma.deliveryZone.create({
    data: {
      name,
      description: description || null,
      fee,
      active: true,
    },
  });

  return {
    success: true,
  };
}

export async function updateDeliveryZone(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Zone ID is required.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const feeValue = String(formData.get("fee") ?? "").trim();
  const active = formData.get("active") === "true";

  if (!name) {
    return {
      success: false,
      error: "Zone name is required.",
    };
  }

  const fee = Number(feeValue);

  if (!Number.isFinite(fee) || fee < 0) {
    return {
      success: false,
      error: "Delivery fee must be a valid non-negative number.",
    };
  }

  const existing = await prisma.deliveryZone.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Delivery zone not found.",
    };
  }

  await prisma.deliveryZone.update({
    where: { id },
    data: {
      name,
      description: description || null,
      fee,
      active,
    },
  });

  return {
    success: true,
  };
}

export async function deleteDeliveryZone(
  id: string
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Zone ID is required.",
    };
  }

  const existing = await prisma.deliveryZone.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Delivery zone not found.",
    };
  }

  await prisma.deliveryZone.delete({
    where: { id },
  });

  return {
    success: true,
  };
}

export async function toggleDeliveryZone(
  id: string
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Zone ID is required.",
    };
  }

  const zone = await prisma.deliveryZone.findUnique({
    where: { id },
    select: {
      id: true,
      active: true,
    },
  });

  if (!zone) {
    return {
      success: false,
      error: "Delivery zone not found.",
    };
  }

  await prisma.deliveryZone.update({
    where: { id },
    data: {
      active: !zone.active,
    },
  });

  return {
    success: true,
  };
}

/*
|--------------------------------------------------------------------------
| DELIVERY SLOTS
|--------------------------------------------------------------------------
*/

export async function createDeliverySlot(
  formData: FormData
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const name = String(formData.get("name") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const capacityValue = String(formData.get("capacity") ?? "").trim();

  if (!name || !startTime || !endTime) {
    return {
      success: false,
      error: "Name, start time and end time are required.",
    };
  }

  if (startTime >= endTime) {
    return {
      success: false,
      error: "End time must be later than start time.",
    };
  }

  const capacity = Number(capacityValue);

  if (!Number.isInteger(capacity) || capacity < 1) {
    return {
      success: false,
      error: "Capacity must be a whole number greater than 0.",
    };
  }

  await prisma.deliverySlot.create({
    data: {
      name,
      startTime,
      endTime,
      capacity,
      active: true,
    },
  });

  return {
    success: true,
  };
}

export async function updateDeliverySlot(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Delivery slot ID is required.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const capacityValue = String(formData.get("capacity") ?? "").trim();
  const active = formData.get("active") === "true";

  if (!name || !startTime || !endTime) {
    return {
      success: false,
      error: "Name, start time and end time are required.",
    };
  }

  if (startTime >= endTime) {
    return {
      success: false,
      error: "End time must be later than start time.",
    };
  }

  const capacity = Number(capacityValue);

  if (!Number.isInteger(capacity) || capacity < 1) {
    return {
      success: false,
      error: "Capacity must be a whole number greater than 0.",
    };
  }

  const existing = await prisma.deliverySlot.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Delivery slot not found.",
    };
  }

  await prisma.deliverySlot.update({
    where: { id },
    data: {
      name,
      startTime,
      endTime,
      capacity,
      active,
    },
  });

  return {
    success: true,
  };
}

export async function deleteDeliverySlot(
  id: string
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Delivery slot ID is required.",
    };
  }

  const existing = await prisma.deliverySlot.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Delivery slot not found.",
    };
  }

  await prisma.deliverySlot.delete({
    where: { id },
  });

  return {
    success: true,
  };
}

export async function toggleDeliverySlot(
  id: string
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Delivery slot ID is required.",
    };
  }

  const slot = await prisma.deliverySlot.findUnique({
    where: { id },
    select: {
      id: true,
      active: true,
    },
  });

  if (!slot) {
    return {
      success: false,
      error: "Delivery slot not found.",
    };
  }

  await prisma.deliverySlot.update({
    where: { id },
    data: {
      active: !slot.active,
    },
  });

  return {
    success: true,
  };
}

/*
|--------------------------------------------------------------------------
| COLLECTION LOCATIONS
|--------------------------------------------------------------------------
*/

export async function createCollectionLocation(
  formData: FormData
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return {
      success: false,
      error: "Collection location name is required.",
    };
  }

  await prisma.collectionLocation.create({
    data: {
      name,
      address: address || null,
      description: description || null,
      active: true,
    },
  });

  return {
    success: true,
  };
}

export async function updateCollectionLocation(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Collection location ID is required.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const active = formData.get("active") === "true";

  if (!name) {
    return {
      success: false,
      error: "Collection location name is required.",
    };
  }

  const existing = await prisma.collectionLocation.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Collection location not found.",
    };
  }

  await prisma.collectionLocation.update({
    where: { id },
    data: {
      name,
      address: address || null,
      description: description || null,
      active,
    },
  });

  return {
    success: true,
  };
}

export async function deleteCollectionLocation(
  id: string
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Collection location ID is required.",
    };
  }

  const existing = await prisma.collectionLocation.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Collection location not found.",
    };
  }

  await prisma.collectionLocation.delete({
    where: { id },
  });

  return {
    success: true,
  };
}

export async function toggleCollectionLocation(
  id: string
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Collection location ID is required.",
    };
  }

  const location = await prisma.collectionLocation.findUnique({
    where: { id },
    select: {
      id: true,
      active: true,
    },
  });

  if (!location) {
    return {
      success: false,
      error: "Collection location not found.",
    };
  }

  await prisma.collectionLocation.update({
    where: { id },
    data: {
      active: !location.active,
    },
  });

  return {
    success: true,
  };
}

/*
|--------------------------------------------------------------------------
| COLLECTION SLOTS
|--------------------------------------------------------------------------
*/

export async function createCollectionSlot(
  formData: FormData
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const name = String(formData.get("name") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const capacityValue = String(formData.get("capacity") ?? "").trim();

  if (!name || !startTime || !endTime) {
    return {
      success: false,
      error: "Name, start time and end time are required.",
    };
  }

  if (startTime >= endTime) {
    return {
      success: false,
      error: "End time must be later than start time.",
    };
  }

  const capacity = Number(capacityValue);

  if (!Number.isInteger(capacity) || capacity < 1) {
    return {
      success: false,
      error: "Capacity must be a whole number greater than 0.",
    };
  }

  await prisma.collectionSlot.create({
    data: {
      name,
      startTime,
      endTime,
      capacity,
      active: true,
    },
  });

  return {
    success: true,
  };
}

export async function updateCollectionSlot(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Collection slot ID is required.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const capacityValue = String(formData.get("capacity") ?? "").trim();
  const active = formData.get("active") === "true";

  if (!name || !startTime || !endTime) {
    return {
      success: false,
      error: "Name, start time and end time are required.",
    };
  }

  if (startTime >= endTime) {
    return {
      success: false,
      error: "End time must be later than start time.",
    };
  }

  const capacity = Number(capacityValue);

  if (!Number.isInteger(capacity) || capacity < 1) {
    return {
      success: false,
      error: "Capacity must be a whole number greater than 0.",
    };
  }

  const existing = await prisma.collectionSlot.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Collection slot not found.",
    };
  }

  await prisma.collectionSlot.update({
    where: { id },
    data: {
      name,
      startTime,
      endTime,
      capacity,
      active,
    },
  });

  return {
    success: true,
  };
}

export async function deleteCollectionSlot(
  id: string
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Collection slot ID is required.",
    };
  }

  const existing = await prisma.collectionSlot.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: false,
      error: "Collection slot not found.",
    };
  }

  await prisma.collectionSlot.delete({
    where: { id },
  });

  return {
    success: true,
  };
}

export async function toggleCollectionSlot(
  id: string
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Collection slot ID is required.",
    };
  }

  const slot = await prisma.collectionSlot.findUnique({
    where: { id },
    select: {
      id: true,
      active: true,
    },
  });

  if (!slot) {
    return {
      success: false,
      error: "Collection slot not found.",
    };
  }

  await prisma.collectionSlot.update({
    where: { id },
    data: {
      active: !slot.active,
    },
  });

  return {
    success: true,
  };
}

/*
|--------------------------------------------------------------------------
| PRODUCT PREPARATION TIME
|--------------------------------------------------------------------------
*/

export async function updateProductPreparationTime(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Product ID is required.",
    };
  }

  const preparationTimeValue = String(
    formData.get("preparationTime") ?? ""
  ).trim();

  const preparationTime = Number(preparationTimeValue);

  if (!Number.isInteger(preparationTime) || preparationTime < 0) {
    return {
      success: false,
      error:
        "Preparation time must be a whole number greater than or equal to 0.",
    };
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!product) {
    return {
      success: false,
      error: "Product not found.",
    };
  }

  await prisma.product.update({
    where: { id },
    data: {
      preparationTime,
    },
  });

  return {
    success: true,
  };
}