export { validateRequest } from "../../../shared/middleware/validation.middleware";

// NOTE: This file re-exports the centralized validation middleware so existing
// imports under services/auth continue to work while sharing a single
// implementation across the codebase.
