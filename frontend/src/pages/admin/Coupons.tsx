import { type FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import {
  type Coupon,
  type CouponInput,
  type DiscountType,
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
} from "../../lib/coupons";

const EMPTY_FORM = {
  code: "",
  description: "",
  discount_type: "percentage" as DiscountType,
  value: "",
  max_discount_amount: "",
  min_order_value: "",
  usage_limit: "",
  usage_limit_per_user: "1",
  valid_from: "",
  valid_until: "",
};

function toIsoStart(date: string): string | undefined {
  return date ? new Date(`${date}T00:00:00`).toISOString() : undefined;
}

function toIsoEnd(date: string): string | null | undefined {
  return date ? new Date(`${date}T23:59:59`).toISOString() : null;
}

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    try {
      const data = await listCoupons({ page_size: 50 });
      setCoupons(data.results);
      setCount(data.count);
    } catch {
      setError("Could not load coupons.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreateForm() {
    setEditingCoupon(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(coupon: Coupon) {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      value: String(coupon.value),
      max_discount_amount: coupon.max_discount_amount != null ? String(coupon.max_discount_amount) : "",
      min_order_value: String(coupon.min_order_value),
      usage_limit: coupon.usage_limit != null ? String(coupon.usage_limit) : "",
      usage_limit_per_user: String(coupon.usage_limit_per_user),
      valid_from: toDateInput(coupon.valid_from),
      valid_until: toDateInput(coupon.valid_until),
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCoupon(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload: CouponInput = {
      code: form.code.trim(),
      description: form.description.trim(),
      discount_type: form.discount_type,
      value: Number(form.value),
      max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
      min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      usage_limit_per_user: Number(form.usage_limit_per_user) || 1,
      valid_from: toIsoStart(form.valid_from),
      valid_until: toIsoEnd(form.valid_until),
    };

    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, payload);
      } else {
        await createCoupon(payload);
      }
      closeForm();
      await load();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Could not save this coupon.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(coupon: Coupon) {
    try {
      await updateCoupon(coupon.id, { is_active: !coupon.is_active });
      await load();
    } catch {
      setError("Could not update coupon.");
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    try {
      await deleteCoupon(coupon.id);
      await load();
    } catch {
      setError("Could not delete coupon.");
    }
  }

  function discountLabel(coupon: Coupon): string {
    return coupon.discount_type === "percentage"
      ? `${coupon.value}%${coupon.max_discount_amount ? ` (max ₹${coupon.max_discount_amount})` : ""}`
      : `₹${coupon.value}`;
  }

  function isExpired(coupon: Coupon): boolean {
    return Boolean(coupon.valid_until && new Date(coupon.valid_until) < new Date());
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Coupons
          </h1>
          <p className="mt-2 font-body text-sm text-text-secondary">
            {count} discount code{count !== 1 ? "s" : ""}.
          </p>
        </div>
        <Button variant="primary" className="flex items-center gap-2" onClick={openCreateForm}>
          <Plus size={18} />
          Add Coupon
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-lg border border-border bg-surface p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-medium text-text-primary">
              {editingCoupon ? `Edit ${editingCoupon.code}` : "New Coupon"}
            </h2>
            <button type="button" onClick={closeForm} aria-label="Close" className="text-text-secondary hover:text-text-primary">
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Code"
              name="code"
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
            <Input
              label="Description"
              name="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />

            <div className="flex flex-col gap-2">
              <label className="font-body text-sm font-medium text-text-secondary">Discount type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as DiscountType }))}
                className="w-full rounded-md border border-border bg-surface px-4 py-3 font-body text-base text-text-primary focus:border-accent-primary focus:outline-none"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <Input
              label={form.discount_type === "percentage" ? "Value (%)" : "Value (₹)"}
              name="value"
              type="number"
              min={0}
              required
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            />

            {form.discount_type === "percentage" && (
              <Input
                label="Max discount amount (₹, optional)"
                name="max_discount_amount"
                type="number"
                min={0}
                value={form.max_discount_amount}
                onChange={(e) => setForm((f) => ({ ...f, max_discount_amount: e.target.value }))}
              />
            )}
            <Input
              label="Minimum order value (₹)"
              name="min_order_value"
              type="number"
              min={0}
              value={form.min_order_value}
              onChange={(e) => setForm((f) => ({ ...f, min_order_value: e.target.value }))}
            />

            <Input
              label="Total usage limit (optional)"
              name="usage_limit"
              type="number"
              min={1}
              value={form.usage_limit}
              onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
            />
            <Input
              label="Usage limit per user"
              name="usage_limit_per_user"
              type="number"
              min={1}
              value={form.usage_limit_per_user}
              onChange={(e) => setForm((f) => ({ ...f, usage_limit_per_user: e.target.value }))}
            />

            <Input
              label="Valid from"
              name="valid_from"
              type="date"
              value={form.valid_from}
              onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
            />
            <Input
              label="Valid until (optional)"
              name="valid_until"
              type="date"
              value={form.valid_until}
              onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
            />
          </div>

          {formError && <p className="mt-3 font-body text-sm text-accent-warm">{formError}</p>}

          <div className="mt-4 flex gap-3">
            <Button type="submit" variant="primary" disabled={saving} className="!px-5 !py-2.5 text-sm disabled:opacity-60">
              {saving ? "Saving..." : editingCoupon ? "Save Changes" : "Create Coupon"}
            </Button>
            <button type="button" onClick={closeForm} className="font-body text-sm text-text-secondary hover:text-text-primary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 font-body text-sm text-accent-warm">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Code</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Discount</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Min Order</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Usage</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Status</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons?.map((coupon) => {
              const expired = isExpired(coupon);
              return (
                <tr key={coupon.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-body text-sm font-semibold text-text-primary">{coupon.code}</p>
                    {coupon.description && (
                      <p className="font-body text-xs text-text-secondary">{coupon.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-secondary">{discountLabel(coupon)}</td>
                  <td className="px-4 py-3 font-body text-sm text-text-secondary">
                    {coupon.min_order_value > 0 ? `₹${coupon.min_order_value}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-secondary">
                    {coupon.used_count}
                    {coupon.usage_limit != null ? ` / ${coupon.usage_limit}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-pill px-2.5 py-1 font-body text-xs capitalize ${
                        expired || !coupon.is_active
                          ? "bg-accent-warm/20 text-accent-warm"
                          : "bg-success/20 text-success"
                      }`}
                    >
                      {expired ? "Expired" : coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 font-body text-sm">
                      <button onClick={() => openEditForm(coupon)} className="text-accent-primary hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleToggleActive(coupon)} className="text-text-secondary hover:text-text-primary">
                        {coupon.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => handleDelete(coupon)} className="text-accent-warm hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {coupons && coupons.length === 0 && (
          <p className="px-4 py-8 text-center font-body text-sm text-text-secondary">
            No coupons yet.
          </p>
        )}
      </div>
    </div>
  );
}
