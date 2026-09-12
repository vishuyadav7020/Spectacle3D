import { type FormEvent, useState } from "react";
import axios from "axios";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
  type Variant,
  type VariantInput,
  addVariant,
  deleteVariant,
  updateVariant,
} from "../../lib/products";

export interface StagedVariant extends VariantInput {
  tempId: string;
}

const EMPTY_FORM: VariantInput = {
  material: "",
  color: "",
  price: 0,
  stock_quantity: 0,
  sku: "",
};

function makeTempId(): string {
  return `staged-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface VariantManagerProps {
  /** Omit while creating a new product — there's no product id yet, so
   * variants are staged locally via onStagedChange instead of hitting the API. */
  productId?: string;
  variants: Variant[];
  stagedVariants?: StagedVariant[];
  onStagedChange?: (variants: StagedVariant[]) => void;
}

export function VariantManager({
  productId,
  variants: initialVariants,
  stagedVariants = [],
  onStagedChange,
}: VariantManagerProps) {
  const isStaged = !productId;

  const [variants, setVariants] = useState(initialVariants);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<VariantInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Backend accepts null for sku but not "" (no allow_blank) — the form
    // has no SKU input yet, so this is always empty; send null instead.
    const payload = { ...form, sku: form.sku || null };

    if (isStaged) {
      onStagedChange?.([...stagedVariants, { ...payload, tempId: makeTempId() }]);
      setForm(EMPTY_FORM);
      setFormOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      const created = await addVariant(productId!, payload);
      setVariants([...variants, created]);
      setForm(EMPTY_FORM);
      setFormOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, unknown>;
        setError(String(Object.values(data).flat().find(Boolean) ?? "Could not add variant."));
      } else {
        setError("Could not add variant.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(variant: Variant) {
    if (!productId) return;
    try {
      const updated = await updateVariant(productId, variant.id, {
        is_active: !variant.is_active,
      });
      setVariants(variants.map((v) => (v.id === variant.id ? updated : v)));
    } catch {
      setError("Could not update variant.");
    }
  }

  async function handleDelete(variantId: string) {
    if (!productId) return;
    try {
      await deleteVariant(productId, variantId);
      setVariants(variants.filter((v) => v.id !== variantId));
    } catch {
      setError("Could not delete variant.");
    }
  }

  function handleRemoveStaged(tempId: string) {
    onStagedChange?.(stagedVariants.filter((v) => v.tempId !== tempId));
  }

  const isEmpty = isStaged ? stagedVariants.length === 0 : variants.length === 0;

  return (
    <section className="mt-8 rounded-lg border border-border bg-surface p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium text-text-primary">
          Variants
        </h2>
        {!formOpen && (
          <Button variant="secondary" onClick={() => setFormOpen(true)}>
            Add Variant
          </Button>
        )}
      </div>

      {isStaged && (
        <p className="mt-2 font-body text-xs text-text-secondary">
          Variants added here will be attached automatically once you create the product.
        </p>
      )}

      {error && (
        <p className="mt-3 font-body text-sm text-accent-warm">{error}</p>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Material"
              name="variant_material"
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
              required
            />
            <Input
              label="Color"
              name="variant_color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              required
            />
            <Input
              label="Price (₹)"
              name="variant_price"
              type="number"
              min={0}
              value={form.price === 0 ? "" : form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
              required
            />
            <Input
              label="Stock quantity"
              name="variant_stock"
              type="number"
              min={0}
              value={form.stock_quantity === 0 ? "" : form.stock_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock_quantity: e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Adding..." : "Add Variant"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {isEmpty && !formOpen && (
        <p className="mt-4 font-body text-sm text-text-secondary">
          No variants yet — this product sells at its base price only.
        </p>
      )}

      {isStaged && stagedVariants.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {stagedVariants.map((variant) => (
            <div
              key={variant.tempId}
              className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-4 py-3"
            >
              <div>
                <p className="font-body text-sm font-medium text-text-primary">
                  {variant.material} · {variant.color}
                </p>
                <p className="font-body text-sm text-text-secondary">
                  ₹{variant.price.toLocaleString("en-IN")} · {variant.stock_quantity} in stock
                </p>
              </div>
              <button
                onClick={() => handleRemoveStaged(variant.tempId)}
                className="font-body text-sm text-accent-warm hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {!isStaged && variants.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-4 py-3"
            >
              <div>
                <p className="font-body text-sm font-medium text-text-primary">
                  {variant.material} · {variant.color}
                </p>
                <p className="font-body text-sm text-text-secondary">
                  ₹{variant.price.toLocaleString("en-IN")} · {variant.stock_quantity} in stock
                  {!variant.is_active && " · inactive"}
                </p>
              </div>
              <div className="flex gap-4 font-body text-sm">
                <button
                  onClick={() => handleToggleActive(variant)}
                  className="text-accent-primary hover:underline"
                >
                  {variant.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(variant.id)}
                  className="text-accent-warm hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
