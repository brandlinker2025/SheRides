"use client";

import Link from "next/link";
import { Icon } from "./Icon";

type BackLinkProps = {
  href: string;
  label?: string;
  className?: string;
};

export function BackLink({ href, label = "Back", className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 font-label-lg text-accent-magenta hover:underline ${className}`}
    >
      <Icon name="arrow_back" size={18} />
      {label}
    </Link>
  );
}

type BackButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

export function BackButton({ onClick, label = "Back", className = "" }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-label-lg text-accent-magenta hover:underline ${className}`}
    >
      <Icon name="arrow_back" size={18} />
      {label}
    </button>
  );
}
