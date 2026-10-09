"use client";

import { useCheckoutState } from "./checkout-state";

type DeliveryZone = {
  id: string;
  name: string;
  description: string | null;
  fee: number;
};

type TimeSlot = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
};

export function FulfillmentFields({
  deliveryZones,
  deliverySlots,
  collectionSlots,
}: {
  deliveryZones: DeliveryZone[];
  deliverySlots: TimeSlot[];
  collectionSlots: TimeSlot[];
}) {
  const {
    deliveryType,
    setDeliveryType,
    setDeliveryFee,
    setDeliveryZoneSelected,
  } = useCheckoutState();
  const isDelivery = deliveryType === "DELIVERY";
  const timeSlots = isDelivery ? deliverySlots : collectionSlots;

  return (
    <>
      <section className="rounded-2xl border bg-background p-6">
        <h2 className="text-xl font-bold">Delivery or collection</h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="cursor-pointer rounded-xl border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="deliveryType"
              value="DELIVERY"
              checked={isDelivery}
              onChange={() => setDeliveryType("DELIVERY")}
              className="sr-only"
            />
            <span className="font-semibold">🚚 Delivery</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Have your cake delivered.
            </span>
          </label>

          <label className="cursor-pointer rounded-xl border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="deliveryType"
              value="COLLECTION"
              checked={!isDelivery}
              onChange={() => setDeliveryType("COLLECTION")}
              className="sr-only"
            />
            <span className="font-semibold">🏠 Collection</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Collect your order.
            </span>
          </label>
        </div>
      </section>

      {isDelivery && (
        <>
          <section className="rounded-2xl border bg-background p-6">
            <h2 className="text-xl font-bold">Delivery address</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Required when delivery is selected.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="addressLine1" className="text-sm font-medium">
                  Address
                </label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  required
                  autoComplete="address-line1"
                  className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="addressLine2" className="text-sm font-medium">
                  Address line 2
                </label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  autoComplete="address-line2"
                  className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className="text-sm font-medium">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    required
                    autoComplete="address-level2"
                    className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label htmlFor="eircode" className="text-sm font-medium">
                    Eircode
                  </label>
                  <input
                    id="eircode"
                    name="eircode"
                    autoComplete="postal-code"
                    className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm uppercase outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-background p-6">
            <h2 className="text-xl font-bold">Delivery area</h2>
            <div className="mt-5 space-y-3">
              {deliveryZones.length === 0 ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  No delivery areas are currently available.
                </p>
              ) : (
                deliveryZones.map((zone) => (
                  <label
                    key={zone.id}
                    className="flex cursor-pointer items-center justify-between rounded-xl border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="deliveryZoneId"
                        value={zone.id}
                        required
                        onChange={() => {
                          setDeliveryFee(zone.fee);
                          setDeliveryZoneSelected(true);
                        }}
                      />
                      <span>
                        <span className="block font-medium">{zone.name}</span>
                        {zone.description && (
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {zone.description}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="font-semibold">
                      €{zone.fee.toFixed(2)}
                    </span>
                  </label>
                ))
              )}
            </div>
          </section>
        </>
      )}

      <section className="rounded-2xl border bg-background p-6">
        <h2 className="text-xl font-bold">Date and time</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="deliveryDate" className="text-sm font-medium">
              {isDelivery ? "Delivery date" : "Collection date"}
            </label>
            <input
              id="deliveryDate"
              name="deliveryDate"
              type="date"
              required
              className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label
              htmlFor={isDelivery ? "deliverySlotId" : "collectionSlotId"}
              className="text-sm font-medium"
            >
              Time slot
            </label>
            <select
              key={deliveryType}
              id={isDelivery ? "deliverySlotId" : "collectionSlotId"}
              name="deliverySlotId"
              required
              defaultValue=""
              className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a time</option>
              {timeSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.name} ({slot.startTime} - {slot.endTime})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </>
  );
}
