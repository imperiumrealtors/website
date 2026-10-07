import { HttpError } from './http-error';

export type FieldErrors = Record<string, string>;

export class Validator {
  errors: FieldErrors = {};
  constructor(private body: Record<string, unknown>) {}

  private raw(key: string) {
    return this.body[key];
  }

  string(key: string, opts: { required?: boolean; max?: number; min?: number; pattern?: RegExp; label?: string } = {}): string {
    const label = opts.label ?? key;
    const v = this.raw(key);
    const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
    if (opts.required && !s) this.errors[key] = `${label} is required.`;
    else if (s && opts.min && s.length < opts.min) this.errors[key] = `${label} must be at least ${opts.min} characters.`;
    else if (s && opts.max && s.length > opts.max) this.errors[key] = `${label} must be under ${opts.max} characters.`;
    else if (s && opts.pattern && !opts.pattern.test(s)) this.errors[key] = `${label} is not valid.`;
    return s;
  }

  enum<T extends string>(key: string, allowed: readonly T[], opts: { required?: boolean; fallback?: NoInfer<T>; label?: string } = {}): T {
    const s = this.string(key, { required: opts.required, label: opts.label });
    if (!s) return opts.fallback as T;
    if (!allowed.includes(s as T)) {
      this.errors[key] = `${opts.label ?? key} must be one of: ${allowed.join(', ')}.`;
      return opts.fallback as T;
    }
    return s as T;
  }

  number(key: string, opts: { required?: boolean; min?: number; max?: number; integer?: boolean; fallback?: number; label?: string } = {}): number {
    const label = opts.label ?? key;
    const v = this.raw(key);
    if (v === '' || v == null) {
      if (opts.required) this.errors[key] = `${label} is required.`;
      return opts.fallback ?? 0;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) { this.errors[key] = `${label} must be a number.`; return opts.fallback ?? 0; }
    if (opts.integer && !Number.isInteger(n)) { this.errors[key] = `${label} must be a whole number.`; return opts.fallback ?? 0; }
    if (opts.min != null && n < opts.min) { this.errors[key] = `${label} must be at least ${opts.min}.`; return n; }
    if (opts.max != null && n > opts.max) { this.errors[key] = `${label} must be at most ${opts.max}.`; return n; }
    return n;
  }

  boolean(key: string, fallback = false): boolean {
    const v = this.raw(key);
    if (v == null) return fallback;
    return v === true || v === 'true' || v === 1 || v === '1' || v === 'on';
  }

  stringArray(key: string, opts: { max?: number; itemMax?: number } = {}): string[] {
    const v = this.raw(key);
    if (v == null) return [];
    const arr = Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : [];
    const out = arr.map((x) => String(x).trim()).filter(Boolean);
    if (opts.max && out.length > opts.max) this.errors[key] = `${key} may have at most ${opts.max} entries.`;
    if (opts.itemMax && out.some((x) => x.length > opts.itemMax!)) this.errors[key] = `Each ${key} entry must be under ${opts.itemMax} characters.`;
    return out;
  }

  enumArray<T extends string>(key: string, allowed: readonly T[]): T[] {
    const arr = this.stringArray(key);
    const bad = arr.filter((x) => !allowed.includes(x as T));
    if (bad.length) this.errors[key] = `Invalid ${key}: ${bad.join(', ')}.`;
    return arr.filter((x) => allowed.includes(x as T)) as T[];
  }

  objectArray<T>(key: string, shape: (item: Record<string, unknown>, v: Validator) => T, max = 50): T[] {
    const v = this.raw(key);
    if (!Array.isArray(v)) return [];
    if (v.length > max) { this.errors[key] = `${key} may have at most ${max} entries.`; return []; }
    const out: T[] = [];
    v.forEach((item, i) => {
      if (!item || typeof item !== 'object') { this.errors[key] = `${key}[${i}] is not valid.`; return; }
      const sub = new Validator(item as Record<string, unknown>);
      out.push(shape(item as Record<string, unknown>, sub));
      Object.entries(sub.errors).forEach(([k, msg]) => { this.errors[`${key}[${i}].${k}`] = msg; });
    });
    return out;
  }

  optionalId(key: string): string | null {
    const s = this.string(key, { max: 64 });
    return s || null;
  }

  throwIfInvalid() {
    if (Object.keys(this.errors).length) throw new HttpError(422, 'Please fix the highlighted fields.', this.errors);
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[+\d][\d\s\-()]{6,19}$/;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
