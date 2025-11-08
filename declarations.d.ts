declare module '*.png' {
  const value: string;
  export default value;
}

declare interface ImportMeta {
  readonly env: {
    VITE_API_URL: string;
    [key: string]: any;
  };
} 