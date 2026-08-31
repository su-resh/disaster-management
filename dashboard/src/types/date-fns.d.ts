// date-fns v4's package.json "exports" map doesn't resolve under this project's
// "bundler" moduleResolution (TS7016). Shim the small API surface we actually use,
// so imports stay type-safe without changing the whole tsconfig.
declare module 'date-fns' {
  export function formatDistanceToNowStrict(
    date: Date | number,
    options?: { addSuffix?: boolean; unit?: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year' }
  ): string;

  export function format(
    date: Date | number | string,
    formatStr: string,
    options?: Record<string, unknown>
  ): string;

  export function formatRelative(
    date: Date | number,
    baseDate: Date | number,
    options?: { locale?: Record<string, unknown> }
  ): string;
}
