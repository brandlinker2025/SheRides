type AvatarProps = {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
  initials?: string;
};

export function Avatar({ src, alt = "", size = 40, className = "", initials }: AvatarProps) {
  if (!src && initials) {
    return (
      <div
        className={`rounded-full bg-secondary-container text-on-surface flex items-center justify-center font-label-lg overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
