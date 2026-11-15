import { Logo } from "@/components/ui/Logo";

export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#1B1324]">
      <Logo variant="lockup" height={280} priority />
    </div>
  );
}
