"use client";
import { RideMap } from "@/components/go/RideMap";
import "@/components/public-app/public-app.css";
export default function MapTest() {
  return <main className="public-app"><div className="public-panel"><div className="h-[340px]">
    <RideMap pickup={{ label: "Mogbazar", lat: 23.7495, lng: 90.4033 }} drop={{ label: "Yamaha Flagship Center", lat: 23.7643, lng: 90.3999 }} />
  </div></div></main>;
}
