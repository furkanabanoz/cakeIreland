"use client";

import { useState } from "react";

import { updateOrderStatus } from "@/actions/order";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const allowedTransitions: Record<
  OrderStatus,
  OrderStatus[]
> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["CONFIRMED", "CANCELLED", "REFUNDED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: OrderStatusSelectProps) {
  const [status, setStatus] =
    useState<OrderStatus>(currentStatus);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const availableStatuses =
    allowedTransitions[currentStatus] ?? [];

  async function handleChange(
    newStatus: OrderStatus
  ) {
    if (newStatus === status) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const result =
      await updateOrderStatus(
        orderId,
        newStatus
      );

    if (!result.success) {
      setMessage(
        result.error ??
          "Failed to update order status."
      );

      setLoading(false);

      return;
    }

    setStatus(newStatus);
    setMessage("Status updated.");

    setLoading(false);

    window.location.reload();
  }

  if (availableStatuses.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        No status changes available
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <select
        value=""
        disabled={loading}
        onChange={(event) => {
          const newStatus =
            event.target.value as OrderStatus;

          if (!newStatus) {
            return;
          }

          handleChange(newStatus);
        }}
        className="rounded-lg border bg-background px-3 py-2 text-xs font-semibold outline-none transition-colors focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">
          {loading
            ? "Updating..."
            : `Change status (${statusLabels[status]})`}
        </option>

        {availableStatuses.map(
          (availableStatus) => (
            <option
              key={availableStatus}
              value={availableStatus}
            >
              {statusLabels[availableStatus]}
            </option>
          )
        )}
      </select>

      {message && (
        <p className="text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}