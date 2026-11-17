import { Diagram, d } from './diagram';

/*
 * The OVSRCSC scientific illustration library.
 *
 * Every figure is computed from the physics it shows rather than drawn by
 * eye: ray diagrams obey the thin-lens and Snell equations, the orbit obeys
 * Kepler's equation, field lines follow the dipole relation r = k·sin²θ.
 * Labels are passed in so each figure is translatable; numerals and symbols
 * are universal. Each figure is a server component (pure SVG) and only its
 * draw-on-view wrapper runs on the client.
 */

export interface FigureBase {
  figure?: string;
  caption?: string;
  title: string;
  className?: string;
}

const f = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* Pendulum: length L, amplitude θ, arc of swing                       */
/* ------------------------------------------------------------------ */
export function PendulumFigure({ labels, ...base }: FigureBase & { labels: { length: string; amplitude: string; equilibrium: string } }) {
  const px = 200;
  const py = 30;
  const L = 180;
  const theta = (24 * Math.PI) / 180;
  const bx = px + L * Math.sin(theta);
  const by = py + L * Math.cos(theta);
  const lx = px - L * Math.sin(theta);
  const arcR = 52;
  return (
    <Diagram viewBox="0 0 400 250" {...base}>
      <line x1={140} y1={py} x2={260} y2={py} className="mx-d-ink mx-draw" {...d(0)} />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={146 + i * 18} y1={py} x2={138 + i * 18} y2={py - 8} className="mx-d-faint" />
      ))}
      <line x1={px} y1={py} x2={px} y2={py + L + 12} className="mx-d-faint mx-d-dash mx-draw" {...d(1)} />
      <path d={`M ${f(lx)} ${f(by)} A ${L} ${L} 0 0 0 ${f(bx)} ${f(by)}`} className="mx-d-slate mx-d-dash mx-draw" {...d(2)} />
      <line x1={px} y1={py} x2={f(bx)} y2={f(by)} className="mx-d-ink mx-draw" {...d(3)} />
      <line x1={px} y1={py} x2={f(lx)} y2={f(by)} className="mx-d-faint mx-draw" {...d(3)} />
      <path
        d={`M ${px} ${py + arcR} A ${arcR} ${arcR} 0 0 0 ${f(px + arcR * Math.sin(theta))} ${f(py + arcR * Math.cos(theta))}`}
        className="mx-d-mark mx-draw"
        {...d(4)}
      />
      <circle cx={f(bx)} cy={f(by)} r={11} className="mx-d-fill-ink mx-draw-fade" />
      <circle cx={f(lx)} cy={f(by)} r={11} className="mx-d-faint mx-draw-fade" />
      <circle cx={px} cy={py} r={3} className="mx-d-fill-mark" />
      <text x={px + 14} y={py + arcR + 16} className="mx-d-label-mark">θ</text>
      <text x={f(px + (L / 2) * Math.sin(theta) + 12)} y={f(py + (L / 2) * Math.cos(theta))}>L · {labels.length}</text>
      <text x={px + 6} y={py + L + 26} textAnchor="middle">{labels.equilibrium}</text>
      <text x={f(lx - 14)} y={f(by - 18)} textAnchor="end">{labels.amplitude}</text>
    </Diagram>
  );
}

/* ------------------------------------------------------------------ */
/* Refraction at an air–water boundary (Snell's law)                   */
/* ------------------------------------------------------------------ */
export function RefractionFigure({ labels, ...base }: FigureBase & { labels: { air: string; water: string; normal: string } }) {
  const n1 = 1.0;
  const n2 = 1.33;
  const t1 = (45 * Math.PI) / 180;
  const t2 = Math.asin((n1 * Math.sin(t1)) / n2); // ≈ 32.1°
  const ox = 200;
  const oy = 130;
  const r = 120;
  const ix = ox - r * Math.sin(t1);
  const iy = oy - r * Math.cos(t1);
  const rx = ox + r * Math.sin(t2);
  const ry = oy + r * Math.cos(t2);
  const reflx = ox + r * 0.75 * Math.sin(t1);
  const refly = oy - r * 0.75 * Math.cos(t1);
  const t2deg = Math.round((t2 * 180) / Math.PI);
  return (
    <Diagram viewBox="0 0 400 260" {...base}>
      <rect x={20} y={oy} width={360} height={115} fill="var(--mx-slate)" opacity={0.12} className="mx-draw-fade" />
      <line x1={20} y1={oy} x2={380} y2={oy} className="mx-d-ink mx-draw" {...d(0)} />
      <line x1={ox} y1={10} x2={ox} y2={250} className="mx-d-faint mx-d-dash mx-draw" {...d(1)} />
      <line x1={f(ix)} y1={f(iy)} x2={ox} y2={oy} className="mx-d-mark mx-draw" {...d(2)} />
      <line x1={ox} y1={oy} x2={f(rx)} y2={f(ry)} className="mx-d-mark mx-draw" {...d(3)} />
      <line x1={ox} y1={oy} x2={f(reflx)} y2={f(refly)} className="mx-d-faint mx-draw" {...d(4)} />
      <path d={`M ${ox} ${oy - 40} A 40 40 0 0 0 ${f(ox - 40 * Math.sin(t1))} ${f(oy - 40 * Math.cos(t1))}`} className="mx-d-ink mx-draw" {...d(5)} />
      <path d={`M ${ox} ${oy + 48} A 48 48 0 0 0 ${f(ox + 48 * Math.sin(t2))} ${f(oy + 48 * Math.cos(t2))}`} className="mx-d-ink mx-draw" {...d(5)} />
      <text x={ox - 14} y={oy - 48} textAnchor="end" className="mx-d-label-mark">θ₁ = 45°</text>
      <text x={ox + 18} y={oy + 66} className="mx-d-label-mark">θ₂ ≈ {t2deg}°</text>
      <text x={28} y={oy - 10}>{labels.air} · n = 1.00</text>
      <text x={28} y={oy + 22}>{labels.water} · n = 1.33</text>
      <text x={ox + 6} y={20}>{labels.normal}</text>
      <text x={372} y={250} textAnchor="end">n₁ sin θ₁ = n₂ sin θ₂</text>
    </Diagram>
  );
}

/* ------------------------------------------------------------------ */
/* Convex lens forming a real image (thin-lens equation)               */
/* ------------------------------------------------------------------ */
export function LensFigure({ labels, ...base }: FigureBase & { labels: { object: string; image: string } }) {
  const lens = 200;
  const axis = 120;
  const focal = 60;
  const u = 150; // object distance (beyond 2F)
  const h = 50;
  const v = 1 / (1 / focal - 1 / u); // = 100
  const hi = (-v / u) * h; // inverted, ≈ −33.3
  const ox = lens - u;
  const ix = lens + v;
  const top = axis - h;
  const imgTop = axis - hi;
  // Ray through F on the object side meets the lens at the image height.
  const yAtLens = top + (lens - ox) * ((axis - top) / (lens - focal - ox));
  return (
    <Diagram viewBox="0 0 400 220" {...base}>
      <line x1={20} y1={axis} x2={385} y2={axis} className="mx-d-faint mx-draw" {...d(0)} />
      <path d={`M ${lens} ${axis - 80} Q ${lens + 18} ${axis} ${lens} ${axis + 80} Q ${lens - 18} ${axis} ${lens} ${axis - 80} Z`} className="mx-d-ink mx-draw" {...d(1)} />
      {[lens - 2 * focal, lens - focal, lens + focal, lens + 2 * focal].map((x, i) => (
        <g key={x} className="mx-draw-fade">
          <circle cx={x} cy={axis} r={2.2} className="mx-d-fill-ink" />
          <text x={x} y={axis + 16} textAnchor="middle">{i === 0 || i === 3 ? '2F' : 'F'}</text>
        </g>
      ))}
      <line x1={ox} y1={axis} x2={ox} y2={top} className="mx-d-ink mx-draw" {...d(2)} />
      <polygon points={`${ox - 5},${top + 8} ${ox},${top} ${ox + 5},${top + 8}`} className="mx-d-fill-ink mx-draw-fade" />
      {/* 1 · parallel to the axis, then through F′ */}
      <polyline points={`${ox},${top} ${lens},${top} ${f(ix)},${f(imgTop)}`} className="mx-d-mark mx-draw" {...d(3)} />
      {/* 2 · straight through the optical centre */}
      <line x1={ox} y1={top} x2={f(ix)} y2={f(imgTop)} className="mx-d-slate mx-draw" {...d(4)} />
      {/* 3 · through F, then parallel to the axis */}
      <polyline points={`${ox},${top} ${lens},${f(yAtLens)} ${f(ix)},${f(imgTop)}`} className="mx-d-mark mx-d-dash mx-draw" {...d(5)} />
      <line x1={f(ix)} y1={axis} x2={f(ix)} y2={f(imgTop)} className="mx-d-ink mx-draw" {...d(6)} />
      <polygon points={`${f(ix - 5)},${f(imgTop - 8)} ${f(ix)},${f(imgTop)} ${f(ix + 5)},${f(imgTop - 8)}`} className="mx-d-fill-ink mx-draw-fade" />
      <text x={ox} y={top - 10} textAnchor="middle">{labels.object}</text>
      <text x={f(ix)} y={f(imgTop + 18)} textAnchor="middle">{labels.image}</text>
      <text x={385} y={22} textAnchor="end" className="mx-d-label-mark">1/f = 1/u + 1/v</text>
      <text x={385} y={36} textAnchor="end">f = 6 · u = 15 · v = {Math.round(v / 10)}</text>
    </Diagram>
  );
}

/* ------------------------------------------------------------------ */
/* Kepler's second law: equal areas in equal times                      */
/* ------------------------------------------------------------------ */
function solveKepler(M: number, e: number) {
  let E = M;
  for (let i = 0; i < 12; i += 1) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

export function KeplerFigure({ labels, ...base }: FigureBase & { labels: { perihelion: string; aphelion: string; equalAreas: string; eccentricity: string } }) {
  const cx = 200;
  const cy = 160;
  const a = 150;
  const e = 0.5;
  const b = a * Math.sqrt(1 - e * e);
  const fx = cx + a * e; // Sun at the focus nearer perihelion (+x)
  const point = (M: number) => {
    const E = solveKepler(M, e);
    return [cx + a * Math.cos(E), cy - b * Math.sin(E)] as const;
  };
  const sector = (m0: number, m1: number) => {
    const steps = 18;
    const pts = Array.from({ length: steps + 1 }, (_, i) => point(m0 + ((m1 - m0) * i) / steps));
    return `M ${f(fx)} ${cy} ${pts.map(([x, y]) => `L ${f(x)} ${f(y)}`).join(' ')} Z`;
  };
  const dM = 0.42; // the same time interval at both ends of the orbit
  return (
    <Diagram viewBox="0 0 400 330" {...base}>
      <ellipse cx={cx} cy={cy} rx={a} ry={f(b)} className="mx-d-ink mx-draw" {...d(0)} />
      <line x1={cx - a} y1={cy} x2={cx + a} y2={cy} className="mx-d-faint mx-d-dash mx-draw" {...d(1)} />
      <path d={sector(-dM / 2, dM / 2)} fill="var(--mx-brass)" opacity={0.28} className="mx-draw-fade" />
      <path d={sector(Math.PI - dM / 2, Math.PI + dM / 2)} fill="var(--mx-brass)" opacity={0.28} className="mx-draw-fade" />
      <path d={sector(-dM / 2, dM / 2)} className="mx-d-mark mx-draw" {...d(2)} />
      <path d={sector(Math.PI - dM / 2, Math.PI + dM / 2)} className="mx-d-mark mx-draw" {...d(3)} />
      <circle cx={f(fx)} cy={cy} r={9} fill="var(--mx-brass)" className="mx-draw-fade" />
      <circle cx={f(cx - a * e)} cy={cy} r={2} className="mx-d-faint" />
      <circle cx={cx + a} cy={cy} r={4.5} className="mx-d-fill-ink mx-draw-fade" />
      <text x={cx + a} y={cy + 66} textAnchor="end">{labels.perihelion}</text>
      <text x={cx - a} y={cy + 50}>{labels.aphelion}</text>
      <text x={cx} y={14} textAnchor="middle" className="mx-d-label-mark">{labels.equalAreas}</text>
      <text x={cx} y={324} textAnchor="middle">{labels.eccentricity}</text>
    </Diagram>
  );
}

/* ------------------------------------------------------------------ */
/* Bar magnet: dipole field lines r = k·sin²θ                           */
/* ------------------------------------------------------------------ */
export function MagnetFigure(base: FigureBase) {
  const cx = 200;
  const cy = 125;
  const lines = [44, 66, 96, 136, 190];
  const curve = (k: number, sign: 1 | -1) => {
    const pts: string[] = [];
    for (let i = 4; i <= 176; i += 2) {
      const t = (i * Math.PI) / 180;
      const r = k * Math.sin(t) ** 2;
      const x = cx + r * Math.cos(t);
      const y = cy - sign * r * Math.sin(t);
      pts.push(`${pts.length ? 'L' : 'M'} ${f(x)} ${f(y)}`);
    }
    return pts.join(' ');
  };
  return (
    <Diagram viewBox="0 0 400 250" {...base}>
      {lines.map((k, i) => (
        <g key={k}>
          <path d={curve(k, 1)} className="mx-d-ink mx-draw" {...d(i)} />
          <path d={curve(k, -1)} className="mx-d-ink mx-draw" {...d(i)} />
          {/* Apex arrows: outside the magnet the field runs from N (right) to S (left). */}
          <polygon
            points={`${cx - 5},${f(cy - k)} ${cx + 4},${f(cy - k - 4)} ${cx + 4},${f(cy - k + 4)}`}
            className="mx-d-fill-mark mx-draw-fade"
          />
          <polygon
            points={`${cx - 5},${f(cy + k)} ${cx + 4},${f(cy + k - 4)} ${cx + 4},${f(cy + k + 4)}`}
            className="mx-d-fill-mark mx-draw-fade"
          />
        </g>
      ))}
      <rect x={cx - 34} y={cy - 9} width={34} height={18} fill="var(--mx-slate)" className="mx-draw-fade" />
      <rect x={cx} y={cy - 9} width={34} height={18} fill="var(--mx-brass)" className="mx-draw-fade" />
      <text x={cx - 17} y={cy + 3.5} textAnchor="middle" style={{ fill: 'var(--mx-ivory)' }}>S</text>
      <text x={cx + 17} y={cy + 3.5} textAnchor="middle" style={{ fill: 'var(--mx-charcoal)' }}>N</text>
    </Diagram>
  );
}

/* ------------------------------------------------------------------ */
/* Wave: wavelength λ and amplitude A                                   */
/* ------------------------------------------------------------------ */
export function WaveFigure({ labels, ...base }: FigureBase & { labels: { wavelength: string; amplitude: string } }) {
  const x0 = 20;
  const lambda = 150;
  const A = 46;
  const cy = 110;
  const pts: string[] = [];
  for (let x = 0; x <= 360; x += 3) {
    pts.push(`${pts.length ? 'L' : 'M'} ${x0 + x} ${f(cy - A * Math.sin((2 * Math.PI * x) / lambda))}`);
  }
  const crest1 = x0 + lambda / 4;
  const crest2 = crest1 + lambda;
  return (
    <Diagram viewBox="0 0 400 210" {...base}>
      <line x1={x0} y1={cy} x2={384} y2={cy} className="mx-d-faint mx-d-dash mx-draw" {...d(0)} />
      <path d={pts.join(' ')} className="mx-d-ink mx-draw" {...d(1)} />
      <line x1={crest1} y1={cy - A - 18} x2={crest2} y2={cy - A - 18} className="mx-d-mark mx-draw" {...d(2)} />
      <line x1={crest1} y1={cy - A - 24} x2={crest1} y2={cy - A - 4} className="mx-d-mark" />
      <line x1={crest2} y1={cy - A - 24} x2={crest2} y2={cy - A - 4} className="mx-d-mark" />
      <line x1={crest2 + 34} y1={cy} x2={crest2 + 34} y2={cy - A} className="mx-d-mark mx-draw" {...d(3)} />
      <text x={(crest1 + crest2) / 2} y={cy - A - 26} textAnchor="middle" className="mx-d-label-mark">λ · {labels.wavelength}</text>
      <text x={crest2 + 40} y={cy - A / 2 + 4} className="mx-d-label-mark">A</text>
      <text x={crest2 + 40} y={cy - A / 2 + 18}>{labels.amplitude}</text>
      <text x={384} y={200} textAnchor="end">y = A sin(2πx / λ)</text>
    </Diagram>
  );
}

/* ------------------------------------------------------------------ */
/* pH scale                                                             */
/* ------------------------------------------------------------------ */
export function PhFigure({ labels, ...base }: FigureBase & { labels: { acidic: string; neutral: string; basic: string; water: string } }) {
  const x0 = 30;
  const w = 340;
  const y = 110;
  const step = w / 14;
  return (
    <Diagram viewBox="0 0 400 190" {...base}>
      <rect x={x0} y={y - 14} width={step * 7} height={14} fill="var(--mx-brass)" opacity={0.55} className="mx-draw-fade" />
      <rect x={x0 + step * 7} y={y - 14} width={step * 7} height={14} fill="var(--mx-slate)" opacity={0.6} className="mx-draw-fade" />
      <line x1={x0} y1={y} x2={x0 + w} y2={y} className="mx-d-ink mx-draw" {...d(0)} />
      {Array.from({ length: 15 }, (_, i) => (
        <g key={i}>
          <line x1={x0 + i * step} y1={y} x2={x0 + i * step} y2={y + (i % 7 === 0 ? 12 : 7)} className="mx-d-ink" />
          <text x={x0 + i * step} y={y + 26} textAnchor="middle">{i}</text>
        </g>
      ))}
      <line x1={x0 + 7 * step} y1={y - 44} x2={x0 + 7 * step} y2={y - 16} className="mx-d-mark mx-draw" {...d(1)} />
      <text x={x0 + 7 * step} y={y - 50} textAnchor="middle" className="mx-d-label-mark">{labels.neutral} · {labels.water}</text>
      <text x={x0} y={y + 52}>← {labels.acidic}</text>
      <text x={x0 + w} y={y + 52} textAnchor="end">{labels.basic} →</text>
      <text x={x0 + w} y={30} textAnchor="end">pH = −log₁₀[H⁺]</text>
    </Diagram>
  );
}

/* ------------------------------------------------------------------ */
/* A plant cell (schematic)                                             */
/* ------------------------------------------------------------------ */
export function CellFigure({ labels, ...base }: FigureBase & { labels: { wall: string; membrane: string; nucleus: string; vacuole: string; chloroplast: string } }) {
  return (
    <Diagram viewBox="0 0 400 250" {...base}>
      <rect x={70} y={30} width={200} height={190} rx={14} className="mx-d-ink mx-draw" {...d(0)} />
      <rect x={78} y={38} width={184} height={174} rx={10} className="mx-d-slate mx-draw" {...d(1)} />
      <path d="M 120 80 C 160 60 230 70 236 120 C 242 170 190 196 140 186 C 100 178 92 104 120 80 Z" fill="var(--mx-slate)" opacity={0.14} className="mx-d-faint mx-draw" {...d(2)} />
      <circle cx={112} cy={180} r={20} className="mx-d-ink mx-draw" {...d(3)} />
      <circle cx={108} cy={176} r={6} className="mx-d-fill-ink mx-draw-fade" />
      {[
        [100, 62, -20],
        [238, 64, 30],
        [244, 182, -10],
        [176, 200, 10],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={13} ry={7} transform={`rotate(${r} ${x} ${y})`} fill="var(--mx-slate)" opacity={0.7} className="mx-draw-fade" />
      ))}
      {[
        [270, 40, labels.wall],
        [262, 96, labels.membrane],
        [210, 130, labels.vacuole],
        [252, 64, labels.chloroplast],
        [132, 180, labels.nucleus],
      ].map(([x, y, text], i) => (
        <g key={i}>
          <line x1={x as number} y1={y as number} x2={300} y2={(y as number) + (i === 4 ? 30 : 0)} className="mx-d-mark mx-draw" {...d(4 + i)} />
          <text x={306} y={(y as number) + (i === 4 ? 33 : 3)}>{text}</text>
        </g>
      ))}
    </Diagram>
  );
}

/* ------------------------------------------------------------------ */
/* Pythagoras: 3² + 4² = 5²                                             */
/* ------------------------------------------------------------------ */
export function PythagorasFigure(base: FigureBase) {
  const u = 22;
  const A = [150, 150] as const; // right angle
  const B = [A[0] + 4 * u, A[1]] as const;
  const C = [A[0], A[1] - 3 * u] as const;
  // Outward normal of BC (away from A) is (3, −4)·u
  const C2 = [C[0] + 3 * u, C[1] - 4 * u] as const;
  const B2 = [B[0] + 3 * u, B[1] - 4 * u] as const;
  const pts = (p: ReadonlyArray<readonly [number, number]>) => p.map((q) => q.join(',')).join(' ');
  const grid = (cells: number, ox: number, oy: number) =>
    Array.from({ length: cells - 1 }, (_, i) => [
      <line key={`h${i}`} x1={ox} y1={oy + (i + 1) * u} x2={ox + cells * u} y2={oy + (i + 1) * u} className="mx-d-faint" />,
      <line key={`v${i}`} x1={ox + (i + 1) * u} y1={oy} x2={ox + (i + 1) * u} y2={oy + cells * u} className="mx-d-faint" />,
    ]);
  return (
    <Diagram viewBox="0 0 400 280" {...base}>
      <g className="mx-draw-fade">{grid(4, A[0], A[1])}</g>
      <g className="mx-draw-fade">{grid(3, A[0] - 3 * u, A[1] - 3 * u)}</g>
      <polygon points={pts([A, B, [B[0], B[1] + 4 * u], [A[0], A[1] + 4 * u]])} className="mx-d-slate mx-draw" {...d(1)} />
      <polygon points={pts([A, C, [C[0] - 3 * u, C[1]], [A[0] - 3 * u, A[1]]])} className="mx-d-slate mx-draw" {...d(2)} />
      <polygon points={pts([B, C, C2, B2])} fill="var(--mx-brass)" fillOpacity={0.14} className="mx-d-mark mx-draw" {...d(3)} />
      <polygon points={pts([A, B, C])} className="mx-d-ink mx-draw" {...d(0)} />
      <polyline points={`${A[0] + 10},${A[1]} ${A[0] + 10},${A[1] - 10} ${A[0]},${A[1] - 10}`} className="mx-d-ink" />
      <text x={A[0] + 2 * u} y={A[1] + 2 * u + 4} textAnchor="middle">4² = 16</text>
      <text x={A[0] - 1.5 * u} y={A[1] - 1.5 * u + 4} textAnchor="middle">3² = 9</text>
      <text x={f((B[0] + C2[0]) / 2)} y={f((B[1] + C2[1]) / 2 + 4)} textAnchor="middle" className="mx-d-label-mark">5² = 25</text>
      <text x={392} y={272} textAnchor="end" className="mx-d-label-mark">9 + 16 = 25</text>
    </Diagram>
  );
}

/* ------------------------------------------------------------------ */
/* AND gate with its truth table                                        */
/* ------------------------------------------------------------------ */
export function LogicGateFigure({ labels, ...base }: FigureBase & { labels: { inputs: string; output: string } }) {
  const rows: Array<[number, number]> = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ];
  return (
    <Diagram viewBox="0 0 400 200" {...base}>
      <path d="M 70 50 L 120 50 A 50 50 0 0 1 120 150 L 70 150 Z" className="mx-d-ink mx-draw" {...d(0)} />
      <line x1={20} y1={75} x2={70} y2={75} className="mx-d-mark mx-draw" {...d(1)} />
      <line x1={20} y1={125} x2={70} y2={125} className="mx-d-mark mx-draw" {...d(1)} />
      <line x1={170} y1={100} x2={210} y2={100} className="mx-d-mark mx-draw" {...d(2)} />
      <text x={16} y={71} textAnchor="end">A</text>
      <text x={16} y={121} textAnchor="end">B</text>
      <text x={214} y={104}>Q</text>
      <text x={110} y={104} textAnchor="middle">AND</text>
      <text x={20} y={180}>{labels.inputs}: A, B · {labels.output}: Q = A·B</text>
      <g className="mx-draw-fade">
        <line x1={258} y1={42} x2={380} y2={42} className="mx-d-ink" />
        <text x={276} y={34} textAnchor="middle">A</text>
        <text x={316} y={34} textAnchor="middle">B</text>
        <text x={360} y={34} textAnchor="middle" className="mx-d-label-mark">Q</text>
        {rows.map(([a, b], i) => (
          <g key={i}>
            <text x={276} y={62 + i * 22} textAnchor="middle">{a}</text>
            <text x={316} y={62 + i * 22} textAnchor="middle">{b}</text>
            <text x={360} y={62 + i * 22} textAnchor="middle" className="mx-d-label-mark">{a & b}</text>
          </g>
        ))}
        <line x1={338} y1={46} x2={338} y2={134} className="mx-d-faint" />
      </g>
    </Diagram>
  );
}

/* ------------------------------------------------------------------ */
/* Newtonian reflector light path                                       */
/* ------------------------------------------------------------------ */
export function NewtonianFigure({ labels, ...base }: FigureBase & { labels: { primary: string; secondary: string; eyepiece: string; light: string } }) {
  /*
   * Tube along x (open end left), concave primary at x = 350, focal point
   * on the axis at x = 50. A flat secondary on the line y = x + 10 (45°)
   * intercepts the converging cone and folds the focus up to (90, 60),
   * where the eyepiece sits. Intersection points are solved exactly.
   */
  const hit = (y0: number) => {
    // Ray from (350, y0) toward (50, 100): y = y0 + (100 − y0)(350 − x)/300
    const k = (100 - y0) / 300;
    const x = (y0 + k * 350 - 10) / (1 + k);
    return [x, x + 10] as const;
  };
  const r1 = hit(75);
  const r2 = hit(125);
  return (
    <Diagram viewBox="0 0 400 190" {...base}>
      <rect x={40} y={60} width={320} height={80} className="mx-d-faint mx-draw" {...d(0)} />
      <line x1={78} y1={60} x2={78} y2={30} className="mx-d-ink mx-draw" {...d(1)} />
      <line x1={102} y1={60} x2={102} y2={30} className="mx-d-ink mx-draw" {...d(1)} />
      <path d="M 352 62 Q 336 100 352 138" className="mx-d-ink mx-draw" {...d(2)} style={{ ['--i' as string]: 2, strokeWidth: 3 }} />
      <line x1={80} y1={90} x2={104} y2={114} className="mx-d-ink mx-draw" {...d(3)} style={{ ['--i' as string]: 3, strokeWidth: 3 }} />
      {/* incoming parallel light */}
      <line x1={0} y1={75} x2={345} y2={75} className="mx-d-mark mx-draw" {...d(4)} />
      <line x1={0} y1={125} x2={345} y2={125} className="mx-d-mark mx-draw" {...d(4)} />
      {/* converging after the primary, folded by the secondary */}
      <polyline points={`345,75 ${f(r1[0])},${f(r1[1])} 90,60 90,40`} className="mx-d-mark mx-draw" {...d(5)} />
      <polyline points={`345,125 ${f(r2[0])},${f(r2[1])} 90,60 90,40`} className="mx-d-mark mx-draw" {...d(5)} />
      <circle cx={90} cy={60} r={2.5} className="mx-d-fill-ink mx-draw-fade" />
      <text x={4} y={52}>{labels.light} →</text>
      <text x={110} y={36}>{labels.eyepiece}</text>
      <line x1={70} y1={164} x2={90} y2={110} className="mx-d-faint" />
      <text x={40} y={178}>{labels.secondary}</text>
      <line x1={330} y1={164} x2={346} y2={132} className="mx-d-faint" />
      <text x={372} y={178} textAnchor="end">{labels.primary}</text>
    </Diagram>
  );
}
