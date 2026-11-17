type IconProps = {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
};

// Old Material Icons names mapped to their Material Symbols names, so the trimmed icon font covers them.
const ALIASES: Record<string, string> = {
  smartphone: "mobile",
  phone_iphone: "mobile",
  install_mobile: "mobile_arrow_down",
  expand_more: "keyboard_arrow_down",
  expand_less: "keyboard_arrow_up",
};

export function Icon({ name, filled = false, className = "", size }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        fontSize: size,
      }}
    >
      {ALIASES[name] ?? name}
    </span>
  );
}
