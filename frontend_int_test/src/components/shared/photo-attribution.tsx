import attributionData from "@/data/unsplashPoiAttribution.json";

type Attribution = {
  photographerName: string;
  photographerProfileUrl: string;
  photoPageUrl: string;
  imageUrl: string;
};

const attributionByPoi: Record<string, Attribution> = attributionData;

export function PhotoAttribution({
  poiId,
  imageUrl,
}: {
  poiId: string;
  imageUrl: string;
}) {
  const attribution = attributionByPoi[poiId];
  if (!attribution || attribution.imageUrl !== imageUrl) return null;

  const profileUrl = new URL(attribution.photographerProfileUrl);
  profileUrl.searchParams.set("utm_source", "viator");
  profileUrl.searchParams.set("utm_medium", "referral");
  const photoUrl = new URL(attribution.photoPageUrl);
  photoUrl.searchParams.set("utm_source", "viator");
  photoUrl.searchParams.set("utm_medium", "referral");

  return (
    <p className="text-xs text-muted-foreground">
      Photo by{" "}
      <a className="underline underline-offset-2 hover:text-foreground" href={profileUrl.toString()} target="_blank" rel="noreferrer">
        {attribution.photographerName}
      </a>{" "}
      on <a className="underline underline-offset-2 hover:text-foreground" href={photoUrl.toString()} target="_blank" rel="noreferrer">Unsplash</a>
    </p>
  );
}
