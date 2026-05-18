import ChatModal from "@/components/ChatModal";
import ClanModal from "@/components/ClanModal";
import CloudCoinIcon from "@/components/CloudCoinIcon";
import LeaderboardModal from "@/components/LeaderboardModal";
import MenuBackground from "@/components/MenuBackground";
import ProfileModal from "@/components/ProfileModal";
import {
  useGetCallerProgress,
  useGetGlobalStatistics,
} from "@/hooks/useQueries";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Award,
  ChevronRight,
  LogIn,
  MessageCircle,
  Mountain,
  Play,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
  User,
  Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import Game from "./Game";

const Home: React.FC = () => {
  const [gameMode, setGameMode] = useState<"none" | "guest" | "authenticated">(
    "none",
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showClan, setShowClan] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const { data: userProgress, isLoading: progressLoading } =
    useGetCallerProgress();
  const { data: globalStats, isLoading: statsLoading } =
    useGetGlobalStatistics();

  const isAuthenticated = !!identity;

  const handlePlayAsGuest = () => setGameMode("guest");
  const handleLogin = () => login();
  const handlePlayAuthenticated = () => setGameMode("authenticated");
  const handleBackToHome = () => setGameMode("none");

  const formatNumber = (num: bigint | number): string => {
    const n = typeof num === "bigint" ? Number(num) : num;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const cloudCount =
    isAuthenticated && userProgress ? Number(userProgress.clouds) : 0;
  const level =
    isAuthenticated && userProgress ? Number(userProgress.level) : 0;

  // Pointer parallax: subtle tilt of the character based on cursor / finger.
  // CSS variables --tx, --ty in fractional units (-1..1).
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    const apply = () => {
      el.style.setProperty("--tx", String(tx));
      el.style.setProperty("--ty", String(ty));
      raf = 0;
    };
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      tx = (e.clientX - cx) / window.innerWidth;
      ty = (e.clientY - cy) / window.innerHeight;
      // clamp
      tx = Math.max(-1, Math.min(1, tx));
      ty = Math.max(-1, Math.min(1, ty));
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Smooth-tween the cloud counter so it doesn't snap.
  const [displayClouds, setDisplayClouds] = useState(cloudCount);
  const displayCloudsRef = useRef(displayClouds);
  useEffect(() => {
    displayCloudsRef.current = displayClouds;
  }, [displayClouds]);
  useEffect(() => {
    const from = displayCloudsRef.current;
    const to = cloudCount;
    if (from === to) return;
    const dur = 700;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - (1 - k) ** 3;
      setDisplayClouds(Math.round(from + (to - from) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [cloudCount]);

  if (gameMode !== "none") {
    return <Game mode={gameMode} onBackToHome={handleBackToHome} />;
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Animated cinematic background (canvas) */}
      <MenuBackground />

      {/* Vignette + grain overlay for depth (CSS only) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 55%, rgba(20,40,80,0.18) 100%)",
        }}
      />

      {/* ---------- TOP BAR ---------- */}
      <div className="absolute top-0 inset-x-0 z-20 px-3 pt-3 md:px-5 md:pt-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Profile pill (with level ring if logged in) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              aria-label="Open profile"
              className="group relative flex items-center gap-2 rounded-full bg-white/40 backdrop-blur-xl px-2 py-1.5 pr-3.5 border border-white/60 shadow-[0_6px_24px_rgba(80,120,180,0.25)] hover:bg-white/60 transition"
            >
              <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white font-bold shadow-inner ring-2 ring-white/60">
                {isAuthenticated ? (
                  <span className="text-sm tabular-nums">{level}</span>
                ) : (
                  <User className="h-4 w-4" />
                )}
                {isAuthenticated && (
                  // Level ring (decorative)
                  <span className="absolute inset-0 rounded-full ring-2 ring-amber-300/80 animate-spin-very-slow [animation-direction:reverse]" />
                )}
              </span>
              <span className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase tracking-[0.18em] text-sky-900/70 font-semibold">
                  {isAuthenticated ? "Pilot" : "Guest"}
                </span>
                <span className="text-sm font-bold text-sky-950 max-w-[120px] truncate">
                  {isAuthenticated ? `Level ${level}` : "Sign in"}
                </span>
              </span>
            </button>

            {/* Cloud Coin (only when authed) */}
            {isAuthenticated && (
              <div className="group flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-50/95 via-yellow-50/90 to-amber-100/95 backdrop-blur-xl px-3 py-1.5 border border-amber-300/70 shadow-[0_6px_24px_rgba(220,180,80,0.35)]">
                <div className="relative">
                  <CloudCoinIcon
                    size={28}
                    className="drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                  />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping-slow" />
                </div>
                <span className="text-base md:text-lg font-mono font-black text-amber-700 leading-none tabular-nums tracking-tight">
                  {formatNumber(displayClouds)}
                </span>
              </div>
            )}
          </div>

          {/* Right: Icon cluster (glass pill) */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_6px_24px_rgba(80,120,180,0.25)] p-1">
            {isAuthenticated && (
              <IconBtn
                onClick={() => setShowClan(true)}
                label="Clan"
                ring="from-purple-300 to-purple-500"
              >
                <Shield className="h-4 w-4 text-purple-700" />
              </IconBtn>
            )}
            {isAuthenticated && (
              <IconBtn
                onClick={() => setShowLeaderboard(true)}
                label="Leaderboard"
                ring="from-amber-300 to-amber-500"
              >
                <Award className="h-4 w-4 text-amber-700" />
              </IconBtn>
            )}
            {isAuthenticated && (
              <IconBtn
                onClick={() => setShowChat(true)}
                label="Chat"
                ring="from-sky-300 to-sky-500"
              >
                <MessageCircle className="h-4 w-4 text-sky-700" />
              </IconBtn>
            )}
          </div>
        </div>
      </div>

      {/* ---------- MAIN CONTENT ---------- */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 py-20 md:py-24">
        <div
          ref={parallaxRef}
          className="relative w-full max-w-md mx-auto flex flex-col items-center text-center animate-fade-in-up"
        >
          {/* Subtitle eyebrow */}
          <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/30 backdrop-blur-md border border-white/50 shadow-sm">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-sky-900/80">
              Built on Internet Computer
            </span>
          </div>

          {/* Title with multi-layer 3D depth + animated shimmer */}
          <div className="relative mb-2 select-none">
            <h1
              className="cloud-jump-title text-[2.85rem] sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] font-black tracking-tight"
              data-text="Cloud Jump"
            >
              Cloud Jump
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-sm md:text-base text-sky-900/80 font-medium mb-6 max-w-[280px]">
            Climb endless skies. Stomp the storm.{" "}
            <span className="text-amber-600 font-bold">Mint your altitude.</span>
          </p>

          {/* Character on cloud platform pedestal */}
          <div
            className="relative mb-7 select-none pointer-events-none"
            style={{
              transform:
                "translate3d(calc(var(--tx, 0) * -6px), calc(var(--ty, 0) * -4px), 0)",
              transition: "transform 0.15s ease-out",
            }}
          >
            {/* Soft cyan glow under character */}
            <div className="absolute -inset-12 rounded-full bg-gradient-radial from-sky-200/60 via-sky-200/20 to-transparent blur-2xl animate-pulse-gentle" />

            {/* Amber halo */}
            <div className="absolute inset-0 bg-gradient-radial from-amber-300/30 to-transparent blur-2xl" />

            <img
              src="/assets/player.png"
              alt="Cloud Jump Character"
              className="relative w-36 h-36 md:w-44 md:h-44 object-contain animate-character-float drop-shadow-[0_18px_30px_rgba(40,60,90,0.45)]"
              draggable={false}
            />

            {/* Pedestal cloud */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-44 md:w-56">
              <CloudPedestal />
            </div>

            {/* Floating sparkles around character */}
            <FloatingSparkles />
          </div>

          {/* CTA Buttons */}
          <div className="w-full max-w-xs space-y-3">
            {!isAuthenticated ? (
              <>
                <PrimaryButton
                  onClick={handlePlayAsGuest}
                  variant="emerald"
                  primary
                >
                  <Play className="h-5 w-5" />
                  Play Now
                  <ChevronRight className="h-4 w-4 opacity-70" />
                </PrimaryButton>

                <PrimaryButton
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  variant="sky"
                >
                  <LogIn className="h-5 w-5" />
                  {isLoggingIn ? "Connecting..." : "Sign in with ICP"}
                </PrimaryButton>
              </>
            ) : (
              <PrimaryButton
                onClick={handlePlayAuthenticated}
                disabled={progressLoading}
                variant="emerald"
                primary
              >
                <Play className="h-5 w-5" />
                Start Climbing
                <ChevronRight className="h-4 w-4 opacity-70" />
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>

      {/* ---------- BOTTOM STATS BAR ---------- */}
      <div className="absolute bottom-0 inset-x-0 z-10 px-3 pb-3 md:px-5 md:pb-4">
        <div className="mx-auto max-w-md">
          {statsLoading ? (
            <div className="rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(80,120,180,0.25)] px-4 py-3 text-center">
              <span className="text-xs text-sky-900/70 animate-pulse">
                Loading worlds…
              </span>
            </div>
          ) : globalStats ? (
            <div className="relative rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(80,120,180,0.25)] overflow-hidden">
              {/* Inner top highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
              <div className="grid grid-cols-4 px-2 py-2.5">
                <Stat
                  color="sky"
                  icon={<Users className="h-3.5 w-3.5" />}
                  value={formatNumber(globalStats.totalPlayers)}
                  label="Pilots"
                />
                <Stat
                  color="emerald"
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                  value={formatNumber(globalStats.totalJumps)}
                  label="Jumps"
                />
                <Stat
                  color="purple"
                  icon={<Trophy className="h-3.5 w-3.5" />}
                  value={formatNumber(globalStats.totalGamesPlayed)}
                  label="Runs"
                />
                <Stat
                  color="amber"
                  icon={<Mountain className="h-3.5 w-3.5" />}
                  value={formatNumber(globalStats.totalHeightReached)}
                  label="Height"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ---------- MODALS ---------- */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        isAuthenticated={isAuthenticated}
      />
      <ChatModal isOpen={showChat} onClose={() => setShowChat(false)} />
      <ClanModal isOpen={showClan} onClose={() => setShowClan(false)} />
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

const IconBtn: React.FC<{
  onClick: () => void;
  label: string;
  ring: string;
  children: React.ReactNode;
}> = ({ onClick, label, ring, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="group relative flex items-center justify-center w-9 h-9 rounded-full bg-white/80 hover:bg-white transition-all active:scale-90 shadow-sm"
  >
    {/* Color ring on hover */}
    <span
      className={`absolute inset-0 rounded-full bg-gradient-to-br ${ring} opacity-0 group-hover:opacity-100 transition-opacity blur-md -z-10`}
    />
    {children}
  </button>
);

/**
 * Decorative cloud pedestal under the character.
 * Pure SVG so it scales crisply at any size.
 */
const CloudPedestal: React.FC = () => (
  <svg viewBox="0 0 220 60" className="w-full" role="img" aria-label="Cloud pedestal">
    <title>Cloud pedestal</title>
    <defs>
      <radialGradient id="cp-body" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#f4faff" />
        <stop offset="100%" stopColor="#d8e7f5" />
      </radialGradient>
      <linearGradient id="cp-shadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(120,150,190,0)" />
        <stop offset="100%" stopColor="rgba(120,150,190,0.32)" />
      </linearGradient>
      <filter id="cp-blur">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
    {/* Outline halo via blurred copy underneath */}
    <g filter="url(#cp-blur)" opacity="0.55">
      <ellipse cx="110" cy="42" rx="100" ry="16" fill="#a8c4de" />
    </g>
    {/* Body: multiple ellipses */}
    <g fill="url(#cp-body)">
      <ellipse cx="110" cy="40" rx="100" ry="18" />
      <ellipse cx="50" cy="30" rx="34" ry="22" />
      <ellipse cx="85" cy="20" rx="32" ry="24" />
      <ellipse cx="130" cy="18" rx="38" ry="26" />
      <ellipse cx="170" cy="28" rx="34" ry="22" />
      <ellipse cx="205" cy="36" rx="14" ry="14" />
    </g>
    {/* Bottom shadow */}
    <ellipse cx="110" cy="48" rx="86" ry="10" fill="url(#cp-shadow)" />
    {/* Specular highlight */}
    <ellipse
      cx="92"
      cy="14"
      rx="28"
      ry="6"
      fill="rgba(255,255,255,0.7)"
      transform="rotate(-12 92 14)"
    />
    {/* Tiny sparkles */}
    <g fill="#ffffff" opacity="0.9">
      <circle cx="60" cy="18" r="1.2" />
      <circle cx="160" cy="14" r="1.2" />
      <circle cx="125" cy="32" r="1" />
    </g>
  </svg>
);

const FloatingSparkles: React.FC = () => {
  // Static positions, animated via CSS keyframes with staggered delays.
  const sparkles = [
    { id: "s1", top: "10%", left: "8%", delay: "0s", scale: 1 },
    { id: "s2", top: "20%", left: "92%", delay: "0.6s", scale: 0.8 },
    { id: "s3", top: "50%", left: "98%", delay: "1.2s", scale: 1.1 },
    { id: "s4", top: "75%", left: "4%", delay: "0.3s", scale: 0.9 },
    { id: "s5", top: "5%", left: "55%", delay: "0.9s", scale: 0.7 },
    { id: "s6", top: "85%", left: "70%", delay: "1.5s", scale: 1 },
  ];
  return (
    <>
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="absolute w-1.5 h-1.5 rounded-full bg-white animate-sparkle pointer-events-none"
          style={{
            top: s.top,
            left: s.left,
            transform: `translate(-50%, -50%) scale(${s.scale})`,
            animationDelay: s.delay,
            boxShadow:
              "0 0 8px 2px rgba(255,250,180,0.9), 0 0 18px 4px rgba(255,220,120,0.5)",
          }}
        />
      ))}
    </>
  );
};

const STAT_COLORS = {
  sky: {
    text: "text-sky-700",
    bg: "from-sky-100 to-sky-50",
    glow: "shadow-[inset_0_0_12px_rgba(56,189,248,0.25)]",
  },
  emerald: {
    text: "text-emerald-700",
    bg: "from-emerald-100 to-emerald-50",
    glow: "shadow-[inset_0_0_12px_rgba(52,211,153,0.25)]",
  },
  purple: {
    text: "text-purple-700",
    bg: "from-purple-100 to-purple-50",
    glow: "shadow-[inset_0_0_12px_rgba(168,85,247,0.25)]",
  },
  amber: {
    text: "text-amber-700",
    bg: "from-amber-100 to-amber-50",
    glow: "shadow-[inset_0_0_12px_rgba(251,191,36,0.3)]",
  },
} as const;

interface StatProps {
  color: keyof typeof STAT_COLORS;
  icon: React.ReactNode;
  value: string;
  label: string;
}

const Stat: React.FC<StatProps> = ({ color, icon, value, label }) => {
  const c = STAT_COLORS[color];
  return (
    <div className="flex flex-col items-center gap-1 px-1">
      <div
        className={`flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br ${c.bg} ${c.text} ${c.glow}`}
      >
        {icon}
      </div>
      <div className="flex flex-col items-center leading-none">
        <span
          className={`text-[13px] font-mono font-black ${c.text} tabular-nums`}
        >
          {value}
        </span>
        <span className="text-[9px] mt-0.5 font-bold text-slate-500/90 uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
    </div>
  );
};

interface PrimaryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant: "emerald" | "sky" | "purple";
  primary?: boolean;
  children: React.ReactNode;
}

const VARIANTS = {
  emerald: {
    grad: "from-emerald-400 via-emerald-500 to-emerald-700",
    glow: "rgba(16,185,129,0.55)",
    inner: "from-emerald-300/80",
  },
  sky: {
    grad: "from-sky-400 via-sky-500 to-blue-700",
    glow: "rgba(56,189,248,0.55)",
    inner: "from-sky-300/80",
  },
  purple: {
    grad: "from-purple-400 via-purple-500 to-purple-700",
    glow: "rgba(168,85,247,0.55)",
    inner: "from-purple-300/80",
  },
} as const;

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onClick,
  disabled,
  variant,
  primary,
  children,
}) => {
  const v = VARIANTS[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-full ${
        primary ? "h-[60px] text-lg" : "h-[52px] text-base"
      } font-bold text-white rounded-2xl overflow-hidden transform transition-all duration-200 hover:scale-[1.025] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
      style={{
        boxShadow: `0 12px 28px -6px ${v.glow}, 0 6px 12px -4px rgba(0,0,0,0.25)`,
      }}
    >
      {/* Base gradient */}
      <span
        className={`absolute inset-0 bg-gradient-to-b ${v.grad}`}
      />
      {/* Top glossy highlight */}
      <span
        className={`absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b ${v.inner} to-transparent`}
      />
      {/* Bottom shadow */}
      <span className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/25 to-transparent" />
      {/* Inner border highlight */}
      <span className="absolute inset-0 rounded-2xl border border-white/40" />
      <span className="absolute inset-[1px] rounded-[15px] border border-black/20" />
      {/* Specular sheen on hover */}
      <span className="absolute inset-0 overflow-hidden rounded-2xl">
        <span className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] -translate-x-[200%] group-hover:translate-x-[400%] transition-transform duration-700 ease-out" />
      </span>
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
        {children}
      </span>
    </button>
  );
};

export default Home;
