"use client";

import Link from "next/link";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bookmark,
  Check,
  ChevronRight,
  FolderOpen,
  Instagram,
  Layers3,
  MoveUpRight,
  Plus,
  Search,
  Send,
  Sparkles,
} from "lucide-react";

type Reel = {
  id: string;
  title: string;
  creator: string;
  category: string;
  image: string;
  color: string;
  duration: string;
};

const photo = (id: string, width = 700) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

const reels: Reel[] = [
  {
    id: "slow-mornings",
    title: "Make ordinary feel cinematic.",
    creator: "The everyday edit",
    category: "Visual storytelling",
    image: photo("photo-1441974231531-c6227db76b6e"),
    color: "#324338",
    duration: "0:24",
  },
  {
    id: "color-theory",
    title: "A little outside the lines.",
    creator: "Color studies",
    category: "Art direction",
    image: photo("photo-1618005182384-a83a8bd57fbe"),
    color: "#847098",
    duration: "0:18",
  },
  {
    id: "spaces",
    title: "Let the space do the talking.",
    creator: "Objects & spaces",
    category: "Brand building",
    image: photo("photo-1600210492486-724fe5c67fb0"),
    color: "#9B8877",
    duration: "0:32",
  },
  {
    id: "perspective",
    title: "A different point of view.",
    creator: "Out of office",
    category: "Opening hooks",
    image: photo("photo-1464822759023-fed622ff2c3b"),
    color: "#697981",
    duration: "0:16",
  },
  {
    id: "ritual",
    title: "Small ritual. Big feeling.",
    creator: "Daily details",
    category: "Product stories",
    image: photo("photo-1442512595331-e89e73853f31"),
    color: "#735342",
    duration: "0:21",
  },
];

const waveHeights = [
  14, 22, 35, 19, 42, 57, 29, 47, 66, 38, 24, 50, 71, 44, 27,
  54, 36, 63, 45, 23, 39, 58, 32, 48, 67, 41, 26, 51, 34, 18,
];

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.55 },
};

const solidButton =
  "inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#17181C] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#34353C] dark:bg-white dark:text-[#090A0D] dark:hover:bg-zinc-200";

const ghostButton =
  "inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-black/15 px-6 text-sm font-semibold transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Reeldash home"
      className={`inline-flex items-center gap-2.5 text-xl font-bold tracking-[-0.06em] ${
        inverted ? "text-white" : "text-[#17181C] dark:text-white"
      }`}
    >
      <span
        className={`flex size-8 items-center justify-center rounded-[10px] ${
          inverted ? "bg-white text-[#17181C]" : "bg-[#CBB5FD] text-[#24163D]"
        }`}
      >
        <Bookmark size={17} strokeWidth={2.6} aria-hidden="true" />
      </span>
      reeldash<span className="-ml-2 text-[#9C7ADA]">.</span>
    </Link>
  );
}

function Header() {
  return (
    <header className="relative z-20 mx-auto flex h-24 max-w-6xl items-center justify-between px-5 sm:px-8">
      <Brand />
      <nav aria-label="Main navigation" className="flex items-center gap-5 sm:gap-7">
        <Link href="#features" className="hidden text-sm text-zinc-500 transition-colors hover:text-zinc-950 sm:block dark:hover:text-white">
          How it works
        </Link>
        <Link href="#collections" className="hidden text-sm text-zinc-500 transition-colors hover:text-zinc-950 md:block dark:hover:text-white">
          Inspiration
        </Link>
        <Link href="/login" className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white">
          Log in
        </Link>
        <Link href="/signup" className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#17181C] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#34353C] dark:bg-white dark:text-[#090A0D] dark:hover:bg-zinc-200">
          Get started <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </nav>
    </header>
  );
}

function ReelCard({
  reel,
  index,
  featured = false,
}: {
  reel: Reel;
  index: number;
  featured?: boolean;
}) {
  const inputId = `${featured ? "hero" : "tray"}-save-${reel.id}`;
  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`group relative isolate aspect-[9/16] shrink-0 overflow-hidden rounded-[24px] text-white ${
        featured ? "w-full shadow-2xl shadow-black/20" : "w-[230px] snap-start sm:w-[252px]"
      }`}
      style={{ backgroundColor: reel.color }}
      aria-label={`${reel.title} — inspiration preview`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
        style={{ backgroundImage: `url("${reel.image}")` }}
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/5 to-black/25" />
      <div className="absolute inset-x-4 top-4 flex items-center justify-between">
        <span className="rounded-full border border-white/25 bg-black/15 px-3 py-1.5 text-[10px] font-medium backdrop-blur-md">
          {reel.category}
        </span>
        <span className="text-[10px] tabular-nums">{reel.duration}</span>
      </div>
      <div className="absolute inset-x-5 bottom-5">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
          Inspiration / {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="max-w-[190px] text-[27px] font-medium leading-[1.08] tracking-[-0.045em]">
          {reel.title}
        </h3>
        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-[11px] text-white/80">{reel.creator}</span>
          <div className="relative shrink-0">
            <input id={inputId} type="checkbox" className="peer sr-only" aria-label={`Save ${reel.title}`} />
            <label
              htmlFor={inputId}
              className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition-colors hover:bg-white/25 peer-checked:border-[#CBB5FD] peer-checked:bg-[#CBB5FD] peer-checked:text-[#24163D] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-white"
            >
              <Bookmark size={17} aria-hidden="true" />
            </label>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 text-center sm:px-8 sm:pt-16">
      <motion.div {...reveal}>
        <p className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className="size-1.5 rounded-full bg-[#9C7ADA]" />
          Less scrolling. More creating.
        </p>
        <h1 id="hero-heading" className="text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[1.08] tracking-[-0.065em]">
          <span className="block whitespace-nowrap">Save your next</span>
          <span className="block whitespace-nowrap">
            <span
              aria-hidden="true"
              className="inline-block w-20 h-9 rounded-full align-middle mx-2 bg-cover bg-center border border-black/10"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80')" }}
            />
            great idea.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-[410px] text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
          Your best finds deserve better than a saved folder.
          Collect Reels, carousels, and audio. Make something original.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className={solidButton}>
            Start Swipe File <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/login" className={ghostButton}>
            Log In <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </motion.div>
      <div id="demo" className="relative mx-auto mt-16 max-w-[720px] scroll-mt-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] inset-y-[15%] rounded-full bg-[#DDCCFF]/65 blur-[75px] dark:bg-[#7052B3]/25" />
        <div aria-hidden="true" className="pointer-events-none absolute left-[8%] top-16 hidden w-[190px] -rotate-[12deg] rounded-[22px] border border-black/5 bg-white p-2 shadow-xl shadow-black/5 sm:block dark:border-white/10 dark:bg-[#0F1114]">
          <div className="aspect-[4/5] rounded-[16px] bg-cover bg-center" style={{ backgroundImage: `url("${reels[2].image}")` }} />
          <div className="flex items-center justify-between px-2 py-4 text-left">
            <span className="text-xs font-medium">Spaces worth saving</span>
            <Layers3 size={14} />
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute right-[8%] top-24 hidden w-[180px] rotate-[10deg] rounded-[22px] border border-[#CCEBD7] bg-[#F0FDF4] p-5 text-left text-[#286641] shadow-xl shadow-black/5 sm:block dark:border-[#1E3B29] dark:bg-[#101C15] dark:text-[#80CFA0]">
          <AudioLines size={24} />
          <p className="mt-5 text-lg font-medium leading-tight tracking-tight">That sound you can’t forget.</p>
          <div className="mt-5 flex h-10 items-center gap-1">
            {waveHeights.slice(0, 18).map((height, i) => (
              <span key={i} className="w-1 rounded-full bg-current opacity-50" style={{ height: `${height / 2}px` }} />
            ))}
          </div>
          <p className="mt-3 text-[10px]">Filed under: next big idea</p>
        </div>
        <motion.div {...reveal} className="relative mx-auto w-[240px] sm:w-[260px]">
          <ReelCard reel={reels[0]} index={0} featured />
          <div className="absolute -right-5 top-[45%] flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-2.5 text-[11px] font-medium shadow-lg sm:-right-20 dark:border-white/10 dark:bg-[#17181C]">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#E7F5E9] text-[#286641]">
              <Check size={12} aria-hidden="true" />
            </span>
            A little more organized.
          </div>
        </motion.div>
        <p className="relative mt-7 text-xs text-zinc-500 dark:text-zinc-400">
          Try the bookmark. Saves in this preview reset when you leave.
        </p>
      </div>
      <div className="mt-16 border-t border-black/10 pt-8 dark:border-white/10">
        <p className="text-[11px] text-zinc-400">For people who see inspiration everywhere.</p>
        <ul className="mt-5 flex flex-wrap justify-center gap-x-9 gap-y-3 text-sm font-medium tracking-tight text-zinc-600 dark:text-zinc-300">
          {["Creators", "Founders", "Creative directors", "Independent studios", "Ad agencies"].map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="mx-auto max-w-6xl scroll-mt-12 px-5 py-16 sm:px-8">
      <motion.div {...reveal} className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <h2 id="features-heading" className="max-w-md text-4xl font-medium leading-[1.1] tracking-[-0.055em] sm:text-5xl">
          A messy mind.<br /><span className="text-zinc-400">A beautifully tidy vault.</span>
        </h2>
        <p className="max-w-[290px] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Keep the spark. Lose the screenshot pile.
          Everything that catches your eye, finally in one place.
        </p>
      </motion.div>
      <div className="grid grid-flow-dense grid-cols-1 gap-0 overflow-hidden rounded-[28px] border border-black/10 md:grid-cols-12 dark:border-white/10">
        <article className="overflow-hidden border-b border-black/10 bg-white p-7 md:col-span-7 md:border-r md:p-9 dark:border-white/10 dark:bg-[#0F1114]">
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl border border-black/10 dark:border-white/10">
            <Send size={19} aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-medium tracking-[-0.04em]">See it. Send it. Saved.</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            DM a Reel to Reeldash on Instagram. One tap into your swipe file, without breaking your scroll.
          </p>
          <div className="mx-auto mt-8 max-w-[340px] rounded-t-[22px] border border-b-0 border-black/10 bg-[#FAFAF8] p-4 dark:border-white/10 dark:bg-[#090A0D]">
            <div className="flex items-center gap-2 border-b border-black/5 pb-3 text-xs font-semibold dark:border-white/10">
              <Instagram size={16} aria-hidden="true" /> reeldash
              <span className="ml-auto text-[10px] font-normal text-zinc-400">DM preview</span>
            </div>
            <div className="ml-auto mt-4 w-fit rounded-2xl rounded-tr-sm bg-[#EDE4FF] px-4 py-3 text-xs text-[#6E47C7]">
              This one. For the next campaign.
            </div>
            <div className="mt-3 flex max-w-[245px] items-center gap-3 rounded-2xl rounded-tl-sm border border-black/5 bg-white p-3 text-xs dark:border-white/10 dark:bg-[#17181C]">
              <div className="h-12 w-9 shrink-0 rounded-md bg-cover bg-center" style={{ backgroundImage: `url("${reels[1].image}")` }} aria-hidden="true" />
              <div><p className="font-medium">Added to your vault</p><p className="mt-1 text-zinc-500">Ready when you are.</p></div>
              <Check size={14} className="ml-auto text-[#286641] dark:text-[#80CFA0]" aria-hidden="true" />
            </div>
          </div>
        </article>
        <article className="overflow-hidden border-b border-[#F6E3B5] bg-[#FFFBF0] p-7 text-[#8A6715] md:col-span-5 md:p-9 dark:border-[#382E16] dark:bg-[#1C180E] dark:text-[#E8C265]">
          <FolderOpen size={24} className="mb-10" aria-hidden="true" />
          <h3 className="text-2xl font-medium tracking-[-0.04em]">A mood for every board.</h3>
          <p className="mt-3 max-w-xs text-sm leading-relaxed opacity-80">Cluster your finds by client, campaign, or that feeling you can’t quite name.</p>
          <div className="relative mx-auto mt-9 h-[162px] max-w-[285px]" aria-hidden="true">
            {[reels[2], reels[4], reels[1]].map((reel, index) => (
              <div key={reel.id} className="absolute top-2 h-36 w-[110px] rounded-xl border-[5px] border-white bg-cover bg-center shadow-lg dark:border-[#302719]" style={{ backgroundImage: `url("${reel.image}")`, left: `${index * 27}%`, transform: `rotate(${(index - 1) * 11}deg)` }} />
            ))}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[11px] font-medium shadow-sm dark:bg-[#382E16]">The next campaign · 12 ideas</span>
          </div>
        </article>
        <article className="border-b border-[#CCEBD7] bg-[#F0FDF4] p-7 text-[#286641] md:col-span-5 md:border-b-0 md:border-r md:p-9 dark:border-[#1E3B29] dark:bg-[#101C15] dark:text-[#80CFA0]">
          <AudioLines size={24} className="mb-8" aria-hidden="true" />
          <h3 className="text-2xl font-medium tracking-[-0.04em]">Keep the hook. And the beat.</h3>
          <p className="mt-3 max-w-xs text-sm leading-relaxed opacity-80">The opening line. The perfect audio. Save the details that make an idea stick.</p>
          <div className="mt-8 rounded-2xl border border-[#CCEBD7] bg-white/50 p-4 dark:border-[#1E3B29] dark:bg-white/5">
            <div className="flex items-center justify-between text-[11px]"><span>Original audio</span><span className="opacity-60">0:24</span></div>
            <div className="mt-4 flex h-[72px] items-center justify-between gap-1" aria-hidden="true">
              {waveHeights.map((height, index) => (
                <span key={index} className={`w-1.5 rounded-full bg-current ${index > 18 ? "opacity-20" : "opacity-65"}`} style={{ height: `${height}px` }} />
              ))}
            </div>
            <p className="mt-3 border-t border-current/10 pt-3 text-[11px] opacity-80">“What if we started with the unexpected?”</p>
          </div>
        </article>
        <article className="overflow-hidden bg-[#F7F3FF] p-7 text-[#6E47C7] md:col-span-7 md:p-9 dark:bg-[#161224] dark:text-[#CBB5FD]">
          <Search size={24} className="mb-8" aria-hidden="true" />
          <h3 className="text-2xl font-medium tracking-[-0.04em]">Find that one thing. Instantly.</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-80">Search by topic or creator. Get back to the Reel you remember, not another hour of scrolling.</p>
          <div className="mt-8 rounded-2xl border border-[#E5DAFD] bg-white/65 p-4 dark:border-[#2E2250] dark:bg-white/5">
            <div className="flex items-center gap-3 rounded-xl border border-[#E5DAFD] bg-white px-3 py-3 text-xs dark:border-[#2E2250] dark:bg-[#161224]">
              <Search size={15} aria-hidden="true" /><span>Slow living, strong opening</span><span className="ml-auto text-[10px] opacity-40">Search preview</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Visual hooks", "Interiors", "Storytelling"].map((tag) => (
                <span key={tag} className="rounded-full border border-[#E5DAFD] px-3 py-1.5 text-[10px] dark:border-[#2E2250]">{tag}</span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div aria-hidden="true" className="size-10 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url("${reels[2].image}")` }} />
              <div className="text-xs"><p className="font-medium">Let the space do the talking.</p><p className="mt-1 text-[10px] opacity-60">Objects & spaces · Brand building</p></div>
              <ChevronRight size={16} className="ml-auto shrink-0" aria-hidden="true" />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function Collections() {
  const reducedMotion = useReducedMotion();
  function scrollTray(direction: number) {
    const tray = document.getElementById("reel-tray");
    if (!tray) return;
    tray.scrollBy({ left: direction * 276, behavior: reducedMotion ? "auto" : "smooth" });
  }
  return (
    <section id="collections" aria-labelledby="collections-heading" className="overflow-hidden py-16 sm:py-24">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-5 px-5 sm:px-8">
        <motion.div {...reveal}>
          <p className="mb-4 flex items-center gap-2 text-xs text-zinc-500"><Sparkles size={14} aria-hidden="true" /> Follow your curiosity</p>
          <h2 id="collections-heading" className="text-4xl font-medium leading-[1.1] tracking-[-0.055em] sm:text-5xl">Your taste.<br />An unfair advantage.</h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">A swipe file is more than a collection. It’s a little map of where your mind wants to go next.</p>
        </motion.div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => scrollTray(-1)} aria-label="Scroll inspiration left" aria-controls="reel-tray" className="flex size-11 items-center justify-center rounded-full border border-black/15 transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"><ArrowLeft size={17} aria-hidden="true" /></button>
          <button type="button" onClick={() => scrollTray(1)} aria-label="Scroll inspiration right" aria-controls="reel-tray" className="flex size-11 items-center justify-center rounded-full border border-black/15 transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"><ArrowRight size={17} aria-hidden="true" /></button>
        </div>
      </div>
      <div id="reel-tray" role="region" aria-label="Curated inspiration previews" tabIndex={0} className="reel-tray mx-auto mt-8 flex max-w-6xl snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain px-5 pb-8 pt-4 sm:px-8">
        {reels.map((reel, index) => <ReelCard key={reel.id} reel={reel} index={index} />)}
        <Link href="#join" className="flex aspect-[9/16] w-[230px] shrink-0 snap-start flex-col items-center justify-center rounded-[24px] border border-dashed border-black/20 bg-[#F2F0EB] p-7 text-center transition-colors hover:bg-[#EAE6DE] sm:w-[252px] dark:border-white/20 dark:bg-[#0F1114] dark:hover:bg-[#17181C]">
          <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-white dark:bg-white/10"><Plus size={23} aria-hidden="true" /></span>
          <span className="text-2xl font-medium leading-tight tracking-tight">Make room for<br />your next idea.</span>
          <span className="mt-5 flex items-center gap-2 text-xs text-zinc-500">Start your collection <ArrowUpRight size={14} aria-hidden="true" /></span>
        </Link>
      </div>
      <p className="mx-auto max-w-6xl px-5 text-[11px] text-zinc-400 sm:px-8">A sample of what your vault could look like. Photography via Unsplash.</p>
    </section>
  );
}

function Footer() {
  return (
    <footer id="join" className="relative overflow-hidden bg-[#17181C] text-white dark:border-t dark:border-white/10 dark:bg-[#0F1114]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-0 size-[400px] rounded-full bg-[#8860C5]/15 blur-[100px]" />
      <div className="relative mx-auto max-w-6xl px-5 pb-8 pt-20 sm:px-8 sm:pt-24">
        <div className="grid gap-10 md:grid-cols-[1.25fr_1fr] md:items-end">
          <motion.div {...reveal}>
            <p className="mb-6 text-xs text-[#CBB5FD]">For the ideas you haven’t made yet.</p>
            <h2 className="text-[clamp(3.5rem,8vw,6.5rem)] font-medium leading-[0.98] tracking-[-0.065em]">Less lost.<br /><span className="text-[#CBB5FD]">More made.</span></h2>
          </motion.div>
          <div className="max-w-sm md:pb-2">
            <p className="mb-7 text-sm leading-relaxed text-zinc-400">Your next great project starts with something you saved. Give it a home.</p>
            <form action="/signup" method="get">
              <label htmlFor="signup-email" className="sr-only">Your email address</label>
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 p-1.5 focus-within:border-[#CBB5FD] focus-within:ring-2 focus-within:ring-[#CBB5FD]/20">
                <input id="signup-email" name="email" type="email" autoComplete="email" placeholder="Your email address" required maxLength={254} className="min-w-0 flex-1 rounded-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
                <button type="submit" aria-label="Start your swipe file with this email" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#CBB5FD] text-[#24163D] transition-colors hover:bg-[#DECEFF]"><MoveUpRight size={20} aria-hidden="true" /></button>
              </div>
              <p className="mt-3 px-4 text-[11px] leading-relaxed text-zinc-500">Enter your email to continue to account creation.</p>
            </form>
          </div>
        </div>
        <div className="mt-20 flex flex-col justify-between gap-6 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
          <Brand inverted />
          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <Link href="/login" className="hover:text-white transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
          <p className="text-[11px] text-zinc-500">© {new Date().getFullYear()} Reeldash. Keep your inspiration close.</p>
          <Link href="#features" className="flex items-center gap-2 text-xs text-zinc-400 transition-colors hover:text-white">Back to the good stuff <ArrowUpRight size={13} aria-hidden="true" /></Link>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#17181C] antialiased selection:bg-[#DDCCFF] selection:text-[#24163D] dark:bg-[#090A0D] dark:text-[#F4F3F6]">
        <a href="#main-content" className="sr-only fixed left-4 top-4 z-50 rounded-full bg-[#17181C] px-5 py-3 text-sm text-white focus:not-sr-only">Skip to content</a>
        <Header />
        <main id="main-content">
          <Hero />
          <Features />
          <Collections />
        </main>
        <Footer />
        <style jsx global>{`
          html { scroll-behavior: smooth; }
          section[id], footer[id] { scroll-margin-top: 2rem; }
          .reel-tray { scrollbar-width: thin; scrollbar-color: #c9c3d2 transparent; }
          .reel-tray::-webkit-scrollbar { height: 4px; }
          .reel-tray::-webkit-scrollbar-thumb { background: #c9c3d2; border-radius: 8px; }
          a:focus-visible, button:focus-visible, [tabindex="0"]:focus-visible {
            outline: 2px solid #9c7ada;
            outline-offset: 5px;
          }
          @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            *, *::before, *::after { transition-duration: 0.01ms !important; }
          }
        `}</style>
      </div>
    </MotionConfig>
  );
}