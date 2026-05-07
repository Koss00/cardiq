'use client';

// ── Player proportion database ─────────────────────────────────────────────
// [heightScale, buildScale]  1.0 = average. Height stretches figure vertically,
// build stretches horizontally. Unknown players fall back to a name-hash.
const PLAYER_DB: Record<string, [number, number]> = {
  // Basketball
  'Victor Wembanyama':     [1.28, 0.68],
  'LeBron James':          [1.18, 1.22],
  'Giannis Antetokounmpo': [1.24, 1.05],
  'Kevin Durant':          [1.22, 0.84],
  'Joel Embiid':           [1.20, 1.20],
  'Nikola Jokic':          [1.16, 1.24],
  'Anthony Davis':         [1.22, 1.00],
  'Steph Curry':           [1.01, 0.93],
  'Jayson Tatum':          [1.12, 1.04],
  'Luka Doncic':           [1.10, 1.20],
  'Ja Morant':             [1.01, 0.94],
  'Shai Gilgeous-Alexander': [1.15, 0.95],
  'Cade Cunningham':       [1.15, 1.08],
  'Paolo Banchero':        [1.16, 1.14],
  // Football
  'Patrick Mahomes':       [1.03, 1.12],
  'Josh Allen':            [1.10, 1.16],
  'Lamar Jackson':         [1.05, 1.00],
  'Travis Kelce':          [1.12, 1.14],
  'Justin Jefferson':      [1.06, 1.00],
  'Tyreek Hill':           [0.96, 0.95],
  'Davante Adams':         [1.07, 1.06],
  'Brock Purdy':           [1.02, 1.00],
  'CeeDee Lamb':           [1.08, 1.02],
  // Baseball
  'Shohei Ohtani':         [1.08, 1.06],
  'Mike Trout':            [1.06, 1.14],
  'Aaron Judge':           [1.22, 1.22],
  'Bryce Harper':          [1.08, 1.10],
  'Ronald Acuna Jr':       [1.06, 1.04],
  'Juan Soto':             [1.07, 1.08],
  'Mookie Betts':          [0.96, 1.02],
  'Fernando Tatis Jr':     [1.08, 1.04],
  'Julio Rodriguez':       [1.10, 1.08],
  'Gunnar Henderson':      [1.12, 1.08],
  // Hockey
  'Connor McDavid':        [1.06, 1.00],
  'Nathan MacKinnon':      [1.07, 1.10],
  'Auston Matthews':       [1.09, 1.14],
  'Sidney Crosby':         [1.03, 1.12],
  'Leon Draisaitl':        [1.10, 1.10],
  'Cale Makar':            [1.05, 1.00],
  // Soccer
  'Lionel Messi':          [0.87, 0.94],
  'Cristiano Ronaldo':     [1.13, 1.08],
  'Kylian Mbappe':         [1.09, 1.00],
  'Erling Haaland':        [1.22, 1.16],
  'Vinicius Jr':           [1.07, 0.96],
  'Jude Bellingham':       [1.10, 1.06],
  'Bukayo Saka':           [1.03, 0.98],
  'Phil Foden':            [1.01, 0.99],
};

function hashName(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function getProps(player: string): [number, number] {
  if (PLAYER_DB[player]) return PLAYER_DB[player];
  const h = hashName(player);
  return [0.93 + (h % 28) / 100, 0.92 + ((h >>> 8) % 24) / 100];
}

// ── Light rays ─────────────────────────────────────────────────────────────
function LightRays() {
  // Rays radiate from a source point behind the player's upper body
  const cx = 50, cy = 20;
  const targets = [
    [0, 0, 8], [15, 0, 5], [35, 0, 7], [50, 0, 9],
    [65, 0, 5], [82, 0, 7], [100, 0, 6],
    [0, 55, 5], [100, 55, 5],
    [0, 130, 5], [25, 130, 6], [50, 130, 7], [75, 130, 6], [100, 130, 5],
  ] as [number, number, number][];

  return (
    <g opacity="0.11">
      {targets.map(([x, y, w], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y}
              stroke="white" strokeWidth={w} strokeLinecap="round" />
      ))}
    </g>
  );
}

// ── Sport silhouettes ──────────────────────────────────────────────────────
// All figures designed in 100×130 viewBox, feet anchored at y=108.
// The proportion transform is applied by the caller around these groups.

const F = 'rgba(0,0,0,0.84)'; // silhouette fill

function BaseballFigure() {
  return (
    <g>
      {/* Batting helmet */}
      <path d="M 43 38 Q 42 24 53 22 Q 65 22 66 35 L 65 44 L 43 44 Z" fill={F} />
      {/* Head */}
      <circle cx="53" cy="34" r="9.5" fill={F} />
      {/* Helmet brim forward */}
      <path d="M 43 38 Q 38 40 37 44 L 46 44 Q 44 40 46 38 Z" fill={F} />
      {/* Neck */}
      <path d="M 50 42 L 49 49 L 55 49 L 56 42 Z" fill={F} />
      {/* Torso - upright, slightly coiled */}
      <path d="M 45 48 L 41 78 L 61 78 L 59 48 Z" fill={F} />
      {/* Rear arm going up and back to bat */}
      <path d="M 57 54 L 70 44 L 73 48 L 61 58 Z" fill={F} />
      <path d="M 70 44 L 79 30 L 83 33 L 74 47 Z" fill={F} />
      {/* Bat handle */}
      <path d="M 79 30 L 84 16 L 88 18 L 83 33 Z" fill={F} />
      {/* Bat barrel */}
      <ellipse cx="87" cy="13" rx="4.5" ry="7" transform="rotate(-20 87 13)" fill={F} />
      {/* Front guiding arm */}
      <path d="M 47 54 L 35 50 L 34 54 L 46 58 Z" fill={F} />
      {/* Back leg - weight bearing */}
      <path d="M 56 78 L 60 98 L 67 108 L 71 106 L 64 97 L 59 78 Z" fill={F} />
      {/* Front leg - stride */}
      <path d="M 47 78 L 42 97 L 36 108 L 40 110 L 46 98 L 51 78 Z" fill={F} />
      {/* Cleats */}
      <ellipse cx="68" cy="109" rx="6" ry="2.5" fill={F} />
      <ellipse cx="37" cy="109" rx="6" ry="2.5" fill={F} />
    </g>
  );
}

function BasketballFigure() {
  return (
    <g>
      {/* Head */}
      <circle cx="48" cy="30" r="9" fill={F} />
      {/* Neck */}
      <path d="M 45 38 L 44 45 L 51 45 L 52 38 Z" fill={F} />
      {/* Torso - slightly bent forward */}
      <path d="M 41 44 L 36 70 L 57 72 L 56 44 Z" fill={F} />
      {/* Right shoulder/arm - dribble arm going down */}
      <path d="M 54 50 L 67 64 L 72 74 L 68 76 L 63 66 L 50 54 Z" fill={F} />
      {/* Left arm raised for balance */}
      <path d="M 43 50 L 28 42 L 25 46 L 40 56 Z" fill={F} />
      {/* Left forearm up */}
      <path d="M 28 42 L 18 30 L 22 27 L 32 39 Z" fill={F} />
      {/* Left leg - forward/plant */}
      <path d="M 42 72 L 36 91 L 31 108 L 35 109 L 40 93 L 46 72 Z" fill={F} />
      {/* Right leg - back/push */}
      <path d="M 54 72 L 62 91 L 68 108 L 72 107 L 66 90 L 58 72 Z" fill={F} />
      {/* Basketball near floor */}
      <circle cx="71" cy="103" r="9.5" fill={F} />
      {/* Ball seam lines */}
      <path d="M 63 102 Q 71 96 79 102" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      <path d="M 63 104 Q 71 110 79 104" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      <line x1="71" y1="93.5" x2="71" y2="112.5" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      {/* Shoe soles */}
      <ellipse cx="32" cy="109" rx="7" ry="3" fill={F} />
      <ellipse cx="69" cy="109" rx="7" ry="3" fill={F} />
    </g>
  );
}

function FootballFigure() {
  return (
    <g>
      {/* Helmet dome */}
      <path d="M 38 36 Q 37 20 51 18 Q 67 18 68 32 L 67 44 L 38 44 Z" fill={F} />
      {/* Head */}
      <circle cx="52" cy="32" r="10.5" fill={F} />
      {/* Facemask */}
      <path d="M 38 38 Q 35 43 37 47 L 42 45 Q 40 42 42 38 Z" fill={F} />
      <path d="M 37 47 Q 36 52 39 54 L 43 52 Q 41 48 42 45 Z" fill={F} />
      {/* Neck / shoulder pads */}
      <path d="M 46 41 L 44 50 L 60 50 L 58 41 Z" fill={F} />
      <path d="M 40 48 L 36 56 L 68 58 L 66 48 Z" fill={F} />
      {/* Torso */}
      <path d="M 42 56 L 37 80 L 63 80 L 60 56 Z" fill={F} />
      {/* Throwing arm (right) - raised back */}
      <path d="M 60 54 L 74 42 L 77 46 L 64 58 Z" fill={F} />
      <path d="M 74 42 L 84 28 L 88 32 L 78 46 Z" fill={F} />
      {/* Football */}
      <ellipse cx="87" cy="26" rx="6" ry="9" transform="rotate(-35 87 26)" fill={F} />
      {/* Front arm reaching forward */}
      <path d="M 44 58 L 28 66 L 26 62 L 42 54 Z" fill={F} />
      {/* Left hand */}
      <ellipse cx="24" cy="63" rx="4" ry="5" fill={F} />
      {/* Plant leg (left, forward) */}
      <path d="M 44 80 L 38 99 L 32 108 L 36 110 L 42 100 L 48 80 Z" fill={F} />
      {/* Back leg (right) */}
      <path d="M 58 80 L 65 99 L 72 108 L 76 106 L 69 98 L 62 80 Z" fill={F} />
      {/* Cleats */}
      <ellipse cx="34" cy="110" rx="7" ry="3" fill={F} />
      <ellipse cx="74" cy="108" rx="7" ry="3" fill={F} />
    </g>
  );
}

function HockeyFigure() {
  return (
    <g>
      {/* Helmet */}
      <path d="M 43 38 Q 43 24 54 22 Q 65 24 66 36 L 65 44 L 43 44 Z" fill={F} />
      {/* Head */}
      <circle cx="54" cy="33" r="9" fill={F} />
      {/* Visor line */}
      <path d="M 43 38 Q 40 40 41 44 L 48 43 Q 46 40 47 38 Z" fill={F} />
      {/* Neck */}
      <path d="M 51 41 L 50 48 L 56 48 L 57 41 Z" fill={F} />
      {/* Torso - leaning aggressively forward */}
      <path d="M 44 46 L 34 74 L 60 78 L 62 46 Z" fill={F} />
      {/* Right arm (stick arm) going down-forward */}
      <path d="M 60 52 L 74 68 L 78 76 L 74 78 L 70 70 L 56 56 Z" fill={F} />
      {/* Left arm pumping back */}
      <path d="M 46 52 L 30 44 L 28 48 L 44 56 Z" fill={F} />
      <path d="M 30 44 L 22 32 L 26 29 L 34 41 Z" fill={F} />
      {/* Hockey stick shaft */}
      <path d="M 76 76 L 88 108 L 92 107 L 80 75 Z" fill={F} />
      {/* Stick blade */}
      <path d="M 88 108 L 100 110 L 100 114 L 86 112 Z" fill={F} />
      {/* Puck */}
      <ellipse cx="98" cy="113" rx="7" ry="3" fill={F} />
      {/* Forward leg (right) */}
      <path d="M 54 78 L 62 96 L 68 108 L 72 106 L 66 95 L 58 78 Z" fill={F} />
      {/* Push-off leg (left) - back and low */}
      <path d="M 38 74 L 26 88 L 18 106 L 22 108 L 30 90 L 42 76 Z" fill={F} />
      {/* Skate blades */}
      <ellipse cx="69" cy="109" rx="7" ry="2.5" fill={F} />
      <ellipse cx="19" cy="108" rx="7" ry="2.5" fill={F} />
    </g>
  );
}

function SoccerFigure() {
  return (
    <g>
      {/* Head */}
      <circle cx="50" cy="26" r="9.5" fill={F} />
      {/* Neck */}
      <path d="M 47 34 L 46 42 L 53 42 L 54 34 Z" fill={F} />
      {/* Torso - leaning back for kick power */}
      <path d="M 43 41 L 36 70 L 59 72 L 57 41 Z" fill={F} />
      {/* Left arm spread wide for balance */}
      <path d="M 44 47 L 26 40 L 24 44 L 42 52 Z" fill={F} />
      <path d="M 26 40 L 12 34 L 14 30 L 28 36 Z" fill={F} />
      {/* Right arm other side */}
      <path d="M 56 47 L 74 42 L 76 46 L 58 52 Z" fill={F} />
      <path d="M 74 42 L 88 38 L 90 42 L 76 46 Z" fill={F} />
      {/* Plant leg (left) - firm, straight */}
      <path d="M 42 72 L 40 95 L 36 108 L 40 110 L 44 97 L 46 72 Z" fill={F} />
      {/* Kicking leg (right) - swung high */}
      <path d="M 56 72 L 68 60 L 76 55 L 80 60 L 72 66 L 60 78 Z" fill={F} />
      {/* Kicking lower leg / shin */}
      <path d="M 76 55 L 92 50 L 94 55 L 80 60 Z" fill={F} />
      {/* Kicking foot */}
      <ellipse cx="93" cy="53" rx="7" ry="5" fill={F} />
      {/* Soccer ball */}
      <circle cx="94" cy="44" r="10" fill={F} />
      {/* Ball pentagons */}
      <path d="M 94 34 L 98 40 L 95 46 L 91 46 L 89 40 Z"
            fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1" />
      <path d="M 94 34 Q 100 36 102 42" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      {/* Ground foot */}
      <ellipse cx="37" cy="109" rx="7" ry="3" fill={F} />
    </g>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface Props {
  player: string;
  sport: string;
  cardId: string;
}

export default function CardSilhouette({ player, sport, cardId }: Props) {
  const [hScale, bScale] = getProps(player);
  // Anchor transform at feet (y=108), scale outward from there
  const tf = `translate(50,108) scale(${bScale},${hScale}) translate(-50,-108)`;
  const glowId = `glow-${cardId}`;
  const floorId = `floor-${cardId}`;

  const Pose =
    sport === 'Baseball'   ? BaseballFigure   :
    sport === 'Basketball' ? BasketballFigure :
    sport === 'Football'   ? FootballFigure   :
    sport === 'Hockey'     ? HockeyFigure     :
    sport === 'Soccer'     ? SoccerFigure     :
    BasketballFigure;

  return (
    <svg
      viewBox="0 0 100 130"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMax meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Spotlight glow behind player */}
        <radialGradient id={glowId} cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="0.22" />
          <stop offset="60%" stopColor="white" stopOpacity="0.06" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Ground shadow gradient */}
        <radialGradient id={floorId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Dramatic light rays from upper-center */}
      <LightRays />

      {/* Spotlight glow ellipse */}
      <ellipse cx="50" cy="58" rx="38" ry="50" fill={`url(#${glowId})`} />

      {/* Player silhouette with proportion scaling */}
      <g transform={tf}>
        <Pose />
      </g>

      {/* Ground shadow */}
      <ellipse cx="50" cy="118" rx="22" ry="4.5" fill={`url(#${floorId})`} />
    </svg>
  );
}
