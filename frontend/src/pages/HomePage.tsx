import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Truck, Users, Plane, Map, Car, ShieldCheck, Clock, Headphones, BadgeCheck,
  Smartphone, Download, Menu, X, ArrowRight, CircleCheck, Phone, Mail, MapPin, Route, Wallet, FileCheck,
} from 'lucide-react';
import heroImg from '../assets/images/Login_Img.png';
import logoImg from '../assets/brand/logo-horizontal.png';
import emblemImg from '../assets/brand/logo-emblem.png';
import { APK_URL, APK_SIZE_LABEL, APP_VERSION, CONTACT } from '../config/site';

const NAV = [
  { href: '#services', label: 'Services' },
  { href: '#why-us', label: 'Why Us' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#drivers', label: 'Drive With Us' },
  { href: '#download', label: 'Get the App' },
];

const BUSINESS_SERVICES = [
  { icon: Building2, title: 'Corporate Travel', text: 'Employee pick-up and drop, client visits and event transport, scheduled and on time.' },
  { icon: Truck, title: 'Goods & Logistics', text: 'Reliable movement of goods across the city and between cities, with experienced drivers.' },
  { icon: Users, title: 'Fleet & Driver Management', text: 'Verified drivers for your fleet, with documents and licences checked before they start.' },
];

const PERSONAL_SERVICES = [
  { icon: Plane, title: 'Airport & Station Transfers', text: 'Comfortable rides to and from airports and railway stations, day or night.' },
  { icon: Map, title: 'Outstation & Tours', text: 'Family trips, pilgrimages and weekend getaways with a driver who knows the road.' },
  { icon: Car, title: 'Hire a Driver', text: 'Have your own vehicle? Book a professional, verified driver for a day or longer.' },
];

const WHY_US = [
  { icon: ShieldCheck, title: 'Verified Drivers', text: 'Every driver submits ID, licence and address proof, reviewed by our team before approval.' },
  { icon: Clock, title: 'On Time, Every Time', text: 'Planned routes and punctual drivers for business schedules and personal plans alike.' },
  { icon: BadgeCheck, title: 'Business & Personal', text: 'One trusted partner for company transport, goods movement and your family trips.' },
  { icon: Headphones, title: 'Always Reachable', text: 'Talk to a real person whenever you need help with a trip or a driver.' },
];

const STEPS = [
  { icon: Download, title: 'Download the app', text: 'Install RajWorthman on your Android phone in under a minute.' },
  { icon: FileCheck, title: 'Register & get verified', text: 'Share your details and documents. Our team reviews them quickly.' },
  { icon: Route, title: 'Start your journey', text: 'Get on the road for your business, your family or your next trip.' },
];

const DRIVER_BENEFITS = [
  'Steady work across business and personal trips',
  'Simple 3-step registration from your phone',
  'Upload documents with your camera, no paperwork runs',
  'Track your application status and notifications in the app',
];

const sectionTitle = 'font-[Poppins] text-2xl font-bold text-brand-ink sm:text-3xl md:text-4xl';
const eyebrow = 'mb-3 inline-block rounded-full bg-brand-sand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-ember';
const orangeBtn = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-brand-ember px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.02] active:scale-[0.98]';

export const HomePage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const contactLines = [
    CONTACT.phone && { icon: Phone, text: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, '')}` },
    CONTACT.email && { icon: Mail, text: CONTACT.email, href: `mailto:${CONTACT.email}` },
    CONTACT.address && { icon: MapPin, text: CONTACT.address, href: undefined },
  ].filter(Boolean) as { icon: typeof Phone; text: string; href?: string }[];

  return (
    <div className="min-h-screen scroll-smooth bg-white text-slate-700">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="#top" aria-label="RajWorthman home"><img src={logoImg} alt="RajWorthman" className="h-10 w-auto sm:h-11" /></a>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((n) => <a key={n.href} href={n.href} className="text-sm font-medium text-slate-600 hover:text-brand-ember">{n.label}</a>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="text-sm font-semibold text-brand-navy hover:text-brand-ember">Driver Login</Link>
            <a href={APK_URL} download className={`${orangeBtn} px-4 py-2 text-sm`}><Download className="h-4 w-4" /> Download App</a>
          </div>
          <button className="rounded-lg p-2 text-brand-navy lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 pb-4 lg:hidden">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="block border-b border-slate-50 py-3 font-medium text-slate-700">{n.label}</a>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/login" className="rounded-xl border border-brand-navy/20 py-3 text-center font-semibold text-brand-navy">Driver Login</Link>
              <a href={APK_URL} download className={`${orangeBtn} py-3`}><Download className="h-4 w-4" /> App</a>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-ink/95 via-brand-ink/80 to-brand-ink/40" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 md:grid-cols-[1.2fr_1fr] md:py-28">
            <div>
              <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-200">Drive · Manage · Grow</span>
              <h1 className="font-[Poppins] text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
                Transport for all your <span className="bg-gradient-to-r from-brand-orange to-amber-300 bg-clip-text text-transparent">business & personal</span> needs
              </h1>
              <p className="mt-5 max-w-xl text-base text-slate-200 sm:text-lg">
                From daily employee transport and goods movement to airport runs and family trips, RajWorthman connects you with verified, professional drivers you can trust.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#download" className={orangeBtn}><Smartphone className="h-5 w-5" /> Get the App</a>
                <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur hover:bg-white/20">
                  Become a Driver Partner <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-200">
                {['Verified drivers', 'Business & personal trips', 'Easy mobile app'].map((t) => (
                  <li key={t} className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-brand-orange" /> {t}</li>
                ))}
              </ul>
            </div>
            <div className="hidden justify-center md:flex">
              <div className="rounded-[2rem] bg-white/95 p-8 shadow-2xl">
                <img src={emblemImg} alt="" className="h-64 w-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Services ── */}
        <section id="services" className="scroll-mt-16 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className={eyebrow}>Our Services</span>
              <h2 className={sectionTitle}>One partner for every journey</h2>
              <p className="mt-4 text-slate-500">Whether it's your company or your family on the move, we have the right driver and the right plan.</p>
            </div>
            {[{ label: 'For Business', items: BUSINESS_SERVICES, icon: Building2 }, { label: 'For Personal Needs', items: PERSONAL_SERVICES, icon: Users }].map((group) => (
              <div key={group.label} className="mt-12">
                <h3 className="mb-5 flex items-center gap-2 font-[Poppins] text-lg font-semibold text-brand-navy">
                  <group.icon className="h-5 w-5 text-brand-ember" /> {group.label}
                </h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map(({ icon: Icon, title, text }) => (
                    <div key={title} className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-sand text-brand-ember transition-colors group-hover:bg-brand-orange group-hover:text-white">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h4 className="font-[Poppins] text-lg font-semibold text-brand-ink">{title}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why us ── */}
        <section id="why-us" className="scroll-mt-16 bg-brand-ink py-16 text-white sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-300">Why RajWorthman</span>
              <h2 className="font-[Poppins] text-2xl font-bold sm:text-3xl md:text-4xl">Safe, reliable and built on trust</h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_US.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <Icon className="mb-4 h-8 w-8 text-brand-orange" />
                  <h3 className="font-[Poppins] text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="scroll-mt-16 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className={eyebrow}>How It Works</span>
              <h2 className={sectionTitle}>On the road in three simple steps</h2>
            </div>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative rounded-2xl bg-white p-6 shadow-sm">
                  <span className="absolute right-5 top-4 font-[Poppins] text-4xl font-bold text-slate-100">0{i + 1}</span>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-ember text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-[Poppins] text-lg font-semibold text-brand-ink">{title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Driver partners ── */}
        <section id="drivers" className="scroll-mt-16 bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
            <div>
              <span className={eyebrow}>For Drivers</span>
              <h2 className={sectionTitle}>Drive with RajWorthman. Manage your work. Grow your income.</h2>
              <p className="mt-4 text-slate-500">Join our network of professional drivers. Register as a driver, or as a driver with your own vehicle, all from your phone.</p>
              <ul className="mt-6 space-y-3">
                {DRIVER_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-3"><CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-ember" /> <span>{b}</span></li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className={orangeBtn}>Register as a Driver <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-brand-navy/20 px-6 py-3 font-semibold text-brand-navy hover:bg-slate-50">Driver Login</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{ icon: Wallet, t: 'Regular trips' }, { icon: Smartphone, t: 'All in one app' }, { icon: ShieldCheck, t: 'Verified network' }, { icon: Headphones, t: 'Team support' }].map(({ icon: Icon, t }) => (
                <div key={t} className="flex flex-col items-center justify-center rounded-2xl bg-brand-sand p-6 text-center">
                  <Icon className="mb-3 h-8 w-8 text-brand-ember" />
                  <span className="font-semibold text-brand-ink">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Download ── */}
        <section id="download" className="scroll-mt-16 bg-gradient-to-br from-brand-navy to-brand-ink py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-[1.3fr_1fr]">
            <div className="text-white">
              <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-300">Mobile App</span>
              <h2 className="font-[Poppins] text-2xl font-bold sm:text-3xl md:text-4xl">Get the RajWorthman app</h2>
              <p className="mt-4 text-slate-300">Register, upload documents with your camera, and track everything from your phone.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href={APK_URL} download className={`${orangeBtn} py-4 text-lg`}>
                  <Download className="h-5 w-5" /> Download for Android
                </a>
                <span className="text-sm text-slate-400">Version {APP_VERSION} · {APK_SIZE_LABEL} · Android 6.0+</span>
              </div>
              <p className="mt-4 text-sm text-slate-400">iPhone app coming soon. Meanwhile, use the website from any browser.</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="font-[Poppins] text-lg font-semibold text-brand-ink">How to install</h3>
              <ol className="mt-4 space-y-3 text-sm">
                {['Tap "Download for Android" on your phone.', 'Open the downloaded file RajWorthman-latest.apk.', 'If asked, allow "Install unknown apps" for your browser.', 'Tap Install, then open RajWorthman.'].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-sand text-xs font-bold text-brand-ember">{i + 1}</span>
                    <span className="text-slate-600">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── Contact / CTA ── */}
        <section id="contact" className="scroll-mt-16 bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className={sectionTitle}>Ready to move?</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-500">Tell us what you need, whether it's daily business transport, goods delivery or a family trip, and we'll take it from there.</p>
            {contactLines.length > 0 && (
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
                {contactLines.map(({ icon: Icon, text, href }) => {
                  const inner = <><Icon className="h-5 w-5 text-brand-ember" /> {text}</>;
                  return href
                    ? <a key={text} href={href} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-medium text-brand-navy hover:border-brand-orange">{inner}</a>
                    : <span key={text} className="inline-flex items-center gap-2 px-5 py-3 text-slate-600">{inner}</span>;
                })}
              </div>
            )}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#download" className={orangeBtn}><Smartphone className="h-5 w-5" /> Get the App</a>
              <Link to="/register" className="inline-flex items-center justify-center rounded-xl border border-brand-navy/20 px-6 py-3 font-semibold text-brand-navy hover:bg-slate-50">Join as a Driver</Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row">
          <img src={logoImg} alt="RajWorthman" className="h-9 w-auto" />
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link to="/login" className="hover:text-brand-ember">Driver Login</Link>
            <Link to="/register" className="hover:text-brand-ember">Register</Link>
            <Link to="/admin/login" className="hover:text-brand-ember">Admin</Link>
            <a href={APK_URL} download className="hover:text-brand-ember">Download App</a>
          </div>
          <p>© {new Date().getFullYear()} RajWorthman. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
