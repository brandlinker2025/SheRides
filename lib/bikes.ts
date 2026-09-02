export const bikeBrands = {
  Yamaha: ["FZS V3", "R15 V4", "MT-15", "Saluto", "Fazer", "Ray ZR"],
  Honda: ["CB Hornet", "CB Shine", "CB Trigger", "XBlade", "Livo"],
  Suzuki: ["Gixxer", "Gixxer SF", "Hayabusa", "Intruder"],
  Bajaj: ["Pulsar NS160", "NS200", "RS200", "Dominar 400"],
  TVS: ["Apache RTR 160", "Apache RTR 200", "Ntorq"],
  Hero: ["Hunk", "Xtreme", "Passion Pro"],
  Lifan: [],
  Zinnan: [],
  Runner: [],
  KPT: [],
  Revo: [],
} as const;

export type BikeBrand = keyof typeof bikeBrands;

export const bikeBrandNames = Object.keys(bikeBrands) as BikeBrand[];

export function formatBike(brand?: string | null, model?: string | null, fallback?: string | null) {
  const label = [brand, model].filter(Boolean).join(" ");
  return label || fallback || "";
}
