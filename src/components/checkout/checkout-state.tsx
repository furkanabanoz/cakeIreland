"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type DeliveryType = "DELIVERY" | "COLLECTION";

type CheckoutState = {
  deliveryType: DeliveryType;
  deliveryFee: number;
  deliveryZoneSelected: boolean;
  setDeliveryType: (type: DeliveryType) => void;
  setDeliveryFee: (fee: number) => void;
  setDeliveryZoneSelected: (selected: boolean) => void;
};

const CheckoutStateContext = createContext<CheckoutState | null>(null);

export function CheckoutStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [deliveryType, setSelectedDeliveryType] =
    useState<DeliveryType>("DELIVERY");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryZoneSelected, setDeliveryZoneSelected] = useState(false);

  function setDeliveryType(type: DeliveryType) {
    setSelectedDeliveryType(type);
    setDeliveryFee(0);
    setDeliveryZoneSelected(false);
  }

  return (
    <CheckoutStateContext.Provider
      value={{
        deliveryType,
        deliveryFee,
        deliveryZoneSelected,
        setDeliveryType,
        setDeliveryFee,
        setDeliveryZoneSelected,
      }}
    >
      {children}
    </CheckoutStateContext.Provider>
  );
}

export function useCheckoutState() {
  const context = useContext(CheckoutStateContext);

  if (!context) {
    throw new Error(
      "useCheckoutState must be used within CheckoutStateProvider."
    );
  }

  return context;
}
