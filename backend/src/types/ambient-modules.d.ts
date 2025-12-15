// Ambient module declarations for optional/externally-provided packages
// These are minimal declarations to allow TypeScript compilation in environments
// where the runtime packages may not be installed (CI or limited dev env).

declare module "@sentry/node" {
  const Sentry: any;
  export = Sentry;
}

declare module "dd-trace" {
  const dd: any;
  export default dd;
}

declare module "cookie-parser" {
  const cp: any;
  export default cp;
}

declare module "prom-client" {
  const client: any;
  export default client;
}

declare module "@aws-sdk/client-secrets-manager" {
  const aws: any;
  export = aws;
}

// Allow importing some optional runtime-only libs without types
declare module "axios" {
  const axios: any;
  export default axios;
}

declare module "form-data" {
  const FormData: any;
  export default FormData;
}
