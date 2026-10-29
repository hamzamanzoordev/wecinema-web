import { Clock } from "lucide-react";
import { MediaRow } from "@/features/home/components/MediaRow";
import { VideoCard } from "@/features/videos/components/VideoCard";
import type { Video } from "@/types";

export function LatestRow({ videos }: { videos: Video[] }) {
  if (videos.length === 0) return null;
  return (
    <MediaRow
      title="Latest Videos"
      viewAllHref="/explore"
      icon={<Clock size={18} color="var(--color-accent-primary)" aria-hidden />}
    >
      {videos.map((v) => (
        <VideoCard key={v._id} video={v} />
      ))}
    </MediaRow>
  );
}
