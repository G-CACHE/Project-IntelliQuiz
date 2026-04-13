import React, { useEffect, useRef, useState } from 'react';
import { Target, Crown, TrendingUp, Zap, Sparkles, Trophy, Medal, Award, Flame, Star } from 'lucide-react';
import type { RankingEntry } from '../../services/api';

interface ScoreboardDisplayProps {
  rankings: RankingEntry[];
  highlightTeamId?: number;
  isFinal?: boolean;
  title?: string;
}

// ======== CANVAS PARTICLE BACKGROUND ========
const ParticleCanvas: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    type Particle = {
      x: number; y: number; r: number; dx: number; dy: number;
      color: string; alpha: number; decay: number; shape: 'circle' | 'star' | 'diamond';
    };
    const particles: Particle[] = [];
    const colors = ['#d4af37', '#f59e0b', '#fbbf24', '#fde68a', '#7a1733', '#e11d48', '#f472b6'];

    const drawStar = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.4;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        ctx.lineTo(cx + rad * Math.cos(angle), cy + rad * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    };

    const drawDiamond = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.6, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r * 0.6, cy);
      ctx.closePath();
      ctx.fill();
    };

    for (let i = 0; i < 50; i++) {
      const shapes: Particle['shape'][] = ['circle', 'star', 'diamond'];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 3.5 + 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: -(Math.random() * 0.3 + 0.1),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.45 + 0.1,
        decay: 0.0015 + Math.random() * 0.003,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    let id = 0;
    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.shape === 'star') drawStar(p.x, p.y, p.r);
        else if (p.shape === 'diamond') drawDiamond(p.x, p.y, p.r);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }

        p.x += p.dx; p.y += p.dy; p.alpha -= p.decay;
        if (p.alpha <= 0) { p.x = Math.random() * width; p.y = height + 5; p.alpha = Math.random() * 0.45 + 0.1; }
        if (p.x < 0 || p.x > width) p.dx *= -1;
      });
      ctx.globalAlpha = 1;
      id = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(id);
  }, [width, height]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, width: '100%', height: '100%' }} />;
};

// ======== SVG STAR ========
const SvgStar: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#d4af37' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
  </svg>
);

// ======== RANK ICONS (pure Lucide, no emoji) ========
const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown size={20} strokeWidth={2.5} />;
  if (rank === 2) return <Trophy size={18} strokeWidth={2.5} />;
  if (rank === 3) return <Medal size={18} strokeWidth={2.5} />;
  if (rank <= 5) return <Award size={16} strokeWidth={2} />;
  return <Star size={14} strokeWidth={2} />;
};

// ======== RANK NUMBER + ACCENT ICON ========
const RANK_META: Record<number, {
  bg: string; rowBg: string; border: string; text: string;
  glow: string; barColor: string; iconColor: string; accent: string;
}> = {
  1: {
    bg: 'linear-gradient(135deg, #fbbf24, #d4af37, #b8860b)',
    rowBg: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 40%, #fbbf24 100%)',
    border: '#d4af37', text: '#78350f', glow: '0 6px 28px rgba(212,175,55,0.4)',
    barColor: '#d4af37', iconColor: '#78350f', accent: '#fef3c7',
  },
  2: {
    bg: 'linear-gradient(135deg, #d1d5db, #9ca3af, #6b7280)',
    rowBg: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 40%, #e5e7eb 100%)',
    border: '#9ca3af', text: '#1f2937', glow: '0 4px 20px rgba(107,114,128,0.25)',
    barColor: '#6b7280', iconColor: '#374151', accent: '#f3f4f6',
  },
  3: {
    bg: 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)',
    rowBg: 'linear-gradient(135deg, #fffbeb 0%, #fde68a 40%, #fdba74 100%)',
    border: '#d97706', text: '#78350f', glow: '0 4px 20px rgba(217,119,6,0.3)',
    barColor: '#d97706', iconColor: '#78350f', accent: '#fef3c7',
  },
};

const DEFAULT_META = {
  bg: 'linear-gradient(135deg, #9ca3af, #6b7280)',
  rowBg: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: 'rgba(122,23,51,0.1)', text: '#374151', glow: '0 2px 10px rgba(0,0,0,0.04)',
  barColor: '#7a1733', iconColor: '#6b7280', accent: '#f8fafc',
};

const AVATAR_COLORS = [
  'linear-gradient(135deg, #7a1733, #e11d48)', 'linear-gradient(135deg, #1e40af, #3b82f6)',
  'linear-gradient(135deg, #065f46, #10b981)', 'linear-gradient(135deg, #6d28d9, #a78bfa)',
  'linear-gradient(135deg, #9a3412, #f97316)', 'linear-gradient(135deg, #be185d, #f472b6)',
  'linear-gradient(135deg, #0e7490, #22d3ee)',
];

// ======== MAIN COMPONENT ========
const ScoreboardDisplay: React.FC<ScoreboardDisplayProps> = ({
  rankings, highlightTeamId, isFinal = false, title,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapSize, setWrapSize] = useState({ w: 900, h: 600 });
  const [scores, setScores] = useState<Record<number, number>>({});
  const prevRef = useRef<Record<number, number>>({});

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setWrapSize({ w: e.contentRect.width, h: e.contentRect.height }));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Animated score count-up with ease-out
  useEffect(() => {
    const steps = 28; let step = 0;
    const timer = setInterval(() => {
      step++;
      const t = 1 - Math.pow(1 - step / steps, 3);
      const cur: Record<number, number> = {};
      rankings.forEach(r => { cur[r.teamId] = Math.round((prevRef.current[r.teamId] ?? 0) + (r.score - (prevRef.current[r.teamId] ?? 0)) * t); });
      setScores(cur);
      if (step >= steps) { clearInterval(timer); const f: Record<number, number> = {}; rankings.forEach(r => { f[r.teamId] = r.score; }); prevRef.current = f; }
    }, 22);
    return () => clearInterval(timer);
  }, [rankings]);

  const initials = (n: string) => { const w = n.trim().split(/\s+/).filter(Boolean); return !w.length ? '?' : w.length === 1 ? w[0].slice(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase(); };

  const ranked = rankings.map((t, i) => {
    let r = 1;
    for (let j = 0; j < i; j++) {
      if (rankings[j].score > t.score) r = j + 2;
      else if (rankings[j].score === t.score) r = rankings[j].rank || j + 1;
    }
    return { ...t, displayRank: t.rank || r };
  });

  const maxScore = Math.max(...rankings.map(r => r.score), 1);

  if (!rankings.length) {
    return (
      <div style={S.empty}>
        <Crown size={52} color="#d4af37" />
        <p style={S.emptyTitle}>No Scores Yet</p>
        <p style={S.emptySub}>Waiting for participants...</p>
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={S.wrap}>
      {isFinal && <ParticleCanvas width={wrapSize.w} height={wrapSize.h} />}

      {/* ===== BANNER ===== */}
      <div style={S.bannerWrap}>
        {/* Left arrow */}
        <svg width="28" height="56" viewBox="0 0 28 56" style={{ flexShrink: 0 }}>
          <polygon points="28,0 28,56 0,28" fill="#3a0a16" />
          <polygon points="28,4 28,52 4,28" fill="#4a0c1e" />
        </svg>
        <div style={S.banner}>
          <Sparkles size={18} color="#fde68a" />
          {isFinal ? <Crown size={22} color="#fde68a" /> : <TrendingUp size={22} color="#fde68a" />}
          <h2 style={S.bannerText}>{title ?? (isFinal ? 'Final Results' : 'Ranking')}</h2>
          <Sparkles size={18} color="#fde68a" />
        </div>
        {/* Right arrow */}
        <svg width="28" height="56" viewBox="0 0 28 56" style={{ flexShrink: 0 }}>
          <polygon points="0,0 0,56 28,28" fill="#3a0a16" />
          <polygon points="0,4 0,52 24,28" fill="#4a0c1e" />
        </svg>
      </div>

      {!isFinal && (
        <div style={S.liveWrap}>
          <div style={S.liveBadge}><Zap size={11} /><span>LIVE</span></div>
        </div>
      )}

      {/* ===== ROWS ===== */}
      <div style={S.list}>
        {ranked.map((entry, idx) => {
          const isTop = entry.displayRank <= 3;
          const isHi = entry.teamId === highlightTeamId;
          const m = isTop ? RANK_META[entry.displayRank] : DEFAULT_META;
          const ds = scores[entry.teamId] ?? entry.score;
          const pct = maxScore > 0 ? (ds / maxScore) * 100 : 0;

          return (
            <div
              key={entry.teamId}
              style={{
                ...S.row,
                background: m.rowBg,
                border: `2.5px solid ${isHi ? '#7a1733' : m.border}`,
                boxShadow: isHi ? `0 0 0 4px rgba(122,23,51,0.12), ${m.glow}` : m.glow,
                animationDelay: `${idx * 70}ms`,
              }}
            >
              {/* === RANK BADGE === */}
              <div style={{
                ...S.rankOuter,
                background: m.bg,
                boxShadow: isTop ? `0 4px 18px ${m.border}55` : '0 2px 8px rgba(0,0,0,0.12)',
              }}>
                <div style={S.rankIcon}>{getRankIcon(entry.displayRank)}</div>
                <span style={S.rankNum}>{entry.displayRank}</span>
              </div>

              {/* === AVATAR === */}
              <div style={{
                ...S.avatar,
                background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                boxShadow: `0 4px 14px ${m.border}33`,
              }}>
                {initials(entry.teamName)}
              </div>

              {/* === TEAM INFO === */}
              <div style={S.info}>
                <div style={S.nameRow}>
                  <span style={{ ...S.name, color: m.text }}>{entry.teamName}</span>
                  {isHi && <span style={S.you}><Target size={10} /> You</span>}
                  {isTop && entry.displayRank === 1 && <Flame size={16} color="#ef4444" style={{ marginLeft: 4, animation: 'scoreFlicker 0.8s ease-in-out infinite alternate' }} />}
                </div>
                {/* Progress bar */}
                <div style={S.track}>
                  <div style={{
                    ...S.fill,
                    width: `${Math.max(pct, 6)}%`,
                    background: `linear-gradient(90deg, ${m.barColor}88, ${m.barColor})`,
                  }} />
                  <div style={S.shimmer} />
                </div>
              </div>

              {/* === SCORE === */}
              <div style={{ ...S.chip, borderColor: m.border + '44', background: m.accent }}>
                <SvgStar size={16} color={isTop ? m.barColor : '#d4af37'} />
                <span style={{ ...S.chipVal, color: m.text }}>{ds}</span>
                <span style={S.chipUnit}>pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {isFinal && (
        <div style={S.footer}>
          <Sparkles size={14} color="#fde68a" />
          <span style={S.footerTxt}>Congratulations to all participants!</span>
          <Sparkles size={14} color="#fde68a" />
        </div>
      )}
    </div>
  );
};

// ==================== STYLES ====================
const S: Record<string, React.CSSProperties> = {
  wrap: {
    fontFamily: "'Montserrat', sans-serif",
    width: '100%',
    maxWidth: '960px',
    margin: '0 auto',
    padding: '0 0 24px',
    position: 'relative',
    overflow: 'hidden',
  },

  // Banner
  bannerWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '6px', position: 'relative', zIndex: 1 },
  banner: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 44px',
    background: 'linear-gradient(135deg, #4a0c1e 0%, #7a1733 40%, #9f2346 100%)',
    boxShadow: '0 8px 32px rgba(74,12,30,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    border: '2px solid rgba(212,175,55,0.4)',
  },
  bannerText: {
    margin: 0, fontSize: '22px', fontWeight: 900, color: '#fde68a',
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },

  // Live
  liveWrap: { display: 'flex', justifyContent: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 },
  liveBadge: {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '5px 14px', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    borderRadius: '9999px', color: '#fff', fontSize: '10px', fontWeight: 900,
    letterSpacing: '0.12em', boxShadow: '0 4px 16px rgba(239,68,68,0.5)',
    animation: 'scoreLivePulse 2s ease-in-out infinite',
  },

  // List
  list: { display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 },

  // Row
  row: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '16px 24px', borderRadius: '18px',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    animation: 'scoreSlideIn 0.45s cubic-bezier(0.4,0,0.2,1) both',
    cursor: 'default', position: 'relative', overflow: 'hidden',
  },

  // Rank
  rankOuter: {
    width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '1px', position: 'relative', overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.25)',
  },
  rankIcon: { display: 'flex', color: 'rgba(255,255,255,0.9)', lineHeight: 0 },
  rankNum: {
    fontSize: '14px', fontWeight: 900, color: '#fff', lineHeight: 1,
    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },

  // Avatar
  avatar: {
    width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 900, fontSize: '17px', color: '#fff',
    border: '3px solid rgba(255,255,255,0.6)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
  },

  // Info
  info: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  nameRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  name: { fontWeight: 800, fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  you: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    padding: '2px 9px', background: 'linear-gradient(135deg, #7a1733, #e11d48)',
    color: '#fff', borderRadius: '9999px', fontSize: '9px', fontWeight: 800,
    letterSpacing: '0.06em', flexShrink: 0, boxShadow: '0 2px 8px rgba(122,23,51,0.3)',
  },

  // Progress
  track: {
    height: '10px', background: 'rgba(255,255,255,0.55)', borderRadius: '9999px',
    overflow: 'hidden', position: 'relative', border: '1px solid rgba(0,0,0,0.04)',
  },
  fill: {
    height: '100%', borderRadius: '9999px',
    transition: 'width 0.85s cubic-bezier(0.34,1.56,0.64,1)',
    position: 'relative', zIndex: 1,
  },
  shimmer: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
    animation: 'scoreShimmer 2s linear infinite', zIndex: 2,
  },

  // Score chip
  chip: {
    display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
    padding: '10px 18px', borderRadius: '14px',
    border: '2px solid', backdropFilter: 'blur(6px)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  chipVal: { fontWeight: 900, fontSize: '24px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  chipUnit: { fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },

  // Empty
  empty: {
    textAlign: 'center', padding: '60px 24px',
    background: 'linear-gradient(135deg, #fffbf0, #fff)', borderRadius: '24px',
    border: '2px solid rgba(212,175,55,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
    fontFamily: "'Montserrat', sans-serif",
  },
  emptyTitle: { fontSize: '20px', fontWeight: 800, color: '#1f2937', margin: '16px 0 6px' },
  emptySub: { fontSize: '14px', color: '#9ca3af', margin: 0 },

  // Footer
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    marginTop: '24px', padding: '14px 24px',
    background: 'linear-gradient(135deg, #4a0c1e, #7a1733)', borderRadius: '14px',
    border: '2px solid rgba(212,175,55,0.25)', boxShadow: '0 4px 20px rgba(74,12,30,0.2)',
    position: 'relative', zIndex: 1,
  },
  footerTxt: { fontWeight: 700, fontSize: '14px', color: '#fde68a', letterSpacing: '0.02em' },
};

// ==================== KEYFRAMES ====================
const kfId = 'scoreboard-v3-kf';
if (typeof document !== 'undefined' && !document.getElementById(kfId)) {
  const el = document.createElement('style');
  el.id = kfId;
  el.textContent = `
    @keyframes scoreSlideIn {
      0% { opacity: 0; transform: translateX(-20px) scale(0.97); }
      100% { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes scoreLivePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.06); }
    }
    @keyframes scoreShimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    @keyframes scoreFlicker {
      0% { transform: scale(1) rotate(-4deg); opacity: 0.8; }
      100% { transform: scale(1.15) rotate(4deg); opacity: 1; }
    }
  `;
  document.head.appendChild(el);
}

export default ScoreboardDisplay;
