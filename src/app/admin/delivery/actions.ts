"use server";

import { revalidatePath } from "next/cache";

import {
  createCollectionLocation as createCollectionLocationAction,
  createCollectionSlot as createCollectionSlotAction,
  createDeliverySlot as createDeliverySlotAction,
  createDeliveryZone as createDeliveryZoneAction,
  deleteCollectionLocation as deleteCollectionLocationAction,
  deleteCollectionSlot as deleteCollectionSlotAction,
  deleteDeliverySlot as deleteDeliverySlotAction,
  deleteDeliveryZone as deleteDeliveryZoneAction,
  toggleCollectionLocation as toggleCollectionLocationAction,
  toggleCollectionSlot as toggleCollectionSlotAction,
  toggleDeliverySlot as toggleDeliverySlotAction,
  toggleDeliveryZone as toggleDeliveryZoneAction,
  updateCollectionLocation as updateCollectionLocationAction,
  updateCollectionSlot as updateCollectionSlotAction,
  updateDeliverySlot as updateDeliverySlotAction,
  updateDeliveryZone as updateDeliveryZoneAction,
  updateProductPreparationTime as updateProductPreparationTimeAction,
} from "@/actions/admin-delivery";

export async function createDeliveryZone(formData: FormData) {
  await createDeliveryZoneAction(formData);
  revalidatePath("/admin/delivery");
}

export async function updateDeliveryZone(
  id: string,
  formData: FormData
) {
  await updateDeliveryZoneAction(id, formData);
  revalidatePath("/admin/delivery");
}

export async function deleteDeliveryZone(id: string) {
  await deleteDeliveryZoneAction(id);
  revalidatePath("/admin/delivery");
}

export async function toggleDeliveryZone(id: string) {
  await toggleDeliveryZoneAction(id);
  revalidatePath("/admin/delivery");
}

export async function createDeliverySlot(formData: FormData) {
  await createDeliverySlotAction(formData);
  revalidatePath("/admin/delivery");
}

export async function updateDeliverySlot(
  id: string,
  formData: FormData
) {
  await updateDeliverySlotAction(id, formData);
  revalidatePath("/admin/delivery");
}

export async function deleteDeliverySlot(id: string) {
  await deleteDeliverySlotAction(id);
  revalidatePath("/admin/delivery");
}

export async function toggleDeliverySlot(id: string) {
  await toggleDeliverySlotAction(id);
  revalidatePath("/admin/delivery");
}

export async function createCollectionLocation(formData: FormData) {
  await createCollectionLocationAction(formData);
  revalidatePath("/admin/delivery");
}

export async function updateCollectionLocation(
  id: string,
  formData: FormData
) {
  await updateCollectionLocationAction(id, formData);
  revalidatePath("/admin/delivery");
}

export async function deleteCollectionLocation(id: string) {
  await deleteCollectionLocationAction(id);
  revalidatePath("/admin/delivery");
}

export async function toggleCollectionLocation(id: string) {
  await toggleCollectionLocationAction(id);
  revalidatePath("/admin/delivery");
}

export async function createCollectionSlot(formData: FormData) {
  await createCollectionSlotAction(formData);
  revalidatePath("/admin/delivery");
}

export async function updateCollectionSlot(
  id: string,
  formData: FormData
) {
  await updateCollectionSlotAction(id, formData);
  revalidatePath("/admin/delivery");
}

export async function deleteCollectionSlot(id: string) {
  await deleteCollectionSlotAction(id);
  revalidatePath("/admin/delivery");
}

export async function toggleCollectionSlot(id: string) {
  await toggleCollectionSlotAction(id);
  revalidatePath("/admin/delivery");
}

export async function updateProductPreparationTime(
  id: string,
  formData: FormData
) {
  await updateProductPreparationTimeAction(id, formData);
  revalidatePath("/admin/delivery");
}
