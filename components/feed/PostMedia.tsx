import { isVideoUrl } from "@/lib/media";

type PostMediaProps = {
  src: string;
  className?: string;
};

export function PostMedia({ src, className = "w-full h-full object-cover" }: PostMediaProps) {
  if (isVideoUrl(src)) {
    return <video src={src} className={className} controls playsInline preload="metadata" />;
  }
  return <img src={src} alt="" className={className} />;
}
