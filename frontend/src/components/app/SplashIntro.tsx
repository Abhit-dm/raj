/* Launch animation: a RajWorthman truck drives the logo along the highway from the left to the centre. Tap to skip. */
import { useEffect, useState } from 'react';
import { Truck } from './Brand';
import { useT } from '../../i18n';

const DRIVE_MS = 2300;
const HOLD_MS = 1300;
const EXIT_MS = 450;

export const SplashIntro = ({ onDone }: { onDone: () => void }) => {
  const t = useT();
  const [phase, setPhase] = useState<'drive' | 'arrived' | 'exit'>('drive');
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const scale = reduced ? 0.3 : 1;
    const a = setTimeout(() => setPhase('arrived'), DRIVE_MS * scale);
    const b = setTimeout(() => setPhase('exit'), (DRIVE_MS + HOLD_MS) * scale);
    const c = setTimeout(onDone, (DRIVE_MS + HOLD_MS + EXIT_MS) * scale);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
  }, [onDone, reduced]);

  return (
    <div
      role="presentation"
      onClick={onDone}
      className="rw-splash fixed inset-0 z-[100] overflow-hidden"
      style={{ opacity: phase === 'exit' ? 0 : 1, transition: `opacity ${EXIT_MS}ms ease` }}
    >
      <style>{SPLASH_CSS}</style>

      {/* sky */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#030914 0%,#0A1A33 45%,#1B2F57 62%,#B4481A 74%,#E8650A 78%)' }} />
      <div className="rw-sun absolute left-1/2 rounded-full" />
      {/* hills */}
      <svg className="absolute inset-x-0 w-full" style={{ bottom: '27%', height: '22%' }} viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden>
        <path d="M0 60 L40 30 L90 55 L140 18 L200 58 L250 26 L310 52 L360 22 L400 45 V100 H0 Z" fill="#0B1A35" />
        <path d="M0 78 L60 52 L120 74 L190 48 L250 76 L320 54 L400 72 V100 H0 Z" fill="#06122A" />
      </svg>

      {/* road */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '28%', background: 'linear-gradient(180deg,#232C3D,#141A27)' }}>
        <div className="absolute inset-x-0 top-0 h-[6px] bg-brand-orange" />
        <div className="absolute inset-x-0 top-[6px] h-[3px] bg-black/40" />
        <div className="lane-dashes absolute inset-x-0 h-[6px] opacity-80" style={{ top: '46%' }} />
        <div className="absolute inset-x-0 bottom-0 h-[5px] bg-white/25" />
      </div>

      {/* name + tagline, after the truck stops */}
      <div className={`absolute inset-x-0 px-6 text-center ${phase === 'drive' ? 'opacity-0' : 'rw-title'}`} style={{ top: '17%' }}>
        <div className="font-display text-[34px] font-extrabold leading-none tracking-wide sm:text-[44px]">
          <span className="text-white">RAJ</span><span className="text-brand-orange">WORTHMAN</span>
        </div>
        <div className="mt-3 text-[12px] font-semibold uppercase tracking-[0.35em] text-orange-200/90 sm:text-[14px]">{t('tagline')}</div>
      </div>

      {/* truck */}
      <div className="absolute left-1/2" style={{ bottom: '9%', width: 'min(88vw, 440px)', marginLeft: 'calc(min(88vw, 440px) / -2)' }}>
        <div className={phase === 'drive' ? 'rw-drive' : 'rw-settle'}>
          <div className={`rw-beam ${phase === 'drive' ? '' : 'rw-beam-on'}`} />
          {phase === 'drive' && (
            <div className="rw-dust" aria-hidden>
              <span /><span /><span />
            </div>
          )}
          {phase === 'drive' && <div className="rw-streaks" aria-hidden><i /><i /><i /></div>}
          <Truck className="relative block w-full drop-shadow-[0_10px_18px_rgba(0,0,0,.5)]" spinning={phase === 'drive'} />
        </div>
      </div>
    </div>
  );
};

const SPLASH_CSS = `
.rw-sun { width: 52vmin; height: 52vmin; bottom: 39%; transform: translate(-50%, 50%);
  background: radial-gradient(circle, #FFB35C 0%, #FF8A2B 38%, rgba(232,101,10,.35) 60%, rgba(232,101,10,0) 72%);
  animation: rw-sun-rise ${DRIVE_MS}ms ease-out both; }
@keyframes rw-sun-rise { from { transform: translate(-50%, 70%); opacity: .5 } to { transform: translate(-50%, 50%); opacity: 1 } }

.rw-drive { animation: rw-drive ${DRIVE_MS}ms cubic-bezier(.16,.84,.3,1) both; }
@keyframes rw-drive {
  0% { transform: translateX(-125vw); }
  100% { transform: translateX(0); }
}
.rw-settle { animation: rw-settle .5s ease-out both; }
@keyframes rw-settle { 0% { transform: translateY(0) } 35% { transform: translateY(3px) } 70% { transform: translateY(-1px) } 100% { transform: translateY(0) } }

.rw-beam { position: absolute; left: 92%; bottom: 22%; width: 38%; height: 30%;
  background: linear-gradient(90deg, rgba(255,231,163,.55), rgba(255,231,163,0));
  clip-path: polygon(0 40%, 100% 0, 100% 100%, 0 60%); filter: blur(2px); opacity: .9; }
.rw-beam-on { animation: rw-flash .9s ease-in-out .1s 2 alternate; }
@keyframes rw-flash { to { opacity: .25 } }

.rw-dust { position: absolute; left: -6%; bottom: 4%; width: 18%; height: 30%; }
.rw-dust span { position: absolute; bottom: 0; left: 50%; width: 22px; height: 22px; border-radius: 50%;
  background: rgba(200,190,175,.35); animation: rw-puff .7s ease-out infinite; }
.rw-dust span:nth-child(2) { animation-delay: .23s; left: 20%; }
.rw-dust span:nth-child(3) { animation-delay: .46s; left: 70%; }
@keyframes rw-puff { from { transform: translate(0,0) scale(.4); opacity: .8 } to { transform: translate(-40px,-14px) scale(1.6); opacity: 0 } }

.rw-streaks { position: absolute; right: 100%; top: 18%; width: 60%; height: 60%; }
.rw-streaks i { position: absolute; right: 0; height: 3px; border-radius: 3px; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.55)); }
.rw-streaks i:nth-child(1) { top: 10%; width: 70%; }
.rw-streaks i:nth-child(2) { top: 45%; width: 100%; }
.rw-streaks i:nth-child(3) { top: 80%; width: 55%; }

.rw-title { animation: rw-title .7s cubic-bezier(.2,.8,.2,1) both; }
@keyframes rw-title { from { opacity: 0; transform: translateY(14px) scale(.96) } to { opacity: 1; transform: none } }

@media (prefers-reduced-motion: reduce) {
  .rw-drive, .rw-sun, .rw-settle, .rw-title, .rw-beam-on { animation-duration: .01ms !important; }
}
`;
