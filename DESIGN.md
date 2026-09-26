# FitKit Tracker — Design Brief

## Purpose & Tone
Dark fitness performance tracker for cycling enthusiasts. Premium tech aesthetic with brutalist precision. Every metric is a performance statement. High contrast, data-centric, built for athletes who track obsessively.

## Color Palette
| Role | OKLCH | Hex Approx | Usage |
|------|-------|-----------|-------|
| Accent (Cyan) | 0.78 0.22 115 | ~B0E0E6 | Metrics, CTAs, highlights |
| Primary (Blue) | 0.65 0.25 185 | ~4A90FF | Links, active states |
| Success (Teal) | 0.72 0.22 142 | ~5EDCC6 | Hydration goals, achievements |
| Warning (Orange) | 0.78 0.2 70 | ~FFB347 | Intensity zones, resistance |
| Destructive (Red) | 0.65 0.19 22 | ~FF4D4D | Stop, delete, warnings |
| Neutral Dark | 0.16 0.015 280 | ~1A1F2E | Card backgrounds |
| Neutral Darkest | 0.125 0.012 280 | ~0F1219 | Page background |
| Text Primary | 0.94 0.008 280 | ~F0F1F5 | Body copy |
| Text Secondary | 0.55 0.012 280 | ~8B90A8 | Captions, timestamps |

## Typography
- Display: **Space Grotesk** (600–700 weight) — metric values, headings
- Body: **DM Sans** (400–600 weight) — cards, labels, descriptions
- Mono: **Geist Mono** (400–500 weight) — lap times, precision values

## Structural Zones
| Zone | Background | Elevation | Purpose |
|------|------------|-----------|----------|
| Navigation tabs | `bg-card` + `border-b border-border/50` | Subtle | Period selector (Week/Month/Year) |
| Stat cards grid | `bg-card` + `border border-border/50` | Card | Distance, time, calories, avg speed |
| Charts section | `bg-background` | Flat | 7-day bar chart, calendar heatmap |
| Hydration panel | `bg-card/50` + accent border | Subtle | Daily goal, quick-add buttons, progress |
| HR connection | `bg-card` + accent glow | Card | boAt watch pairing, live BPM display |
| Footer (history) | `bg-background` | Flat | Ride history, export stub |

## Spacing & Density
Tight vertical rhythm: 4px baseline grid. Card padding 16px, gap 12px. Stat values 28–32px, labels 10–12px. One-column mobile, 2–3 columns desktop.

## Components & Patterns
- **Stat cards**: dark bg, cyan metric, subtle border, no shadow
- **Tabs**: underline active, muted text inactive
- **Progress bars**: `bg-muted/30` track, `bg-accent` fill, label overlay
- **Chart bars**: chart-1 default, chart-2/3/4 variance, hover → accent
- **Hydration badges**: `bg-accent/10` with outline, green/amber/red on completion
- **HR live**: Large cyan number, pulsing glow, boAt icon, connection status
- **Calendar heatmap**: grid of 7×4 (28 days), intensity via `bg-accent/10` to `bg-accent/100`

## Motion & Micro-interactions
- Stat value entry: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- Hydration quick-add: scale 0.98 → 1.0 on press, 0.2s
- Chart bars: 0.2s ease-out on hover
- HR pulse: continuous 2s pulse-glow loop while connected
- Tab switch: cross-fade 0.15s, no rotation

## Signature Detail
**Metric glow**: Cyan text-shadow on all primary metric values (speed, distance, HR, calories). Creates data-forward visual hierarchy without gradients or garish effects. Reinforces premium tech aesthetic.

## Constraints
- No full-page gradients, no neon shadows, no blur/glassmorphism
- Accent used sparingly: metrics, CTAs, active states only
- Typography: no font-weights beyond 700, no custom line-heights
- Shadows: none on cards; subtle border emphasis instead
- Animations: easing only, no bounce or elastic
- Dark mode forced (color-scheme: dark)
