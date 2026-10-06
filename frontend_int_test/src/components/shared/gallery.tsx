import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoAttribution } from "./photo-attribution";

export function Gallery({
  images,
  alt,
  poiId,
  className,
}: {
  images: string[];
  alt: string;
  poiId?: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const hasImages = images.length > 0;
  const canNavigate = images.length > 1;
  const go = (delta: number) => {
    if (canNavigate) setIndex((i) => (i + delta + images.length) % images.length);
  };

  if (!hasImages) {
    return (
      <div
        className={cn(
          "grid aspect-[16/10] place-items-center rounded-3xl bg-muted text-sm text-muted-foreground",
          className,
        )}
      >
        No images available
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative overflow-hidden rounded-3xl bg-muted">
        <img
          src={images[index]}
          alt={`${alt} — image ${index + 1}`}
          className="aspect-[16/10] w-full object-cover"
        />
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous image"
          disabled={!canNavigate}
          className="glass-strong transition-premium absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full shadow-float hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next image"
          disabled={!canNavigate}
          className="glass-strong transition-premium absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full shadow-float hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="glass-strong absolute bottom-4 right-4 rounded-full px-3 py-1 text-xs font-semibold">
          {index + 1} / {images.length}
        </span>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              "transition-premium h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2",
              i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
            )}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {poiId && <PhotoAttribution poiId={poiId} imageUrl={images[index] ?? ""} />}
    </div>
  );
}
