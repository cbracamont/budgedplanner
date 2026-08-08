import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Recharts needs a non-zero container size in jsdom
Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 400 });
Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, value: 400 });

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || ResizeObserverMock;
