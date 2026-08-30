export function HelmetMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 28c0-10.5 8.1-19 19-19 8.3 0 15.4 5.1 18 12.3"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 29.5h35.2c1.6 0 2.8 1.5 2.5 3.1l-1.4 7.2A3 3 0 0 1 39.9 42H10.4a3 3 0 0 1-2.9-2.3L6 32.6c-.4-1.6.8-3.1 2.5-3.1Z"
        fill="currentColor"
      />
      <path d="M14 29.5V22.8a13 13 0 0 1 13-13" stroke="#1a0f14" strokeWidth="2.2" />
      <path d="M24 33.5h16.5" stroke="#1a0f14" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="13.2" cy="35.6" r="1.6" fill="#1a0f14" />
    </svg>
  );
}

export function GoogleMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.9 2.4 2.7 6.6 2.7 11.7S6.9 21 12 21c6.9 0 8.5-4.8 8.5-7.3 0-.5 0-.8-.1-1.1H12Z"
      />
      <path fill="#FBBC05" d="M3.9 7.4 7.1 9.8A6 6 0 0 1 12 5.7c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 8.2 2.4 4.9 4.5 3.9 7.4Z" />
      <path fill="#34A853" d="M12 21c2.5 0 4.6-.8 6.1-2.2l-2.8-2.2c-.8.5-1.8.9-3.3.9-3.9 0-5.3-2.6-5.5-3.9l-3.2 2.5C5 18.8 8.2 21 12 21Z" />
      <path fill="#4285F4" d="M20.5 13.7c0-.5 0-.8-.1-1.1H12v3.9h5.5c-.3 1.1-1 2.1-2.2 2.8l2.8 2.2c1.6-1.5 2.4-3.7 2.4-6.3Z" />
    </svg>
  );
}

export function FacebookMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="#1877F2">
      <path d="M24 12.1C24 5.5 18.6.1 12 .1S0 5.5 0 12.1c0 6 4.4 11 10.1 11.9v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.8v2.2h3.3l-.5 3.5h-2.8v8.4C19.6 23.1 24 18.1 24 12.1Z" />
    </svg>
  );
}

export function FacebookOutline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14.2 8.3h2.3V5h-2.3C11.8 5 10 6.9 10 9.3v1.4H8v3.3h2V21h3.4v-7h2.3l.5-3.3h-2.8V9.3c0-.6.4-1 1-1Z" />
    </svg>
  );
}

export function InstagramMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm9.2 1.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 8.2A3.8 3.8 0 1 1 12 15.8 3.8 3.8 0 0 1 12 8.2Zm0 2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z" />
    </svg>
  );
}

export function YouTubeMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M23 12.3s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.5 12 5.5 12 5.5s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9.1 1 12.3 1 12.3s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM9.8 15.5V9.1l6 3.2-6 3.2Z" />
    </svg>
  );
}

export function TikTokMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14.6 3c.4 2.4 1.8 4.1 4.1 4.4v2.4c-1.4 0-2.7-.4-3.9-1.2v6.7c0 3.4-2.7 6.2-6.2 6.2S2.4 18.7 2.4 15.3c0-3.4 2.8-6.2 6.2-6.2.4 0 .8 0 1.1.1v2.6c-.3-.1-.7-.2-1.1-.2-2 0-3.6 1.6-3.6 3.7s1.6 3.6 3.6 3.6 3.6-1.6 3.6-3.6V3h2.4Z" />
    </svg>
  );
}
