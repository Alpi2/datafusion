declare module "@testing-library/react" {
  export function render(...args: any[]): any;
  export const screen: any;
}

declare module "@testing-library/jest-dom";

declare const jest: any;
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => Promise<void> | void): void;
declare function test(name: string, fn: () => Promise<void> | void): void;
declare function expect(...args: any[]): any;
