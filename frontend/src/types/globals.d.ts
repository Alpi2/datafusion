// Minimal test globals for local typechecking when test typings are not installed.
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect(value: any): any;

// Provide a loose module declaration for react-hot-toast to silence missing types.
declare module "react-hot-toast" {
  const toast: any;
  export default toast;
  export const toast: any;
}
