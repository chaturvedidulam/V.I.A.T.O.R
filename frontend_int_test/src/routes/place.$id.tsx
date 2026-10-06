import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Bookmark, MapPin, Pencil, Route as RouteIcon, Star, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Gallery } from "@/components/shared/gallery";
import { StarRating } from "@/components/shared/star-rating";
import { EmptyState, ScoreBar, SectionHeader } from "@/components/shared/primitives";
import { GemBadge, VerifiedBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/use-async";
import { useAuth } from "@/hooks/use-auth";
import { getPlaceById } from "@/services/places";
import { createReview, deleteReview, getReviews, updateReview } from "@/services/reviews";
import { getMySaves, savePOI, unsavePOI } from "@/services/saves";

export const Route = createFileRoute("/place/$id")({
  head: () => ({
    meta: [
      { title: "Place details — VIATOR" },
      {
        name: "description",
        content: "Details and community information for places on VIATOR.",
      },
      { property: "og:title", content: "Place details — VIATOR" },
      { property: "og:description", content: "Details and community information for places." },
    ],
  }),
  component: PlaceDetails,
  notFoundComponent: PlaceNotFound,
});

function PlaceNotFound() {
  const { id } = Route.useParams();
  return (
    <AppShell>
      <EmptyState
        icon={MapPin}
        title="Place not found"
        description={`We couldn't find a place with the id "${id}". It may have been removed or merged.`}
      />
    </AppShell>
  );
}

function PlaceDetails() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [placeRefreshKey, setPlaceRefreshKey] = useState(0);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const place = useAsync(() => getPlaceById(id), [id, placeRefreshKey]);
  const reviews = useAsync(() => getReviews(id), [id, reviewRefreshKey]);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savesLoading, setSavesLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsSaved(false);
      setSavesLoading(false);
      setSaveError(null);
      return () => { active = false; };
    }

    setSavesLoading(true);
    setSaveError(null);
    void getMySaves()
      .then((saves) => {
        if (active) setIsSaved(saves.some((save) => save.poiId === id));
      })
      .catch((error: unknown) => {
        if (active) setSaveError(error instanceof Error ? error.message : "Unable to check saved places.");
      })
      .finally(() => {
        if (active) setSavesLoading(false);
      });

    return () => { active = false; };
  }, [id, user?.uid]);

  const handleToggleSave = async () => {
    if (!user || saveLoading || savesLoading) return;
    setSaveLoading(true);
    setSaveError(null);
    try {
      if (isSaved) {
        await unsavePOI(id);
        setIsSaved(false);
      } else {
        await savePOI(id);
        setIsSaved(true);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to update this saved place.");
    } finally {
      setSaveLoading(false);
    }
  };

  const refreshReviewData = () => {
    setReviewRefreshKey((key) => key + 1);
    setPlaceRefreshKey((key) => key + 1);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reviewText = text.trim();
    if (rating < 1 || rating > 5 || !reviewText) {
      setReviewError("Choose a rating from 1 to 5 and enter review text.");
      return;
    }
    setSaving(true);
    setReviewError(null);
    try {
      await createReview(id, rating, reviewText, []);
      setRating(0);
      setText("");
      refreshReviewData();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to submit your review.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (reviewId: string) => {
    const reviewText = editText.trim();
    if (editRating < 1 || editRating > 5 || !reviewText) {
      setReviewError("Choose a rating from 1 to 5 and enter review text.");
      return;
    }
    setSaving(true);
    setReviewError(null);
    try {
      await updateReview(reviewId, editRating, reviewText, []);
      setEditingId(null);
      refreshReviewData();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to update your review.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setReviewError(null);
    try {
      await deleteReview(deleteTarget);
      setDeleteTarget(null);
      refreshReviewData();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to delete this review.");
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  if (place.loading) {
    return (
      <AppShell>
        <Skeleton className="aspect-[16/10] w-full rounded-3xl" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (place.error) {
    return (
      <AppShell>
        <EmptyState
          icon={MapPin}
          title="Unable to load place"
          description={place.error.message || "Please try again later."}
        />
      </AppShell>
    );
  }

  if (!place.data) return <PlaceNotFound />;

  const p = place.data;
  const hasScores = Object.values(p.scores).some((score) => score > 0);

  return (
    <AppShell>
      <Gallery images={p.gallery} alt={p.name} poiId={p.id} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-12">
          <header>
            <div className="flex flex-wrap gap-2">
              {p.hiddenGem && <GemBadge />}
              {p.verified && <VerifiedBadge />}
              {p.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl">{p.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {p.city}, {p.country} · {p.category}
            </p>
            {p.reviewCount > 0 ? (
              <StarRating value={p.rating} count={p.reviewCount} size={16} className="mt-3" />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No ratings yet</p>
            )}
          </header>

          <section>
            <SectionHeader title="About this place" />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
          </section>

          {(p.hours || p.bestTime) && (
            <section>
              <SectionHeader title="Hours & timing" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {p.hours && (
                  <div className="float-card p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Opening hours
                    </p>
                    <p className="mt-2 text-sm font-semibold">{p.hours}</p>
                  </div>
                )}
                {p.bestTime && (
                  <div className="float-card p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Best time to visit
                    </p>
                    <p className="mt-2 text-sm font-semibold">{p.bestTime}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {p.history && (
            <section>
              <SectionHeader title="History" />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.history}</p>
            </section>
          )}

          <section>
            <SectionHeader
              title="Reviews"
              subtitle={`${p.reviewCount.toLocaleString()} ${p.reviewCount === 1 ? "review" : "reviews"}`}
            />
            <div className="mt-4">
              {p.reviewCount > 0 ? (
                <StarRating value={p.rating} count={p.reviewCount} size={16} />
              ) : (
                <p className="text-sm text-muted-foreground">No ratings yet</p>
              )}
            </div>

            {reviews.loading ? (
              <div className="mt-5 space-y-3" aria-label="Loading reviews">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : reviews.error ? (
              <p className="mt-5 text-sm text-destructive" role="alert">
                {reviews.error.message || "Unable to load reviews."}
              </p>
            ) : reviews.data?.length ? (
              <div className="mt-5 space-y-4">
                {reviews.data.map((review) => {
                  const ownReview = user?.uid === review.uid;
                  const isEditing = editingId === review.id;
                  return (
                    <article key={review.id} className="float-card space-y-3 p-5">
                      {isEditing ? (
                        <div className="space-y-3">
                          <RatingPicker value={editRating} onChange={setEditRating} label="Edit rating" />
                          <Textarea
                            value={editText}
                            onChange={(event) => setEditText(event.target.value)}
                            maxLength={2000}
                            aria-label="Edit review text"
                          />
                          <div className="flex gap-2">
                            <Button disabled={saving || editRating < 1 || !editText.trim()} onClick={() => void handleUpdate(review.id)}>
                              Save changes
                            </Button>
                            <Button variant="outline" disabled={saving} onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">Traveler</p>
                              <StarRating value={review.rating} size={14} />
                            </div>
                            {ownReview && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingId(review.id);
                                    setEditRating(review.rating);
                                    setEditText(review.text);
                                    setReviewError(null);
                                  }}
                                >
                                  <Pencil aria-hidden="true" /> Edit
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(review.id)}>
                                  <Trash2 aria-hidden="true" /> Delete
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{review.text}</p>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                There are no community reviews for this place yet.
              </p>
            )}

            <div className="mt-6 rounded-2xl border p-5">
              {user ? (
                <form className="space-y-4" onSubmit={(event) => void handleCreate(event)}>
                  <h3 className="font-semibold">Write a review</h3>
                  <RatingPicker value={rating} onChange={setRating} label="Your rating" />
                  <Textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Share your experience"
                    maxLength={2000}
                    aria-label="Review text"
                    required
                  />
                  <Button type="submit" disabled={saving || rating < 1 || !text.trim()}>
                    {saving ? "Submitting…" : "Submit review"}
                  </Button>
                </form>
              ) : (
                <div>
                  <h3 className="font-semibold">Write a review</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Sign in to share your experience.</p>
                  <Button asChild className="mt-3"><Link to="/login">Sign in</Link></Button>
                </div>
              )}
            </div>
            {reviewError && <p className="mt-3 text-sm text-destructive" role="alert">{reviewError}</p>}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="float-card space-y-5 p-6">
            <div className="flex gap-4 rounded-2xl bg-muted p-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Distance</p>
                <p className="text-lg font-bold">
                  {p.distanceKm > 0 ? `${p.distanceKm} km` : "Not available"}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Drive time</p>
                <p className="text-lg font-bold">
                  {p.etaMin > 0 ? `${p.etaMin} min` : "Not available"}
                </p>
              </div>
            </div>

            {hasScores && (
              <div className="space-y-3">
                <ScoreBar label="Experience" value={p.scores.experience} />
                <ScoreBar label="Community" value={p.scores.community} tone="success" />
                <ScoreBar label="Scenic" value={p.scores.scenic} tone="warning" />
              </div>
            )}

            <div className="space-y-2">
              {user ? (
                <Button className="w-full rounded-xl" variant={isSaved ? "secondary" : "outline"} onClick={() => void handleToggleSave()} disabled={savesLoading || saveLoading}>
                  <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                  {savesLoading ? "Checking saved places…" : saveLoading ? "Updating…" : isSaved ? "Saved" : "Save place"}
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link to="/login"><Bookmark className="h-4 w-4" /> Sign in to save</Link>
                </Button>
              )}
              {saveError && <p className="text-sm text-destructive" role="alert">{saveError}</p>}
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link to="/plan">
                  <RouteIcon className="h-4 w-4" /> Open route planner
                </Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={(event) => { event.preventDefault(); void handleDelete(); }}>
              Delete review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function RatingPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (rating: number) => void;
  label: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} ${score === 1 ? "star" : "stars"}`}
            onClick={() => onChange(score)}
            className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className={`h-6 w-6 ${score <= value ? "fill-warning text-warning" : "text-border"}`} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
