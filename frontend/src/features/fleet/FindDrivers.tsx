/* Rapido-style "drivers near you": OpenStreetMap (free, no API key) with driver pins and a list sheet. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BadgeCheck, LocateFixed, Phone, RefreshCw, UserRound } from 'lucide-react';
import { Btn, Chip, Spinner } from '../../components/app/ui';
import { useT } from '../../i18n';
import { fleetService, fileUrl } from '../../services/api';
import { getPosition } from '../../lib/device';
import { VEHICLE_TYPES, vehicleKey } from '../../config/vehicles';
import { cn } from '../../lib/utils';
import { useFleet } from './FleetHome';

type NearbyDriver = {
  id: string; name: string; photoUrl?: string | null; vehicleTypes: string[]; registrationType: string;
  experienceYears: number | null; isAvailable: boolean; verified: boolean; phone: string | null;
  latitude: number; longitude: number; distanceKm: number;
};

const RADII = [10, 25, 50, 100];
const INDIA_CENTRE = { lat: 20.5937, lng: 78.9629 };

const driverIcon = (d: NearbyDriver, selected: boolean) => L.divIcon({
  className: '',
  iconSize: [44, 52],
  iconAnchor: [22, 50],
  html: `<div style="position:relative;width:44px;height:52px;transform:scale(${selected ? 1.2 : 1});transform-origin:bottom center;transition:transform .15s">
    <div style="width:44px;height:44px;border-radius:50%;background:${d.isAvailable ? '#0A1A33' : '#64748B'};border:3px solid ${d.verified ? '#E8650A' : '#fff'};box-shadow:0 4px 12px rgba(0,0,0,.35);display:grid;place-items:center">
      <svg width="24" height="24" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="#E8650A" stroke-width="12"/><path d="M14 46 Q50 34 86 46 L86 54 Q66 50 58 58 L56 88 L44 88 L42 58 Q34 50 14 54 Z" fill="#fff"/></svg>
    </div>
    <div style="position:absolute;left:50%;bottom:0;width:12px;height:12px;margin-left:-6px;background:${d.isAvailable ? '#0A1A33' : '#64748B'};transform:rotate(45deg);border-radius:2px"></div>
    ${d.isAvailable ? '<span style="position:absolute;right:0;top:0;width:12px;height:12px;border-radius:50%;background:#22C55E;border:2px solid #fff"></span>' : ''}
  </div>`,
});

const meIcon = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#2563EB;border:4px solid #fff;box-shadow:0 0 0 8px rgba(37,99,235,.2)"></div>',
});

export const FindDrivers = () => {
  const t = useT();
  const { data: owner } = useFleet();
  const [centre, setCentre] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [vehicleType, setVehicleType] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [selected, setSelected] = useState<string | null>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const circle = useRef<L.Circle | null>(null);

  const locate = () => {
    setLocating(true);
    getPosition()
      .then((p) => setCentre(p))
      .catch(() => setCentre(owner?.latitude && owner.longitude ? { lat: owner.latitude, lng: owner.longitude } : INDIA_CENTRE))
      .finally(() => setLocating(false));
  };
  useEffect(locate, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: drivers = [], isFetching, refetch } = useQuery<NearbyDriver[]>({
    queryKey: ['nearby', centre?.lat, centre?.lng, radiusKm, vehicleType],
    queryFn: () => fleetService.nearbyDrivers({ lat: centre!.lat, lng: centre!.lng, radiusKm, vehicleType: vehicleType || undefined }).then((r) => r.data.data),
    enabled: !!centre,
    refetchInterval: 60_000,
  });

  // Create the map once
  useEffect(() => {
    if (!mapEl.current || map.current) return;
    map.current = L.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView([INDIA_CENTRE.lat, INDIA_CENTRE.lng], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  // Recentre and draw the search radius
  useEffect(() => {
    if (!map.current || !centre) return;
    circle.current?.remove();
    circle.current = L.circle([centre.lat, centre.lng], { radius: radiusKm * 1000, color: '#E8650A', weight: 1.5, fillOpacity: 0.05 }).addTo(map.current);
    map.current.fitBounds(circle.current.getBounds(), { padding: [10, 10] });
  }, [centre, radiusKm]);

  // Pins
  useEffect(() => {
    if (!layer.current || !centre) return;
    layer.current.clearLayers();
    L.marker([centre.lat, centre.lng], { icon: meIcon, interactive: false }).addTo(layer.current);
    for (const d of drivers) {
      L.marker([d.latitude, d.longitude], { icon: driverIcon(d, d.id === selected) })
        .on('click', () => setSelected(d.id))
        .addTo(layer.current);
    }
  }, [drivers, selected, centre]);

  const sorted = useMemo(() => {
    if (!selected) return drivers;
    const s = drivers.find((d) => d.id === selected);
    return s ? [s, ...drivers.filter((d) => d.id !== selected)] : drivers;
  }, [drivers, selected]);

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Map */}
      <div className="relative h-[48dvh] min-h-[280px] w-full">
        <div ref={mapEl} className="absolute inset-0 z-0" />
        {locating && (
          <div className="absolute inset-0 z-[500] grid place-items-center bg-white/70 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-brand-navy"><LocateFixed className="h-5 w-5 animate-pulse text-brand-orange" /> {t('locating')}</p>
          </div>
        )}
        {/* Filters over the map */}
        <div className="absolute inset-x-0 top-0 z-[600] space-y-2 px-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Chip selected={!vehicleType} onClick={() => setVehicleType('')}>{t('all_vehicles')}</Chip>
            {VEHICLE_TYPES.map(({ code, key }) => (
              <Chip key={code} selected={vehicleType === code} onClick={() => setVehicleType(code)}>{t(key)}</Chip>
            ))}
          </div>
        </div>
        <div className="absolute bottom-10 right-3 z-[600] flex flex-col gap-2">
          <button aria-label="My location" onClick={locate} className="pressable grid h-11 w-11 place-items-center rounded-full bg-white text-brand-navy shadow-card"><LocateFixed className="h-5 w-5" /></button>
          <button aria-label="Refresh" onClick={() => refetch()} className="pressable grid h-11 w-11 place-items-center rounded-full bg-white text-brand-navy shadow-card"><RefreshCw className={cn('h-5 w-5', isFetching && 'animate-spin')} /></button>
        </div>
      </div>

      {/* Results sheet */}
      <section className="relative z-10 -mt-6 flex-1 rounded-t-[28px] bg-[#F3F5F9] pt-3 shadow-sheet">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
        <div className="flex items-center justify-between px-5">
          <div>
            <h1 className="text-[19px] font-bold text-brand-navy">{t('drivers_near_you')}</h1>
            <p className="text-[13px] text-slate-500">{drivers.length} · {t('search_radius', { d: radiusKm })}</p>
          </div>
          <div className="flex rounded-full bg-white p-1 shadow-card">
            {RADII.map((r) => (
              <button key={r} onClick={() => setRadiusKm(r)} className={cn('rounded-full px-2.5 py-1.5 text-[12px] font-bold', radiusKm === r ? 'bg-brand-navy text-white' : 'text-slate-500')}>{r}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 px-4 pb-6 pt-3">
          {!centre || (isFetching && drivers.length === 0) ? <Spinner className="py-10" /> : drivers.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center shadow-card">
              <UserRound className="mx-auto mb-2 h-10 w-10 text-slate-300" />
              <p className="text-[15px] font-semibold text-brand-navy">{t('no_drivers')}</p>
              {radiusKm < 100 && <Btn size="md" variant="outline" className="mt-3" onClick={() => setRadiusKm(RADII[RADII.indexOf(radiusKm) + 1])}>{t('search_radius', { d: RADII[RADII.indexOf(radiusKm) + 1] })}</Btn>}
            </div>
          ) : sorted.map((d) => (
            <DriverCard key={d.id} d={d} selected={d.id === selected} onSelect={() => {
              setSelected(d.id);
              map.current?.flyTo([d.latitude, d.longitude], Math.max(map.current.getZoom(), 13), { duration: 0.6 });
            }} />
          ))}
        </div>
      </section>
    </div>
  );
};

const DriverCard = ({ d, selected, onSelect }: { d: NearbyDriver; selected: boolean; onSelect: () => void }) => {
  const t = useT();
  return (
    <div className={cn('rounded-3xl bg-white p-3.5 shadow-card transition-shadow', selected && 'ring-2 ring-brand-orange')}>
      <button onClick={onSelect} className="flex w-full items-center gap-3 text-left">
        <span className="relative shrink-0">
          {d.photoUrl
            ? <img src={fileUrl(d.photoUrl)} alt="" className="h-14 w-14 rounded-2xl object-cover" />
            : <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-navy text-[20px] font-bold text-white">{d.name.charAt(0)}</span>}
          {d.isAvailable && <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[16px] font-bold text-brand-navy">{d.name}</span>
            {d.verified && <BadgeCheck className="h-[18px] w-[18px] shrink-0 text-brand-orange" />}
          </span>
          <span className="block truncate text-[13px] text-slate-500">
            {d.vehicleTypes.slice(0, 3).map((v) => t(vehicleKey(v))).join(' · ')}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[12.5px]">
            <span className="font-semibold text-brand-orange">{t('km_away', { d: d.distanceKm })}</span>
            {d.experienceYears != null && <span className="text-slate-400">· {t('years_exp', { n: d.experienceYears })}</span>}
          </span>
        </span>
      </button>
      <div className="mt-3 flex items-center gap-2">
        <span className={cn('flex-1 truncate text-[12.5px] font-semibold', d.isAvailable ? 'text-emerald-600' : 'text-slate-400')}>
          {d.isAvailable ? `● ${t('available_now')}` : t('offline')}{!d.verified && ` · ${t('pending_verification')}`}
        </span>
        {d.phone ? (
          <a href={`tel:+91${d.phone}`} className="pressable flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-[14px] font-bold text-white">
            <Phone className="h-4 w-4" /> {t('call')}
          </a>
        ) : null}
      </div>
    </div>
  );
};
