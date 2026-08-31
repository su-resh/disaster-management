// maplibre-gl ships types for its main entry, but the deep import
// 'maplibre-gl/dist/maplibre-gl.mjs' used in the emergencies map page has none.
declare module 'maplibre-gl/dist/maplibre-gl.mjs' {
  export class Map {
    constructor(options: { container: string | HTMLElement; style?: unknown; center?: [number, number]; zoom?: number; [key: string]: unknown });
    on(type: string, listener: () => void): void;
    addControl(control: unknown): void;
    remove(): void;
    jumpTo(options: Record<string, unknown>): void;
    fitBounds(bounds: unknown, options?: Record<string, unknown>): void;
    [key: string]: unknown;
  }
  export class Marker {
    constructor(options?: Record<string, unknown>);
    setLngLat(lngLat: [number, number] | { lng: number; lat: number }): this;
    addTo(map: unknown): this;
    setPopup(popup: unknown): this;
    remove(): this;
    getElement(): HTMLElement;
    [key: string]: unknown;
  }
  export class Popup {
    constructor(options?: Record<string, unknown>);
    setHTML(html: string): this;
    [key: string]: unknown;
  }
  export class NavigationControl {
    constructor(options?: Record<string, unknown>);
    [key: string]: unknown;
  }
  export type LngLatLike = [number, number] | { lng: number; lat: number };
  export type StyleSpecification = unknown;
  export class LngLatBounds {
    constructor(bounds?: unknown);
    extend(lngLat: unknown): this;
    [key: string]: unknown;
  }
  const _default: {
    Map: typeof Map;
    Marker: typeof Marker;
    Popup: typeof Popup;
    NavigationControl: typeof NavigationControl;
    LngLatBounds: typeof LngLatBounds;
    [key: string]: unknown;
  };
  export default _default;
}
