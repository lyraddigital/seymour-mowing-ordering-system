export const DEFAULT_SESSION_EXPIRY_DURATION_IN_DAYS = process.env
  .DEFAULT_SESSION_EXPIRY_DURATION_IN_DAYS
  ? parseInt(process.env.DEFAULT_SESSION_EXPIRY_DURATION_IN_DAYS, 10)
  : 1;

export const DATABASE_REGION = process.env.DATABASE_REGION || "";
export const DATABASE_HOST = process.env.DATABASE_HOST || "";
export const DATABASE_PORT = process.env.DATABASE_PORT || "";
export const DATABASE_NAME = process.env.DATABASE_NAME || "";
export const DATABASE_SECRET_ID = process.env.DATABASE_SECRET_ID || "";

export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "";

export const REMEMBER_ME_SESSION_EXPIRY_DURATION_IN_DAYS = process.env
  .REMEMBER_ME_SESSION_EXPIRY_DURATION_IN_DAYS
  ? parseInt(process.env.REMEMBER_ME_SESSION_EXPIRY_DURATION_IN_DAYS, 10)
  : 30;
