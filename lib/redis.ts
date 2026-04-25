import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export const redis = Redis.fromEnv()

// 유저당 분당 10회 음악 생성 제한
export const generateRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:generate',
})

// 유저당 분당 20회 커버 생성 제한
export const coverRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'ratelimit:cover',
})






