import { bikeBrandNames, bikeBrands, type BikeBrand } from "@/lib/bikes";

export function BikeSelect({
  brand,
  model,
  onBrand,
  onModel,
}: {
  brand: string;
  model: string;
  onBrand: (value: string) => void;
  onModel: (value: string) => void;
}) {
  const models = brand && brand in bikeBrands ? bikeBrands[brand as BikeBrand] : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <select
        value={brand}
        onChange={(e) => {
          onBrand(e.target.value);
          onModel("");
        }}
        className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta"
      >
        <option value="">Bike brand</option>
        {bikeBrandNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <select
        value={model}
        disabled={!brand}
        onChange={(e) => onModel(e.target.value)}
        className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta disabled:opacity-50"
      >
        <option value="">Bike model</option>
        {models.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
