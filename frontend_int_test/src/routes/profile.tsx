import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ImagePlus, MapPin, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useAsync } from "@/hooks/use-async";
import { getMediaById, uploadProfilePicture } from "@/services/media";
import { getUserProfile, type FirestoreTimestamp, updateUserBio } from "@/services/user";
import { getMySaves } from "@/services/saves";
import { getNearbyPlaces } from "@/services/places";
import type { Place } from "@/data/mock";
import { EmptyState, GridSkeleton } from "@/components/shared/primitives";
import { StarRating } from "@/components/shared/star-rating";
import { PhotoAttribution } from "@/components/shared/photo-attribution";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Your profile — VIATOR" }] }),
  component: Profile,
});

function formatJoinedAt(timestamp: FirestoreTimestamp) {
  const seconds = timestamp.seconds ?? timestamp._seconds;
  return seconds ? new Date(seconds * 1000).toLocaleDateString() : "Not available";
}

function Profile() {
  const navigate = useNavigate();
  const auth = useAuth();
  const profile = useAsync(
    () => (auth.user ? getUserProfile() : Promise.reject(new Error("Please sign in to view your profile."))),
    [auth.loading, auth.user?.uid],
  );
  const media = useAsync(
    () => (profile.data?.profilePic ? getMediaById(profile.data.profilePic) : Promise.resolve(null)),
    [profile.data?.profilePic],
  );
  const savedPlaces = useAsync(async () => {
    if (!auth.user) return [];
    const saves = await getMySaves();
    const poiIds = [...new Set(saves.map((save) => save.poiId))];
    if (!poiIds.length) return [];
    const places = await getNearbyPlaces();
    const placesById = new Map(places.map((place) => [place.id, place]));
    return poiIds.map((poiId) => placesById.get(poiId)).filter((place): place is Place => Boolean(place));
  }, [auth.loading, auth.user?.uid]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bio, setBio] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (!auth.loading && !auth.user) navigate({ to: "/login" });
  }, [auth.loading, auth.user, navigate]);

  useEffect(() => {
    if (profile.data) {
      setBio(profile.data.bio ?? "");
    }
  }, [profile.data]);

  if (auth.loading || profile.loading) return <AppShell><p className="text-sm text-muted-foreground">Loading profile…</p></AppShell>;
  if (profile.error || !profile.data) return <AppShell><p className="text-sm text-destructive">{profile.error?.message || "Unable to load your profile."}</p></AppShell>;

  const user = profile.data;
  const imageUrl = uploadedImageUrl || media.data?.data.url;
  const location = user.location ? `${user.location.latitude.toFixed(4)}, ${user.location.longitude.toFixed(4)}` : "Location not set";
  const stats = [["Guide level", user.guideLevel], ["Places rated", user.placesRated], ["Places visited", user.placesBeenTo.length], ["Followers", user.followers.length], ["Following", user.following.length], ["Role", user.role]] as const;

  async function handleProfilePicture(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const uploadedMedia = await uploadProfilePicture(file);
      const resolvedMedia = await getMediaById(uploadedMedia.id);
      setUploadedImageUrl(resolvedMedia.data.url);
      toast.success("Profile picture updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload profile picture.");
    } finally {
      setUploading(false);
    }
  }

  async function saveBio() {
    const nextBio = bioDraft.trim();
    if (nextBio.length > 500) {
      toast.error("Bio must not exceed 500 characters.");
      return;
    }

    setSavingBio(true);
    try {
      const updated = await updateUserBio(nextBio);
      setBio(updated.bio);
      setEditingBio(false);
      toast.success("Bio updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update bio.");
    } finally {
      setSavingBio(false);
    }
  }

  return <AppShell>
    <header className="float-card overflow-hidden">
      <div className="h-32 bg-primary" />
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {imageUrl ? <img src={imageUrl} alt={`${user.name}'s profile`} className="-mt-16 h-24 w-24 shrink-0 rounded-3xl border-4 border-card object-cover" /> : <div className="-mt-16 grid h-24 w-24 shrink-0 place-items-center rounded-3xl border-4 border-card bg-muted"><UserRound className="h-10 w-10 text-muted-foreground" /></div>}
          <div className="min-w-0"><h1 className="truncate text-2xl">{user.name || "Profile"}</h1><p className="mt-2 text-sm capitalize">{user.role.replace("_", " ")}</p><p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {location} · Joined {formatJoinedAt(user.joinedAt)}</p>
            <div className="mt-3 max-w-xl">
              {editingBio ? <><Textarea value={bioDraft} onChange={(event) => setBioDraft(event.target.value)} maxLength={500} aria-label="Bio" /><div className="mt-2 flex gap-2"><Button size="sm" className="rounded-xl" disabled={savingBio} onClick={() => void saveBio()}>{savingBio ? "Saving…" : "Save"}</Button><Button size="sm" variant="outline" className="rounded-xl" disabled={savingBio} onClick={() => { setBioDraft(bio); setEditingBio(false); }}>Cancel</Button></div></> : <div><p className="text-sm">{bio || "No bio yet."}</p><Button size="sm" variant="ghost" className="mt-1 rounded-xl px-2" onClick={() => { setBioDraft(bio); setEditingBio(true); }}>Edit Bio</Button></div>}
            </div>
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-xl" disabled={uploading}><label className="cursor-pointer"><ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload picture"}<input className="sr-only" type="file" accept="image/*" onChange={(event) => void handleProfilePicture(event.target.files?.[0])} disabled={uploading} /></label></Button>
      </div>
    </header>
    <section className="float-card mt-6 grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-6">{stats.map(([label, value]) => <div key={label}><p className="text-xl font-bold capitalize">{typeof value === "number" ? value.toLocaleString() : value.replace("_", " ")}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</section>
    <section className="float-card mt-6 p-6">
      <h2 className="text-lg font-bold">Saved places</h2>
      {savedPlaces.loading ? (
        <div className="mt-4"><GridSkeleton count={3} /></div>
      ) : savedPlaces.error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {savedPlaces.error.message || "Unable to load your saved places."}
        </p>
      ) : savedPlaces.data?.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedPlaces.data.map((place) => <SavedPlaceCard key={place.id} place={place} />)}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No saved places yet"
          description="Save a place to find it here later."
          className="mt-4"
        />
      )}
    </section>
  </AppShell>;
}

function SavedPlaceCard({ place }: { place: Place }) {
  return (
    <article className="float-card transition-premium group overflow-hidden hover:-translate-y-1 hover:shadow-lift">
      <Link to="/place/$id" params={{ id: place.id }} className="block">
      {place.image && (
        <div className="h-40 overflow-hidden">
          <img src={place.image} alt={place.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        </div>
      )}
      <div className="space-y-2 p-4">
        <h3 className="truncate text-base font-bold">{place.name}</h3>
        {place.category && <p className="text-xs text-muted-foreground">{place.category}</p>}
        {place.reviewCount > 0 && <StarRating value={place.rating} count={place.reviewCount} />}
      </div>
      </Link>
      {place.image && <div className="px-4 pb-4"><PhotoAttribution poiId={place.id} imageUrl={place.image} /></div>}
    </article>
  );
}
