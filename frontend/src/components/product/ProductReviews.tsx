import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShieldCheck, Star } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import {
  type Review,
  type ReviewSort,
  createReview,
  deleteReview,
  listReviews,
  updateReview,
} from "../../lib/reviews";

const PAGE_SIZE = 10;
const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

interface ProductReviewsProps {
  productId: string;
  onReviewChange?: () => void;
}

export function ProductReviews({ productId, onReviewChange }: ProductReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setError(null);
    try {
      const data = await listReviews(productId, { sort, page, page_size: PAGE_SIZE });
      setReviews(data.results);
      setCount(data.count);
    } catch {
      setError("Could not load reviews.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, sort, page]);

  const myReview = reviews?.find((r) => r.user_id === user?.id);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  function openWriteForm() {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }
    setEditingId("new");
    setFormRating(5);
    setFormComment("");
    setFormError(null);
  }

  function openEditForm(review: Review) {
    setEditingId(review.id);
    setFormRating(review.rating);
    setFormComment(review.comment);
    setFormError(null);
  }

  function closeForm() {
    setEditingId(null);
  }

  async function handleSubmit() {
    if (!formComment.trim()) {
      setFormError("Please write a comment.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingId === "new") {
        await createReview(productId, { rating: formRating, comment: formComment.trim() });
      } else if (editingId) {
        await updateReview(productId, editingId, { rating: formRating, comment: formComment.trim() });
      }
      setEditingId(null);
      await load();
      onReviewChange?.();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Could not save your review.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(review: Review) {
    if (!confirm("Delete your review?")) return;
    try {
      await deleteReview(productId, review.id);
      await load();
      onReviewChange?.();
    } catch {
      setError("Could not delete review.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Reviews ({count})
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as ReviewSort);
              setPage(1);
            }}
            className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-text-primary focus:border-accent-primary focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {!myReview && editingId !== "new" && (
            <Button variant="secondary" className="!px-4 !py-2 text-sm" onClick={openWriteForm}>
              Write a Review
            </Button>
          )}
        </div>
      </div>

      {editingId && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-5">
          <p className="font-body text-sm font-medium text-text-primary">
            {editingId === "new" ? "Write a review" : "Edit your review"}
          </p>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1} star`}
                onClick={() => setFormRating(i + 1)}
                className="p-0.5"
              >
                <Star
                  size={22}
                  className={i < formRating ? "fill-rating text-rating" : "text-border"}
                />
              </button>
            ))}
          </div>
          <textarea
            value={formComment}
            onChange={(e) => setFormComment(e.target.value)}
            rows={3}
            placeholder="Share your experience with this product..."
            className="mt-3 w-full rounded-md border border-border bg-bg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent-primary focus:outline-none"
          />
          {formError && <p className="mt-2 font-body text-sm text-accent-warm">{formError}</p>}
          <div className="mt-3 flex gap-3">
            <Button
              variant="primary"
              className="!px-4 !py-2 text-sm disabled:opacity-60"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Saving..." : "Submit Review"}
            </Button>
            <button
              type="button"
              onClick={closeForm}
              className="font-body text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 font-body text-sm text-accent-warm">{error}</p>}

      <div className="mt-6 flex flex-col gap-5">
        {reviews && reviews.length === 0 && (
          <p className="font-body text-sm text-text-secondary">
            No reviews yet. Be the first to share your thoughts.
          </p>
        )}

        {reviews?.map((review) => (
          <div key={review.id} className="border-b border-border pb-5 last:border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < review.rating ? "fill-rating text-rating" : "text-border"}
                    />
                  ))}
                </div>
                <span className="font-body text-sm font-medium text-text-primary">
                  {review.user_name}
                </span>
                {review.is_verified_purchase && (
                  <span className="flex items-center gap-1 font-body text-xs text-success">
                    <ShieldCheck size={12} /> Verified Purchase
                  </span>
                )}
              </div>
              <span className="font-body text-xs text-text-secondary">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-2 font-body text-sm text-text-secondary">{review.comment}</p>
            {review.user_id === user?.id && (
              <div className="mt-2 flex gap-3 font-body text-xs">
                <button
                  onClick={() => openEditForm(review)}
                  className="text-accent-primary hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(review)}
                  className="text-accent-warm hover:underline"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {count > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-body text-sm text-text-primary">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
