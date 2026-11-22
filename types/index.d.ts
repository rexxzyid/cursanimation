export type CursorType = "default" | "circle" | "dot" | "ring" | "crosshair" | "minimal" | "image";
export type MovementType = "instant" | "smooth" | "delayed" | "elastic";
export type TrailStyle = "dots" | "gradient" | "neon";
export type ParticleShape = "dot" | "sparkle" | "mixed";
export type TouchMode = "off" | "tap";
export type RevealAnimation =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "scale-up"
  | "blur-in";

export interface ElasticOptions {
  stiffness: number;
  damping: number;
}

export interface MagneticOptions {
  enabled: boolean;
  radius: number;
  strength: number;
}

export interface SwarmOptions {
  enabled: boolean;
  count: number;
  radius: number;
  size: number;
  speed: number;
  avoid: number;
  hideCursor: boolean;
}

export interface TrailOptions {
  enabled: boolean;
  length: number;
  style: TrailStyle;
  size: number;
}

export interface ParticleOptions {
  enabled: boolean;
  density: number;
  size: number;
  lifetime: number;
  gravity: number;
  shape: ParticleShape;
  max: number;
}

export interface ClickEffectOptions {
  enabled: boolean;
  ripple: boolean;
  particles: boolean;
  count: number;
}

export interface SelectorOptions {
  link: string;
  button: string;
  text: string;
  ignore: string;
}

export interface CursAnimationOptions {
  cursor: CursorType;
  imageUrl: string;
  imageSize: number;
  imageHotspot: [number, number];
  color: string;
  color2: string;
  size: number;
  movement: MovementType;
  speed: number;
  elastic: ElasticOptions;
  magnetic: MagneticOptions;
  swarm: SwarmOptions;
  glow: boolean;
  neon: boolean;
  motionBlur: boolean;
  trail: TrailOptions;
  particles: ParticleOptions;
  hoverEffects: boolean;
  hoverScale: number;
  clickEffects: ClickEffectOptions;
  dragEffects: boolean;
  hideNativeCursor: boolean;
  touch: TouchMode;
  respectReducedMotion: boolean;
  zIndex: number;
  selectors: SelectorOptions;
}

export interface CursAnimationInput {
  cursor?: CursorType;
  imageUrl?: string;
  imageSize?: number;
  imageHotspot?: [number, number];
  color?: string;
  color2?: string;
  size?: number;
  movement?: MovementType;
  speed?: number;
  elastic?: Partial<ElasticOptions>;
  magnetic?: boolean | Partial<MagneticOptions>;
  swarm?: boolean | Partial<SwarmOptions>;
  glow?: boolean;
  neon?: boolean;
  motionBlur?: boolean;
  trail?: boolean | Partial<TrailOptions>;
  particles?: boolean | Partial<ParticleOptions>;
  hoverEffects?: boolean;
  hoverScale?: number;
  clickEffects?: boolean | Partial<ClickEffectOptions>;
  dragEffects?: boolean;
  hideNativeCursor?: boolean;
  touch?: TouchMode;
  respectReducedMotion?: boolean;
  zIndex?: number;
  selectors?: Partial<SelectorOptions>;
}

export interface RevealOptions {
  selector?: string;
  once?: boolean;
  threshold?: number | number[];
  animation?: RevealAnimation;
  duration?: number;
  delay?: number;
  stagger?: number;
  distance?: number;
  rootMargin?: string;
  root?: Element | null;
  respectReducedMotion?: boolean;
}

export interface RevealController {
  refresh(): void;
  destroy(): void;
}

export interface RebuildOptions {
  selector?: string;
  once?: boolean;
  threshold?: number;
  duration?: number;
  agents?: number;
  revealClass?: string;
  rootMargin?: string;
  respectReducedMotion?: boolean;
}

export interface RebuildController {
  refresh(): void;
  destroy(): void;
}

export interface Capabilities {
  pointerEvents: boolean;
  intersectionObserver: boolean;
  matchMedia: boolean;
  colorMix: boolean;
  reducedMotion: boolean;
}

export interface CursAnimationApi {
  readonly version: string;
  init(options?: CursAnimationInput): CursAnimationApi;
  destroy(): CursAnimationApi;
  enable(): CursAnimationApi;
  disable(): CursAnimationApi;
  setCursor(type: CursorType): CursAnimationApi;
  setOptions(options: CursAnimationInput): CursAnimationApi;
  getOptions(): CursAnimationOptions | null;
  isEnabled(): boolean;
  isSupported(): boolean;
  reveal(options?: RevealOptions): RevealController;
  rebuild(options?: RebuildOptions): RebuildController;
  refresh(): CursAnimationApi;
  capabilities(): Capabilities;
}

declare const CursAnimation: CursAnimationApi;

export const version: string;
export function init(options?: CursAnimationInput): CursAnimationApi;
export function destroy(): CursAnimationApi;
export function enable(): CursAnimationApi;
export function disable(): CursAnimationApi;
export function setCursor(type: CursorType): CursAnimationApi;
export function setOptions(options: CursAnimationInput): CursAnimationApi;
export function getOptions(): CursAnimationOptions | null;
export function reveal(options?: RevealOptions): RevealController;
export function rebuild(options?: RebuildOptions): RebuildController;
export function refresh(): CursAnimationApi;

export default CursAnimation;

declare global {
  interface Window {
    CursAnimation: CursAnimationApi;
  }
}
