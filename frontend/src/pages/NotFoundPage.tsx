import { Link } from 'react-router-dom';
import { ArrowLeft, House } from 'lucide-react';
import { HighwayHero } from '../components/app/Brand';

export const NotFoundPage = () => (
  <HighwayHero className="grid min-h-dvh place-items-center px-5">
    <div className="max-w-sm text-center">
      <p className="font-display text-[88px] font-extrabold leading-none text-brand-orange">404</p>
      <h1 className="mt-2 font-display text-[22px] font-bold">Wrong turn</h1>
      <p className="mt-2 text-[14px] text-white/70">This page doesn't exist or has moved.</p>
      <div className="mt-7 flex justify-center gap-3">
        <button onClick={() => window.history.back()} className="pressable inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-5 text-[14px] font-semibold">
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
        <Link to="/app" className="pressable inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-brand-ember px-5 text-[14px] font-semibold shadow-gold">
          <House className="h-4 w-4" /> Home
        </Link>
      </div>
    </div>
  </HighwayHero>
);
