// TypeScript declarations for Vertex AI Search widget

declare namespace JSX {
  interface IntrinsicElements {
    'gen-search-widget': {
      configId: string;
      triggerId: string;
    };
  }
}

declare global {
  interface Window {
    genAppBuilder?: any;
  }
}