import { type FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
  type Address,
  type AddressInput,
  addAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from "../../lib/addresses";

const EMPTY_FORM: AddressInput = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  is_default: false,
};

export function AddressBook() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const data = await listAddresses();
      setAddresses(data);
    } catch {
      setError("Could not load addresses.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEditForm(address: Address) {
    setEditingId(address.id);
    setForm({
      label: address.label,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      is_default: address.is_default,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await updateAddress(editingId, form);
      } else {
        await addAddress(form);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, unknown>;
        setError(String(data.error ?? "Could not save address."));
      } else {
        setError("Could not save address.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteAddress(id);
      await load();
    } catch {
      setError("Could not delete address.");
    }
  }

  async function handleSetDefault(id: string) {
    setError(null);
    try {
      await updateAddress(id, { is_default: true });
      await load();
    } catch {
      setError("Could not update address.");
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-border bg-surface p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium text-text-primary">
          Address book
        </h2>
        {!formOpen && (
          <Button variant="secondary" onClick={openAddForm}>
            Add Address
          </Button>
        )}
      </div>

      {error && (
        <p className="mt-4 font-body text-sm text-accent-warm">{error}</p>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-medium text-text-secondary">
              Label
            </label>
            <select
              value={form.label}
              onChange={(e) =>
                setForm({ ...form, label: e.target.value as Address["label"] })
              }
              className="rounded-md border border-border bg-surface px-4 py-3 font-body text-base text-text-primary focus:border-accent-primary focus:outline-none"
            >
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <Input
            label="Address line 1"
            name="line1"
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            required
          />
          <Input
            label="Address line 2 (optional)"
            name="line2"
            value={form.line2 ?? ""}
            onChange={(e) => setForm({ ...form, line2: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
            <Input
              label="State"
              name="state"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              required
            />
            <Input
              label="Pincode"
              name="pincode"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              required
            />
            <Input
              label="Country"
              name="country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              required
            />
          </div>

          <label className="flex items-center gap-2 font-body text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
            />
            Set as default address
          </label>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Address" : "Add Address"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!formOpen && addresses && addresses.length === 0 && (
        <p className="mt-4 font-body text-sm text-text-secondary">
          You haven't added any addresses yet.
        </p>
      )}

      {!formOpen && addresses && addresses.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-md border border-border bg-surface-2 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-body text-sm font-semibold text-text-primary">
                    {address.label}
                    {address.is_default && (
                      <span className="ml-2 rounded-pill bg-accent-primary/20 px-2 py-0.5 text-xs font-medium text-accent-primary">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="mt-1 font-body text-sm text-text-secondary">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                    {address.state} {address.pincode}, {address.country}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-4">
                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    className="font-body text-sm text-accent-primary hover:underline"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEditForm(address)}
                  className="font-body text-sm text-text-secondary hover:text-text-primary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  className="font-body text-sm text-accent-warm hover:underline"
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
