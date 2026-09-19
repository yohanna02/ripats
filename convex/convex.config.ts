import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    ATBU_ADMIN_EMAIL: v.optional(v.string()),
    ATBU_BOOTSTRAP_CODE: v.optional(v.string()),
    SMTP_HOST: v.optional(v.string()),
    SMTP_PORT: v.optional(v.string()),
    SMTP_USER: v.optional(v.string()),
    SMTP_PASS: v.optional(v.string()),
    SMTP_SECURE: v.optional(v.string()),
    AUTH_EMAIL_FROM: v.optional(v.string()),
  },
});

export default app;
