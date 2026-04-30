import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

export default function DriverMap() {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      p => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}, { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return (
    <div className="space-y-3">
      <Card><CardContent className="p-4 text-center space-y-2">
        <Navigation className="h-8 w-8 mx-auto text-primary" />
        <p className="font-display text-[16px]">موقعي اللحظي</p>
        {pos ? (
          <>
            <p className="text-[12px] num text-foreground-tertiary" dir="ltr">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</p>
            <Button asChild size="sm" variant="outline">
              <a href={`https://maps.google.com/?q=${pos.lat},${pos.lng}`} target="_blank" rel="noreferrer">فتح في الخرائط</a>
            </Button>
          </>
        ) : <p className="text-[12px] text-foreground-tertiary">جارٍ تحديد الموقع…</p>}
      </CardContent></Card>
    </div>
  );
}
