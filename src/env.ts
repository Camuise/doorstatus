import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

const validatedEnv = createEnv({
  server: {
    STATUS_API_SECRET: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  },
  runtimeEnv: {
    STATUS_API_SECRET: import.meta.env.STATUS_API_SECRET,
    UPSTASH_REDIS_REST_URL:
      import.meta.env.UPSTASH_REDIS_REST_URL ?? import.meta.env.REDIS_KV_REST_API_URL,
    UPSTASH_REDIS_REST_TOKEN:
      import.meta.env.UPSTASH_REDIS_REST_TOKEN ?? import.meta.env.REDIS_KV_REST_API_TOKEN,
  },
  emptyStringAsUndefined: true,
});

export const env = {
  STATUS_API_SECRET: validatedEnv.STATUS_API_SECRET,
  UPSTASH_REDIS_REST_URL: validatedEnv.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: validatedEnv.UPSTASH_REDIS_REST_TOKEN,
};