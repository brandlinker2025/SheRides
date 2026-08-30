"use client";

export type PandaMood = "idle" | "peek" | "hide" | "peek-password" | "sad" | "happy";

export function InteractivePanda({ mood, admin = false }: { mood: PandaMood; admin?: boolean }) {
  const hiding = mood === "hide";
  const peeking = mood === "peek" || mood === "peek-password";
  const sad = mood === "sad";
  const happy = mood === "happy";

  return (
    <div className="relative mx-auto h-[330px] w-[330px] select-none" aria-hidden="true">
      <div className={`absolute inset-5 rounded-full bg-accent-magenta/10 blur-3xl transition-all duration-500 ${sad ? "scale-90" : happy ? "scale-110" : "scale-100"}`} />
      <div className={`absolute inset-x-8 bottom-2 h-8 rounded-[50%] bg-black/20 blur-md transition-transform duration-500 ${happy ? "scale-110" : ""}`} />
      <div className={`absolute left-1/2 top-7 h-64 w-60 -translate-x-1/2 transition-all duration-500 ${peeking ? "-translate-y-1 rotate-1" : ""} ${sad ? "translate-y-3" : ""} ${happy ? "-translate-y-4" : ""}`}>
        <div className="absolute left-3 top-2 h-20 w-20 rounded-full bg-[#17191d]" />
        <div className="absolute right-3 top-2 h-20 w-20 rounded-full bg-[#17191d]" />
        <div className="absolute left-1/2 top-8 h-48 w-52 -translate-x-1/2 rounded-[48%] bg-[#f7f3ec] shadow-xl">
          <div className="absolute left-[35px] top-[58px] h-16 w-12 -rotate-[24deg] rounded-[50%] bg-[#22252a]" />
          <div className="absolute right-[35px] top-[58px] h-16 w-12 rotate-[24deg] rounded-[50%] bg-[#22252a]" />
          <div className="absolute left-[50px] top-[78px] h-5 w-4 rounded-full bg-white">
            <div className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black transition-transform ${peeking ? "translate-x-1" : ""}`} />
          </div>
          <div className="absolute right-[50px] top-[78px] h-5 w-4 rounded-full bg-white">
            <div className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black transition-transform ${peeking ? "translate-x-1" : ""}`} />
          </div>
          <div className="absolute left-1/2 top-[116px] h-5 w-7 -translate-x-1/2 rounded-[55%] bg-[#17191d]" />
          <div className={`absolute left-1/2 top-[139px] -translate-x-1/2 border-[#272a30] transition-all ${sad ? "h-7 w-10 rounded-t-full border-t-[3px]" : "h-5 w-12 rounded-b-full border-b-[3px]"}`} />
          {sad && <><span className="absolute left-[49px] top-[101px] h-9 w-2 rounded-full bg-sky-300/80 animate-pulse" /><span className="absolute right-[49px] top-[101px] h-9 w-2 rounded-full bg-sky-300/80 animate-pulse" /></>}
        </div>
        <div className="absolute left-1/2 top-[185px] h-36 w-40 -translate-x-1/2 rounded-[46%] bg-[#242a35]" />
        {hiding && <><div className="absolute left-[45px] top-[84px] z-20 h-28 w-12 -rotate-[25deg] rounded-full bg-[#17191d] transition-all duration-300" /><div className="absolute right-[45px] top-[84px] z-20 h-28 w-12 rotate-[25deg] rounded-full bg-[#17191d] transition-all duration-300" /></>}
        {mood === "peek-password" && <div className="absolute left-[45px] top-[84px] z-20 h-28 w-12 -rotate-[25deg] rounded-full bg-[#17191d]" />}
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-surface-border bg-surface-container-lowest/90 px-4 py-2 text-center text-xs text-secondary shadow-sm backdrop-blur">
        {sad ? "Oh no — please try again" : happy ? "Welcome to SheRides!" : hiding ? "I promise I’m not looking 🙈" : peeking ? "Just checking in…" : admin ? "Admin guardian on duty" : "Your SheRides buddy"}
      </div>
    </div>
  );
}
