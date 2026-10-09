"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const profileSchema = z.object({
  name: z.string().trim().max(100),
  phone: z.string().trim().max(30),
});

const addressSchema = z.object({
  id: z.string().trim().optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  addressLine1: z.string().trim().min(1).max(160),
  addressLine2: z.string().trim().max(160),
  city: z.string().trim().min(1).max(100),
  county: z.string().trim().max(100),
  eircode: z.string().trim().max(20),
  phone: z.string().trim().max(30),
});

const deletionSchema = z.object({
  password: z.string().min(8).max(128),
  confirmation: z.literal("DELETE"),
});

export async function updateProfile(input: unknown) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Sign in to update your profile.",
    };
  }

  const parsed = profileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Enter a name and phone number within the allowed length.",
    };
  }

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      name: parsed.data.name || null,
      phone: parsed.data.phone || null,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/settings");

  return {
    success: true,
  };
}

export async function saveAddress(input: unknown) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Sign in to manage your addresses.",
    };
  }

  const parsed = addressSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Check the required address fields and try again.",
    };
  }

  const { id, ...address } = parsed.data;
  const data = {
    firstName: address.firstName,
    lastName: address.lastName,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || null,
    city: address.city,
    county: address.county || null,
    eircode: address.eircode || null,
    phone: address.phone || null,
  };

  if (id) {
    const result = await prisma.address.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data,
    });

    if (result.count !== 1) {
      return {
        success: false,
        error: "Address not found. Refresh the page and try again.",
      };
    }
  } else {
    await prisma.address.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");

  return {
    success: true,
  };
}

export async function deleteAddress(id: unknown) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Sign in to manage your addresses.",
    };
  }

  const parsedId = z.string().trim().min(1).max(128).safeParse(id);

  if (!parsedId.success) {
    return {
      success: false,
      error: "Address not found. Refresh the page and try again.",
    };
  }

  const result = await prisma.address.deleteMany({
    where: {
      id: parsedId.data,
      userId: session.user.id,
    },
  });

  if (result.count !== 1) {
    return {
      success: false,
      error: "Address not found. Refresh the page and try again.",
    };
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");

  return {
    success: true,
  };
}

export async function deleteAccount(input: unknown) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Sign in to delete your account.",
    };
  }

  const parsed = deletionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Enter your password and type DELETE to confirm.",
    };
  }

  const limit = await checkRateLimit({
    key: `account-delete:${session.user.id}`,
    userId: session.user.id,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!limit.allowed) {
    return {
      success: false,
      error: "Too many attempts. Try again later.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      passwordHash: true,
    },
  });

  if (
    !user?.passwordHash ||
    !(await bcrypt.compare(parsed.data.password, user.passwordHash))
  ) {
    return {
      success: false,
      error: "Unable to verify your account. Check your password or contact support.",
    };
  }

  await prisma.user.delete({
    where: {
      id: session.user.id,
    },
  });

  return {
    success: true,
  };
}
