"use client";

import { useState, useTransition, type FormEvent } from "react";

import { deleteAddress, saveAddress } from "@/actions/account";

type AddressRecord = {
  id: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  county: string | null;
  eircode: string | null;
  phone: string | null;
};

type AddressFields = {
  [Field in keyof Omit<AddressRecord, "id">]: string;
};

const emptyAddress: AddressFields = {
  firstName: "",
  lastName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  county: "",
  eircode: "",
  phone: "",
};

function AddressForm({
  address,
  onCancel,
  onSaved,
}: {
  address?: AddressRecord;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [fields, setFields] = useState<AddressFields>(() =>
    address
      ? {
          firstName: address.firstName,
          lastName: address.lastName,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 ?? "",
          city: address.city,
          county: address.county ?? "",
          eircode: address.eircode ?? "",
          phone: address.phone ?? "",
        }
      : emptyAddress
  );
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof AddressFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await saveAddress({
        ...fields,
        ...(address ? { id: address.id } : {}),
      });

      if (!result.success) {
        setMessage(result.error ?? "Unable to save this address.");
        return;
      }

      onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="address-first-name" className="text-sm font-medium">
            First name
          </label>
          <input
            id="address-first-name"
            value={fields.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            maxLength={80}
            autoComplete="given-name"
            required
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="address-last-name" className="text-sm font-medium">
            Last name
          </label>
          <input
            id="address-last-name"
            value={fields.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            maxLength={80}
            autoComplete="family-name"
            required
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address-line-1" className="text-sm font-medium">
          Address
        </label>
        <input
          id="address-line-1"
          value={fields.addressLine1}
          onChange={(event) => updateField("addressLine1", event.target.value)}
          maxLength={160}
          autoComplete="address-line1"
          required
          className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="address-line-2" className="text-sm font-medium">
          Address line 2
        </label>
        <input
          id="address-line-2"
          value={fields.addressLine2}
          onChange={(event) => updateField("addressLine2", event.target.value)}
          maxLength={160}
          autoComplete="address-line2"
          className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="address-city" className="text-sm font-medium">
            City
          </label>
          <input
            id="address-city"
            value={fields.city}
            onChange={(event) => updateField("city", event.target.value)}
            maxLength={100}
            autoComplete="address-level2"
            required
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="address-county" className="text-sm font-medium">
            County
          </label>
          <input
            id="address-county"
            value={fields.county}
            onChange={(event) => updateField("county", event.target.value)}
            maxLength={100}
            autoComplete="address-level1"
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="address-eircode" className="text-sm font-medium">
            Eircode
          </label>
          <input
            id="address-eircode"
            value={fields.eircode}
            onChange={(event) => updateField("eircode", event.target.value)}
            maxLength={20}
            autoComplete="postal-code"
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="address-phone" className="text-sm font-medium">
            Phone
          </label>
          <input
            id="address-phone"
            type="tel"
            value={fields.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            maxLength={30}
            autoComplete="tel"
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </div>
      </div>

      {message && (
        <p aria-live="polite" className="text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border px-5 py-3 text-sm font-semibold disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: AddressRecord[] }) {
  const [editingAddress, setEditingAddress] = useState<AddressRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!window.confirm("Delete this saved address?")) {
      return;
    }

    setMessage("");
    setDeletingId(id);

    startTransition(async () => {
      const result = await deleteAddress(id);
      setDeletingId(null);

      if (!result.success) {
        setMessage(result.error ?? "Unable to delete this address.");
      }
    });
  }

  return (
    <div className="mt-8 space-y-5">
      {addresses.length === 0 && !isCreating ? (
        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            You have not saved any addresses yet.
          </p>
        </div>
      ) : (
        addresses.map((address) => (
          <section key={address.id} className="rounded-2xl border bg-card p-5 sm:p-6">
            {editingAddress?.id === address.id ? (
              <AddressForm
                key={address.id}
                address={address}
                onCancel={() => setEditingAddress(null)}
                onSaved={() => setEditingAddress(null)}
              />
            ) : (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">
                    {address.firstName} {address.lastName}
                  </p>
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>
                    {[address.city, address.county, address.eircode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {address.phone && (
                    <p className="text-muted-foreground">{address.phone}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingAddress(address)}
                    disabled={isPending}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(address.id)}
                    disabled={isPending}
                    className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-60"
                  >
                    {deletingId === address.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </section>
        ))
      )}

      {message && (
        <p aria-live="polite" className="text-sm text-destructive">
          {message}
        </p>
      )}

      {isCreating ? (
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <AddressForm
            key="new-address"
            onCancel={() => setIsCreating(false)}
            onSaved={() => setIsCreating(false)}
          />
        </section>
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditingAddress(null);
            setIsCreating(true);
          }}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Add address
        </button>
      )}
    </div>
  );
}
