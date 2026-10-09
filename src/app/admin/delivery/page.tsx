import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

import {
  createCollectionLocation,
  createCollectionSlot,
  createDeliverySlot,
  createDeliveryZone,
  deleteCollectionLocation,
  deleteCollectionSlot,
  deleteDeliverySlot,
  deleteDeliveryZone,
  toggleCollectionLocation,
  toggleCollectionSlot,
  toggleDeliverySlot,
  toggleDeliveryZone,
  updateCollectionLocation,
  updateCollectionSlot,
  updateDeliverySlot,
  updateDeliveryZone,
  updateProductPreparationTime,
} from "./actions";

function formatMoney(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "€0.00";
  }

  return `€${amount.toFixed(2)}`;
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-green-100 text-green-700"
          : "bg-secondary text-muted-foreground"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const inputClassName =
  "h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const editButtonClassName =
  "rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-secondary";

export default async function AdminDeliveryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [
    deliveryZones,
    deliverySlots,
    collectionLocations,
    collectionSlots,
    products,
  ] = await Promise.all([
    prisma.deliveryZone.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.deliverySlot.findMany({
      orderBy: {
        startTime: "asc",
      },
    }),

    prisma.collectionLocation.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.collectionSlot.findMany({
      orderBy: {
        startTime: "asc",
      },
    }),

    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        preparationTime: true,
        available: true,
        published: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const activeZoneCount = deliveryZones.filter(
    (zone) => zone.active
  ).length;

  const activeDeliverySlotCount = deliverySlots.filter(
    (slot) => slot.active
  ).length;

  const activeCollectionLocationCount = collectionLocations.filter(
    (location) => location.active
  ).length;

  const activeCollectionSlotCount = collectionSlots.filter(
    (slot) => slot.active
  ).length;

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/admin"
                className="text-sm font-semibold text-primary hover:underline"
              >
                ← Back to admin
              </Link>

              <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-primary">
                Admin
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Delivery
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Manage delivery zones, delivery prices, delivery slots,
                collection locations, collection slots, capacity and product
                preparation times.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-card px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Zones
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {activeZoneCount}
                </p>
              </div>

              <div className="rounded-xl border bg-card px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Delivery
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {activeDeliverySlotCount}
                </p>
              </div>

              <div className="rounded-xl border bg-card px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Locations
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {activeCollectionLocationCount}
                </p>
              </div>

              <div className="rounded-xl border bg-card px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Collection
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {activeCollectionSlotCount}
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* DELIVERY ZONES */}
          {/* ========================================================= */}

          <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-semibold">Delivery zones</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Configure delivery areas and delivery prices.
              </p>
            </div>

            {/* CREATE */}

            <form
              action={createDeliveryZone}
              className="mt-6 grid gap-4 rounded-xl border bg-secondary/20 p-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <input
                name="name"
                required
                placeholder="Zone name"
                className={inputClassName}
              />

              <input
                name="description"
                placeholder="Description"
                className={inputClassName}
              />

              <input
                name="fee"
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="Fee (€)"
                className={inputClassName}
              />

              <button
                type="submit"
                className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Add zone
              </button>
            </form>

            {/* LIST */}

            <div className="mt-6 overflow-x-auto">
              {deliveryZones.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No delivery zones yet.
                </p>
              ) : (
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="border-b bg-secondary/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Zone
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        Description
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        Price
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        Status
                      </th>

                      <th className="px-4 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {deliveryZones.map((zone) => (
                      <tr
                        key={zone.id}
                        className="transition-colors hover:bg-secondary/20"
                      >
                        <td className="px-4 py-4 font-semibold">
                          {zone.name}
                        </td>

                        <td className="px-4 py-4 text-muted-foreground">
                          {zone.description || "—"}
                        </td>

                        <td className="px-4 py-4 font-semibold">
                          {formatMoney(zone.fee)}
                        </td>

                        <td className="px-4 py-4">
                          <ActiveBadge active={zone.active} />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {/* EDIT */}

                            <details className="relative">
                              <summary
                                className={`${editButtonClassName} cursor-pointer list-none`}
                              >
                                Edit
                              </summary>

                              <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-xl border bg-card p-4 shadow-xl">
                                <p className="mb-4 font-semibold">
                                  Edit delivery zone
                                </p>

                                <form
                                  action={updateDeliveryZone.bind(
                                    null,
                                    zone.id
                                  )}
                                  className="space-y-3"
                                >
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                      Name
                                    </label>

                                    <input
                                      name="name"
                                      required
                                      defaultValue={zone.name}
                                      className={`w-full ${inputClassName}`}
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                      Description
                                    </label>

                                    <input
                                      name="description"
                                      defaultValue={
                                        zone.description ?? ""
                                      }
                                      className={`w-full ${inputClassName}`}
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                      Fee (€)
                                    </label>

                                    <input
                                      name="fee"
                                      required
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      defaultValue={Number(zone.fee)}
                                      className={`w-full ${inputClassName}`}
                                    />
                                  </div>

                                  <input
                                    type="hidden"
                                    name="active"
                                    value={
                                      zone.active ? "true" : "false"
                                    }
                                  />

                                  <button
                                    type="submit"
                                    className="w-full rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                                  >
                                    Save changes
                                  </button>
                                </form>
                              </div>
                            </details>

                            {/* TOGGLE */}

                            <form
                              action={toggleDeliveryZone.bind(
                                null,
                                zone.id
                              )}
                            >
                              <button
                                type="submit"
                                className={editButtonClassName}
                              >
                                {zone.active ? "Disable" : "Enable"}
                              </button>
                            </form>

                            {/* DELETE */}

                            <form
                              action={deleteDeliveryZone.bind(
                                null,
                                zone.id
                              )}
                            >
                              <button
                                type="submit"
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* DELIVERY SLOTS */}
          {/* ========================================================= */}

          <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Delivery slots</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Configure delivery times and maximum order capacity.
            </p>

            {/* CREATE */}

            <form
              action={createDeliverySlot}
              className="mt-6 grid gap-4 rounded-xl border bg-secondary/20 p-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <input
                name="name"
                required
                placeholder="Slot name"
                className={inputClassName}
              />

              <input
                name="startTime"
                required
                type="time"
                className={inputClassName}
              />

              <input
                name="endTime"
                required
                type="time"
                className={inputClassName}
              />

              <input
                name="capacity"
                required
                type="number"
                min="1"
                step="1"
                placeholder="Capacity"
                className={inputClassName}
              />

              <button
                type="submit"
                className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Add slot
              </button>
            </form>

            {/* LIST */}

            <div className="mt-6 space-y-3">
              {deliverySlots.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No delivery slots yet.
                </p>
              ) : (
                deliverySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{slot.name}</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {slot.startTime} – {slot.endTime}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                        Capacity: {slot.capacity}
                      </span>

                      <ActiveBadge active={slot.active} />

                      {/* EDIT */}

                      <details className="relative">
                        <summary
                          className={`${editButtonClassName} cursor-pointer list-none`}
                        >
                          Edit
                        </summary>

                        <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-xl border bg-card p-4 shadow-xl">
                          <p className="mb-4 font-semibold">
                            Edit delivery slot
                          </p>

                          <form
                            action={updateDeliverySlot.bind(
                              null,
                              slot.id
                            )}
                            className="space-y-3"
                          >
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                Name
                              </label>

                              <input
                                name="name"
                                required
                                defaultValue={slot.name}
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                Start time
                              </label>

                              <input
                                name="startTime"
                                required
                                type="time"
                                defaultValue={slot.startTime}
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                End time
                              </label>

                              <input
                                name="endTime"
                                required
                                type="time"
                                defaultValue={slot.endTime}
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                Capacity
                              </label>

                              <input
                                name="capacity"
                                required
                                type="number"
                                min="1"
                                step="1"
                                defaultValue={slot.capacity}
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <input
                              type="hidden"
                              name="active"
                              value={
                                slot.active ? "true" : "false"
                              }
                            />

                            <button
                              type="submit"
                              className="w-full rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                            >
                              Save changes
                            </button>
                          </form>
                        </div>
                      </details>

                      {/* TOGGLE */}

                      <form
                        action={toggleDeliverySlot.bind(
                          null,
                          slot.id
                        )}
                      >
                        <button
                          type="submit"
                          className={editButtonClassName}
                        >
                          {slot.active ? "Disable" : "Enable"}
                        </button>
                      </form>

                      {/* DELETE */}

                      <form
                        action={deleteDeliverySlot.bind(
                          null,
                          slot.id
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* COLLECTION LOCATIONS */}
          {/* ========================================================= */}

          <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="text-xl font-semibold">
              Collection locations
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage customer collection points.
            </p>

            {/* CREATE */}

            <form
              action={createCollectionLocation}
              className="mt-6 grid gap-4 rounded-xl border bg-secondary/20 p-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <input
                name="name"
                required
                placeholder="Location name"
                className={inputClassName}
              />

              <input
                name="address"
                placeholder="Address"
                className={inputClassName}
              />

              <input
                name="description"
                placeholder="Description"
                className={inputClassName}
              />

              <button
                type="submit"
                className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Add location
              </button>
            </form>

            {/* LIST */}

            <div className="mt-6 space-y-3">
              {collectionLocations.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No collection locations yet.
                </p>
              ) : (
                collectionLocations.map((location) => (
                  <div
                    key={location.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        {location.name}
                      </p>

                      {location.address && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {location.address}
                        </p>
                      )}

                      {location.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {location.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <ActiveBadge active={location.active} />

                      {/* EDIT */}

                      <details className="relative">
                        <summary
                          className={`${editButtonClassName} cursor-pointer list-none`}
                        >
                          Edit
                        </summary>

                        <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-xl border bg-card p-4 shadow-xl">
                          <p className="mb-4 font-semibold">
                            Edit collection location
                          </p>

                          <form
                            action={updateCollectionLocation.bind(
                              null,
                              location.id
                            )}
                            className="space-y-3"
                          >
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                Name
                              </label>

                              <input
                                name="name"
                                required
                                defaultValue={location.name}
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                Address
                              </label>

                              <input
                                name="address"
                                defaultValue={
                                  location.address ?? ""
                                }
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                Description
                              </label>

                              <input
                                name="description"
                                defaultValue={
                                  location.description ?? ""
                                }
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <input
                              type="hidden"
                              name="active"
                              value={
                                location.active
                                  ? "true"
                                  : "false"
                              }
                            />

                            <button
                              type="submit"
                              className="w-full rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                            >
                              Save changes
                            </button>
                          </form>
                        </div>
                      </details>

                      {/* TOGGLE */}

                      <form
                        action={toggleCollectionLocation.bind(
                          null,
                          location.id
                        )}
                      >
                        <button
                          type="submit"
                          className={editButtonClassName}
                        >
                          {location.active ? "Disable" : "Enable"}
                        </button>
                      </form>

                      {/* DELETE */}

                      <form
                        action={deleteCollectionLocation.bind(
                          null,
                          location.id
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* COLLECTION SLOTS */}
          {/* ========================================================= */}

          <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="text-xl font-semibold">
              Collection slots
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Configure collection times and capacity.
            </p>

            {/* CREATE */}

            <form
              action={createCollectionSlot}
              className="mt-6 grid gap-4 rounded-xl border bg-secondary/20 p-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <input
                name="name"
                required
                placeholder="Slot name"
                className={inputClassName}
              />

              <input
                name="startTime"
                required
                type="time"
                className={inputClassName}
              />

              <input
                name="endTime"
                required
                type="time"
                className={inputClassName}
              />

              <input
                name="capacity"
                required
                type="number"
                min="1"
                step="1"
                placeholder="Capacity"
                className={inputClassName}
              />

              <button
                type="submit"
                className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Add slot
              </button>
            </form>

            {/* LIST */}

            <div className="mt-6 space-y-3">
              {collectionSlots.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No collection slots yet.
                </p>
              ) : (
                collectionSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{slot.name}</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {slot.startTime} – {slot.endTime}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                        Capacity: {slot.capacity}
                      </span>

                      <ActiveBadge active={slot.active} />

                      {/* EDIT */}

                      <details className="relative">
                        <summary
                          className={`${editButtonClassName} cursor-pointer list-none`}
                        >
                          Edit
                        </summary>

                        <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-xl border bg-card p-4 shadow-xl">
                          <p className="mb-4 font-semibold">
                            Edit collection slot
                          </p>

                          <form
                            action={updateCollectionSlot.bind(
                              null,
                              slot.id
                            )}
                            className="space-y-3"
                          >
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                Name
                              </label>

                              <input
                                name="name"
                                required
                                defaultValue={slot.name}
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                Start time
                              </label>

                              <input
                                name="startTime"
                                required
                                type="time"
                                defaultValue={slot.startTime}
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                End time
                              </label>

                              <input
                                name="endTime"
                                required
                                type="time"
                                defaultValue={slot.endTime}
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                Capacity
                              </label>

                              <input
                                name="capacity"
                                required
                                type="number"
                                min="1"
                                step="1"
                                defaultValue={slot.capacity}
                                className={`w-full ${inputClassName}`}
                              />
                            </div>

                            <input
                              type="hidden"
                              name="active"
                              value={
                                slot.active ? "true" : "false"
                              }
                            />

                            <button
                              type="submit"
                              className="w-full rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                            >
                              Save changes
                            </button>
                          </form>
                        </div>
                      </details>

                      {/* TOGGLE */}

                      <form
                        action={toggleCollectionSlot.bind(
                          null,
                          slot.id
                        )}
                      >
                        <button
                          type="submit"
                          className={editButtonClassName}
                        >
                          {slot.active ? "Disable" : "Enable"}
                        </button>
                      </form>

                      {/* DELETE */}

                      <form
                        action={deleteCollectionSlot.bind(
                          null,
                          slot.id
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* PREPARATION TIME */}
          {/* ========================================================= */}

          <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-semibold">
                Preparation time
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Set the preparation time for each product in minutes.
              </p>
            </div>

            <div className="mt-6 overflow-x-auto">
              {products.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No products found.
                </p>
              ) : (
                <table className="w-full min-w-[650px] text-sm">
                  <thead className="border-b bg-secondary/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Product
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        Status
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        Preparation
                      </th>

                      <th className="px-4 py-3 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="transition-colors hover:bg-secondary/20"
                      >
                        <td className="px-4 py-4 font-semibold">
                          {product.name}
                        </td>

                        <td className="px-4 py-4">
                          {product.available &&
                          product.published ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Available
                            </span>
                          ) : (
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                              Unavailable
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <form
                            action={updateProductPreparationTime.bind(
                              null,
                              product.id
                            )}
                            className="flex items-center gap-2"
                          >
                            <input
                              name="preparationTime"
                              type="number"
                              min="0"
                              step="1"
                              required
                              defaultValue={
                                product.preparationTime
                              }
                              className="h-10 w-28 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />

                            <span className="text-sm text-muted-foreground">
                              minutes
                            </span>

                            <button
                              type="submit"
                              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                            >
                              Save
                            </button>
                          </form>
                        </td>

                        <td className="px-4 py-4 text-right text-xs text-muted-foreground">
                          {product.id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
