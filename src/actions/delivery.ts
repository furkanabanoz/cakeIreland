"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| AUTHORIZATION
|--------------------------------------------------------------------------
*/

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "You must be signed in.",
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      success: false as const,
      error: "You do not have permission to manage delivery settings.",
    };
  }

  return {
    success: true as const,
    session,
  };
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInt(value: FormDataEntryValue | null) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    return null;
  }

  return number;
}

function parseFee(value: FormDataEntryValue | null) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number.toFixed(2);
}

/*
|--------------------------------------------------------------------------
| DELIVERY ZONES
|--------------------------------------------------------------------------
*/

export async function createDeliveryZone(formData: FormData) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const name = cleanString(formData.get("name"));
  const description = cleanString(formData.get("description"));
  const fee = parseFee(formData.get("fee"));

  if (!name) {
    return {
      success: false,
      error: "Delivery zone name is required.",
    };
  }

  if (fee === null) {
    return {
      success: false,
      error: "A valid delivery price is required.",
    };
  }

  const zone = await prisma.deliveryZone.create({
    data: {
      name,
      description: description || null,
      fee,
    },
  });

  return {
    success: true,
    zone,
  };
}

export async function updateDeliveryZone(formData: FormData) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const id = cleanString(formData.get("id"));
  const name = cleanString(formData.get("name"));
  const description = cleanString(formData.get("description"));
  const fee = parseFee(formData.get("fee"));
  const active = formData.get("active") === "true";

  if (!id) {
    return {
      success: false,
      error: "Delivery zone ID is required.",
    };
  }

  if (!name) {
    return {
      success: false,
      error: "Delivery zone name is required.",
    };
  }

  if (fee === null) {
    return {
      success: false,
      error: "A valid delivery price is required.",
    };
  }

  const zone = await prisma.deliveryZone.update({
    where: {
      id,
    },
    data: {
      name,
      description: description || null,
      fee,
      active,
    },
  });

  return {
    success: true,
    zone,
  };
}

export async function deleteDeliveryZone(id: string) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Delivery zone ID is required.",
    };
  }

  await prisma.deliveryZone.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
  };
}

export async function toggleDeliveryZone(
  id: string,
  active: boolean
) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!id) {
    return {
      success: false,
      error: "Delivery zone ID is required.",
    };
  }

  const zone = await prisma.deliveryZone.update({
    where: {
      id,
    },
    data: {
      active,
    },
  });

  return {
    success: true,
    zone,
  };
}

/*
|--------------------------------------------------------------------------
| DELIVERY SLOTS
|--------------------------------------------------------------------------
*/

export async function createDeliverySlot(formData: FormData) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const name = cleanString(formData.get("name"));
  const startTime = cleanString(formData.get("startTime"));
  const endTime = cleanString(formData.get("endTime"));
  const capacity = parsePositiveInt(formData.get("capacity"));

  if (!name) {
    return {
      success: false,
      error: "Delivery slot name is required.",
    };
  }

  if (!startTime || !endTime) {
    return {
      success: false,
      error: "Start time and end time are required.",
    };
  }

  if (capacity === null || capacity < 1) {
    return {
      success: false,
      error: "Slot capacity must be at least 1.",
    };
  }

  const slot = await prisma.deliverySlot.create({
    data: {
      name,
      startTime,
      endTime,
      capacity,
    },
  });

  return {
    success: true,
    slot,
  };
}

export async function updateDeliverySlot(formData: FormData) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const id = cleanString(formData.get("id"));
  const name = cleanString(formData.get("name"));
  const startTime = cleanString(formData.get("startTime"));
  const endTime = cleanString(formData.get("endTime"));
  const capacity = parsePositiveInt(formData.get("capacity"));
  const active = formData.get("active") === "true";

  if (!id) {
    return {
      success: false,
      error: "Delivery slot ID is required.",
    };
  }

  if (!name) {
    return {
      success: false,
      error: "Delivery slot name is required.",
    };
  }

  if (!startTime || !endTime) {
    return {
      success: false,
      error: "Start time and end time are required.",
    };
  }

  if (capacity === null || capacity < 1) {
    return {
      success: false,
      error: "Slot capacity must be at least 1.",
    };
  }

  const slot = await prisma.deliverySlot.update({
    where: {
      id,
    },
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
    slot,
  };
}

export async function deleteDeliverySlot(id: string) {
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

  await prisma.deliverySlot.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
  };
}

export async function toggleDeliverySlot(
  id: string,
  active: boolean
) {
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

  const slot = await prisma.deliverySlot.update({
    where: {
      id,
    },
    data: {
      active,
    },
  });

  return {
    success: true,
    slot,
  };
}

/*
|--------------------------------------------------------------------------
| COLLECTION LOCATIONS
|--------------------------------------------------------------------------
*/

export async function createCollectionLocation(
  formData: FormData
) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const name = cleanString(formData.get("name"));
  const address = cleanString(formData.get("address"));
  const description = cleanString(formData.get("description"));

  if (!name) {
    return {
      success: false,
      error: "Collection location name is required.",
    };
  }

  const location = await prisma.collectionLocation.create({
    data: {
      name,
      address: address || null,
      description: description || null,
    },
  });

  return {
    success: true,
    location,
  };
}

export async function updateCollectionLocation(
  formData: FormData
) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const id = cleanString(formData.get("id"));
  const name = cleanString(formData.get("name"));
  const address = cleanString(formData.get("address"));
  const description = cleanString(formData.get("description"));
  const active = formData.get("active") === "true";

  if (!id) {
    return {
      success: false,
      error: "Collection location ID is required.",
    };
  }

  if (!name) {
    return {
      success: false,
      error: "Collection location name is required.",
    };
  }

  const location = await prisma.collectionLocation.update({
    where: {
      id,
    },
    data: {
      name,
      address: address || null,
      description: description || null,
      active,
    },
  });

  return {
    success: true,
    location,
  };
}

export async function deleteCollectionLocation(id: string) {
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

  await prisma.collectionLocation.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
  };
}

export async function toggleCollectionLocation(
  id: string,
  active: boolean
) {
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

  const location = await prisma.collectionLocation.update({
    where: {
      id,
    },
    data: {
      active,
    },
  });

  return {
    success: true,
    location,
  };
}

/*
|--------------------------------------------------------------------------
| COLLECTION SLOTS
|--------------------------------------------------------------------------
*/

export async function createCollectionSlot(formData: FormData) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const name = cleanString(formData.get("name"));
  const startTime = cleanString(formData.get("startTime"));
  const endTime = cleanString(formData.get("endTime"));
  const capacity = parsePositiveInt(formData.get("capacity"));

  if (!name) {
    return {
      success: false,
      error: "Collection slot name is required.",
    };
  }

  if (!startTime || !endTime) {
    return {
      success: false,
      error: "Start time and end time are required.",
    };
  }

  if (capacity === null || capacity < 1) {
    return {
      success: false,
      error: "Slot capacity must be at least 1.",
    };
  }

  const slot = await prisma.collectionSlot.create({
    data: {
      name,
      startTime,
      endTime,
      capacity,
    },
  });

  return {
    success: true,
    slot,
  };
}

export async function updateCollectionSlot(formData: FormData) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  const id = cleanString(formData.get("id"));
  const name = cleanString(formData.get("name"));
  const startTime = cleanString(formData.get("startTime"));
  const endTime = cleanString(formData.get("endTime"));
  const capacity = parsePositiveInt(formData.get("capacity"));
  const active = formData.get("active") === "true";

  if (!id) {
    return {
      success: false,
      error: "Collection slot ID is required.",
    };
  }

  if (!name) {
    return {
      success: false,
      error: "Collection slot name is required.",
    };
  }

  if (!startTime || !endTime) {
    return {
      success: false,
      error: "Start time and end time are required.",
    };
  }

  if (capacity === null || capacity < 1) {
    return {
      success: false,
      error: "Slot capacity must be at least 1.",
    };
  }

  const slot = await prisma.collectionSlot.update({
    where: {
      id,
    },
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
    slot,
  };
}

export async function deleteCollectionSlot(id: string) {
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

  await prisma.collectionSlot.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
  };
}

export async function toggleCollectionSlot(
  id: string,
  active: boolean
) {
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

  const slot = await prisma.collectionSlot.update({
    where: {
      id,
    },
    data: {
      active,
    },
  });

  return {
    success: true,
    slot,
  };
}

/*
|--------------------------------------------------------------------------
| PRODUCT PREPARATION TIME
|--------------------------------------------------------------------------
*/

export async function updateProductPreparationTime(
  productId: string,
  preparationTime: number
) {
  const authResult = await requireAdmin();

  if (!authResult.success) {
    return authResult;
  }

  if (!productId) {
    return {
      success: false,
      error: "Product ID is required.",
    };
  }

  if (
    !Number.isInteger(preparationTime) ||
    preparationTime < 0
  ) {
    return {
      success: false,
      error: "Preparation time must be a valid number.",
    };
  }

  const product = await prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      preparationTime,
    },
    select: {
      id: true,
      name: true,
      preparationTime: true,
    },
  });

  return {
    success: true,
    product,
  };
}