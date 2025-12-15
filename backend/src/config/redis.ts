// Legacy ioredis config removed. The project uses node-redis v4 in `RedisUtil` now.
// Keep a minimal default export for any legacy imports until callers are migrated.
const redis = null as unknown as any;

export default redis;
