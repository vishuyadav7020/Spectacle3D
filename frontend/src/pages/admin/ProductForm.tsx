import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { VariantManager, type StagedVariant } from "../../components/admin/VariantManager";
import {
  type Product,
  type ProductInput,
  PRINT_TECHNOLOGIES,
  PRODUCT_STATUSES,
  addVariant,
  createProduct,
  getProduct,
  updateProduct,
  uploadProductImage,
} from "../../lib/products";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const FORM_ID = "product-form";

const EMPTY_FORM: ProductInput = {
  name: "",
  description: "",
  category: "",
  base_price: 0,
  print_technology: "FDM",
  material: "",
  tags: [],
  images: [],
  available_colors: [],
  dimensions: null,
  weight_grams: null,
  scale: "",
  is_made_to_order: true,
  discount_price: null,
  currency: "INR",
  sku: "",
  stock_quantity: 0,
  status: "draft",
};

const EMPTY_DIMENSIONS = { length_mm: "", width_mm: "", height_mm: "" };

function toCommaList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildSnapshot(
  f: ProductInput,
  tags: string,
  colors: string,
  images: string,
  dims: typeof EMPTY_DIMENSIONS,
): string {
  return JSON.stringify({ f, tags, colors, images, dims });
}

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM);
  const [tagsText, setTagsText] = useState("");
  const [colorsText, setColorsText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState(EMPTY_DIMENSIONS);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);
  const [stagedVariants, setStagedVariants] = useState<StagedVariant[]>([]);

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((p) => {
        const dims = p.dimensions
          ? {
              length_mm: String(p.dimensions.length_mm),
              width_mm: String(p.dimensions.width_mm),
              height_mm: String(p.dimensions.height_mm),
            }
          : EMPTY_DIMENSIONS;
        const tags = p.tags.join(", ");
        const colors = p.available_colors.join(", ");

        setProduct(p);
        setForm(p);
        setTagsText(tags);
        setColorsText(colors);
        setImages(p.images);
        setDimensions(dims);
        setInitialSnapshot(buildSnapshot(p, tags, colors, p.images.join(","), dims));
      })
      .catch(() => setError("Could not load product."))
      .finally(() => setLoading(false));
  }, [id]);

  // Only meaningful in edit mode — a fresh "New Product" form is always
  // considered ready to submit.
  const isDirty =
    !isEdit ||
    initialSnapshot === null ||
    buildSnapshot(form, tagsText, colorsText, images.join(","), dimensions) !== initialSnapshot;

  async function handleImagesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setImageError(null);

    const selected = Array.from(files);
    for (const file of selected) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setImageError(`"${file.name}" isn't a supported image type (JPEG, PNG, WEBP, GIF).`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setImageError(`"${file.name}" is larger than 5MB.`);
        continue;
      }

      setUploading(true);
      try {
        const url = await uploadProductImage(file);
        setImages((prev) => [...prev, url]);
      } catch {
        setImageError(`Could not upload "${file.name}".`);
      } finally {
        setUploading(false);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveImage(url: string) {
    setImages((prev) => prev.filter((img) => img !== url));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const hasDimensions =
      dimensions.length_mm && dimensions.width_mm && dimensions.height_mm;

    const payload: ProductInput = {
      ...form,
      // The backend accepts null for these optional fields but not "" (blank
      // strings aren't allowed on CharFields without allow_blank=True) — send
      // null for anything left empty rather than an empty string.
      material: form.material || null,
      scale: form.scale || null,
      sku: form.sku || null,
      tags: toCommaList(tagsText),
      available_colors: toCommaList(colorsText),
      images,
      dimensions: hasDimensions
        ? {
            length_mm: Number(dimensions.length_mm),
            width_mm: Number(dimensions.width_mm),
            height_mm: Number(dimensions.height_mm),
          }
        : null,
    };

    try {
      if (isEdit && id) {
        const updated = await updateProduct(id, payload);
        setProduct(updated);
        setInitialSnapshot(buildSnapshot(form, tagsText, colorsText, images.join(","), dimensions));
      } else {
        const created = await createProduct(payload);
        // Variants can only attach to a saved product (the endpoint needs a
        // real product id), so anything staged during creation gets added
        // now, right after the product itself exists.
        for (const { tempId: _tempId, ...variantPayload } of stagedVariants) {
          await addVariant(created.id, variantPayload);
        }
        navigate(`/admin/products/${created.id}`, { replace: true });
        return;
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, unknown>;
        const firstError = Object.values(data).flat().find(Boolean);
        setError(String(firstError ?? "Could not save product."));
      } else {
        setError("Could not save product.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="font-body text-text-secondary">Loading...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-text-primary">
        {isEdit ? `Edit: ${product?.name}` : "New Product"}
      </h1>

      <form id={FORM_ID} onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <Input
          label="Name"
          name="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <div className="flex flex-col gap-2">
          <label className="font-body text-sm font-medium text-text-secondary">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            required
            className="rounded-md border border-border bg-surface px-4 py-3 font-body text-base text-text-primary focus:border-accent-primary focus:outline-none"
          />
        </div>

        <Input
          label="Category"
          name="category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="Miniatures, Home Decor, Cosplay Props..."
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-medium text-text-secondary">
              Print technology
            </label>
            <select
              value={form.print_technology}
              onChange={(e) =>
                setForm({
                  ...form,
                  print_technology: e.target.value as Product["print_technology"],
                })
              }
              className="rounded-md border border-border bg-surface px-4 py-3 font-body text-base text-text-primary focus:border-accent-primary focus:outline-none"
            >
              {PRINT_TECHNOLOGIES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Material"
            name="material"
            value={form.material ?? ""}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            placeholder="PLA, ABS, Resin..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Base price (₹)"
            name="base_price"
            type="number"
            min={0}
            value={form.base_price === 0 ? "" : form.base_price}
            onChange={(e) =>
              setForm({
                ...form,
                base_price: e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
            required
          />
          <Input
            label="Discount price (optional)"
            name="discount_price"
            type="number"
            min={0}
            value={form.discount_price ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                discount_price: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Stock quantity"
            name="stock_quantity"
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
          <Input
            label="SKU (optional)"
            name="sku"
            value={form.sku ?? ""}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
        </div>

        <Input
          label="Tags (comma separated)"
          name="tags"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="dragon, fantasy, tabletop"
        />
        <Input
          label="Available colors (comma separated)"
          name="available_colors"
          value={colorsText}
          onChange={(e) => setColorsText(e.target.value)}
          placeholder="red, black, gold"
        />

        <div className="flex flex-col gap-2">
          <label className="font-body text-sm font-medium text-text-secondary">
            Images
          </label>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((url, idx) => (
                <div
                  key={url}
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2"
                >
                  <img src={url} alt={`Product ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-bg/80 px-1 py-0.5 text-center font-body text-[10px] text-text-secondary">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    aria-label={`Remove image ${idx + 1}`}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-bg/80 text-text-primary opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            multiple
            onChange={(e) => handleImagesSelected(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-fit items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 font-body text-sm text-text-secondary transition-colors hover:border-accent-primary/60 hover:text-text-primary disabled:opacity-60"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            {uploading ? "Uploading..." : "Upload images from your computer"}
          </button>
          <p className="font-body text-xs text-text-secondary">
            JPEG, PNG, WEBP, or GIF — 5MB max. The first image is used as the primary photo.
          </p>

          {imageError && (
            <p className="font-body text-sm text-accent-warm">{imageError}</p>
          )}
        </div>

        <div>
          <label className="font-body text-sm font-medium text-text-secondary">
            Dimensions (mm, optional)
          </label>
          <div className="mt-2 grid grid-cols-3 gap-4">
            <Input
              label="Length"
              name="length_mm"
              type="number"
              min={0}
              value={dimensions.length_mm}
              onChange={(e) => setDimensions({ ...dimensions, length_mm: e.target.value })}
            />
            <Input
              label="Width"
              name="width_mm"
              type="number"
              min={0}
              value={dimensions.width_mm}
              onChange={(e) => setDimensions({ ...dimensions, width_mm: e.target.value })}
            />
            <Input
              label="Height"
              name="height_mm"
              type="number"
              min={0}
              value={dimensions.height_mm}
              onChange={(e) => setDimensions({ ...dimensions, height_mm: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Weight (grams, optional)"
            name="weight_grams"
            type="number"
            min={0}
            value={form.weight_grams ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                weight_grams: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
          <Input
            label="Scale (optional)"
            name="scale"
            value={form.scale ?? ""}
            onChange={(e) => setForm({ ...form, scale: e.target.value })}
            placeholder="1:10"
          />
        </div>

        <label className="flex items-center gap-2 font-body text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={form.is_made_to_order}
            onChange={(e) => setForm({ ...form, is_made_to_order: e.target.checked })}
          />
          Made to order (printed after purchase, not shipped from stock)
        </label>

        <div className="flex flex-col gap-2">
          <label className="font-body text-sm font-medium text-text-secondary">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as Product["status"] })
            }
            className="rounded-md border border-border bg-surface px-4 py-3 font-body text-base capitalize text-text-primary focus:border-accent-primary focus:outline-none"
          >
            {PRODUCT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="font-body text-sm text-accent-warm">{error}</p>
        )}
      </form>

      {isEdit && id && product ? (
        // key={id} forces a fresh instance when switching from the staged
        // (create) VariantManager to this one — otherwise React reuses the
        // same component instance and its internal useState(initialVariants)
        // never re-reads the new `variants` prop, showing stale/empty data.
        <VariantManager key={id} productId={id} variants={product.variants} />
      ) : (
        <VariantManager
          key="new"
          variants={[]}
          stagedVariants={stagedVariants}
          onStagedChange={setStagedVariants}
        />
      )}

      <div className="mt-8 flex gap-3">
        <Button type="submit" form={FORM_ID} variant="primary" disabled={saving || !isDirty}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/admin/products")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
