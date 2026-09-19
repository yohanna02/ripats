import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    ATBU_ADMIN_EMAIL: v.optional(v.string()),
    ATBU_BOOTSTRAP_CODE: v.optional(v.string()),
  },
});

export default app;
