'use client';
import { useEffect, useRef, useState } from 'react';
import { FlyToCartLayer } from '@/components/cart/fly-to-cart-layer';
import { ProductOptions, type ProductSelection } from '@/components/menu/product-options';
import { requestFlyToCart } from '@/lib/fly-to-cart';
import { useCartStore } from '@/store/cart';
import { useToastStore } from '@/store/toast';
import type { Product } from '@/types/product';

const FEEDBACK_MS = 1800;

/** Client bridge between the server-rendered product page and the cart store. */
export function AddToCartOptions({ product }: { product: Product }) {
  const add = useCartStore((s) => s.add);
  const showToast = useToastStore((s) => s.show);
  const [added, setAdded] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [added]);

  const handleAdd = (selection: ProductSelection) => {
    add({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      sizeCode: selection.sizeCode,
      toppingIds: selection.toppingIds,
      toppingNames: selection.toppingIds.map((id) => product.toppings.find((t) => t.id === id)?.name ?? id),
      unitPrice: selection.unitPrice,
      qty: selection.quantity,
      stock: product.stock,
    });

    const rect = submitRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      requestFlyToCart({
        from: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        imageUrl: product.imageUrl,
        alt: product.name,
      });
    }
    setAdded(true);
    showToast('Added to cart', undefined, { label: 'View cart', href: '/cart' });
  };

  return (
    <>
      <FlyToCartLayer />
      <ProductOptions product={product} onAdd={handleAdd} justAdded={added} submitRef={submitRef} />
    </>
  );
}
