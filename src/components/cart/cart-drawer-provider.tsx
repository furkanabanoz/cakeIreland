"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import {
  getCartDrawerData,
  removeCartItem,
  updateCartItem,
} from "@/actions/cart";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type CartDrawerItem = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
};

type CartDrawerContextValue = {
  count: number;
  refreshAndOpen: () => Promise<void>;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);

  if (!context) {
    throw new Error("useCartDrawer must be used within CartDrawerProvider.");
  }

  return context;
}

export function CartDrawerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartDrawerItem[]>([]);
  const [open, setOpen] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const cartRequestVersion = useRef(0);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );

  const refreshCart = useCallback(async () => {
    const requestVersion = ++cartRequestVersion.current;
    const cart = await getCartDrawerData();
    if (requestVersion === cartRequestVersion.current) {
      setItems(cart.items);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const requestVersion = ++cartRequestVersion.current;

    getCartDrawerData()
      .then((cart) => {
        if (active && requestVersion === cartRequestVersion.current) {
          setItems(cart.items);
        }
      })
      .catch((cause: unknown) => {
        console.error("Unable to load the cart drawer contents.", cause);
        if (active) {
          setError("Unable to load your cart. Please try again.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      cartRequestVersion.current += 1;
    };
  }, []);

  const refreshAndOpen = useCallback(async () => {
    setError("");
    await refreshCart();
    setOpen(true);
  }, [refreshCart]);

  const contextValue = useMemo(
    () => ({ count, refreshAndOpen }),
    [count, refreshAndOpen]
  );

  async function changeQuantity(item: CartDrawerItem, quantity: number) {
    setError("");
    setBusyItemId(item.id);
    try {
      const result = await updateCartItem(item.id, quantity);
      if (!result.success) {
        setError(result.error ?? "Unable to update this item.");
        return;
      }
      await refreshCart();
    } catch (cause) {
      console.error("Unable to update a cart item.", cause);
      setError("Unable to update this item. Please try again.");
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(item: CartDrawerItem) {
    setError("");
    setBusyItemId(item.id);
    try {
      const result = await removeCartItem(item.id);
      if (!result.success) {
        setError(result.error ?? "Unable to remove this item.");
        return;
      }
      await refreshCart();
    } catch (cause) {
      console.error("Unable to remove a cart item.", cause);
      setError("Unable to remove this item. Please try again.");
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <CartDrawerContext.Provider value={contextValue}>
      <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
        {children}
        <DrawerContent className="h-dvh max-h-dvh w-[min(420px,92vw)] rounded-none border-l">
          <DrawerHeader className="flex-row items-start justify-between gap-4 border-b px-5 py-5">
            <div>
              <DrawerTitle className="text-xl font-bold">
                Your Cart
              </DrawerTitle>
              <DrawerDescription className="mt-1">
                {count} {count === 1 ? "item" : "items"} in your cart
              </DrawerDescription>
            </div>
            <DrawerClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close cart"
                />
              }
            >
              <X aria-hidden="true" />
            </DrawerClose>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {error && (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading your cart…
              </p>
            ) : items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingBag className="size-10 text-muted-foreground" />
                <p className="mt-4 font-semibold">Your cart is empty</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a cake to see it here.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {items.map((item) => {
                  const busy = busyItemId === item.id;
                  return (
                    <li key={item.id} className="flex gap-3 py-4">
                      <Link
                        href={`/cakes/${item.slug}`}
                        onClick={() => setOpen(false)}
                        className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-accent/40"
                        aria-label={`View ${item.name}`}
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            sizes="80px"
                            unoptimized={!item.image.startsWith("/")}
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-3xl">
                            🍰
                          </span>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/cakes/${item.slug}`}
                            onClick={() => setOpen(false)}
                            className="font-semibold hover:text-primary"
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            aria-label={`Remove ${item.name}`}
                            disabled={busy}
                            onClick={() => void removeItem(item)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          €{item.unitPrice.toFixed(2)} each
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-md border">
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name} quantity`}
                              disabled={busy || item.quantity <= 1}
                              onClick={() =>
                                void changeQuantity(item, item.quantity - 1)
                              }
                              className="p-1.5 hover:bg-accent disabled:opacity-40"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-8 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${item.name} quantity`}
                              disabled={busy}
                              onClick={() =>
                                void changeQuantity(item, item.quantity + 1)
                              }
                              className="p-1.5 hover:bg-accent disabled:opacity-40"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="font-semibold">
                            €{(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DrawerFooter className="border-t px-5 py-5">
            <div className="flex justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Delivery and discounts are calculated at checkout.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <DrawerClose
                render={
                  <Button
                    variant="outline"
                    render={<Link href="/cart" />}
                  />
                }
              >
                View Cart
              </DrawerClose>
              <DrawerClose
                render={<Button render={<Link href="/checkout" />} />}
              >
                Checkout
                <ArrowRight aria-hidden="true" />
              </DrawerClose>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </CartDrawerContext.Provider>
  );
}
