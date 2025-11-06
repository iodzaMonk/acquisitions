import arcjet, {
  shield,
  detectBot,
  tokenBucket,
  slidingWindow,
} from '@arcjet/node';

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE',
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc
        'CATEGORY:PREVIEW',
      ],
    }),
    slidingWindow({
      mode: 'LIVE',
      interval: '2s',
      max: 5,
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
    tokenBucket({
      mode: 'LIVE',
      refillRate: 5, // Refill 5 tokens per interval
      interval: 10, // Refill every 10 seconds
      capacity: 10, // Bucket capacity of 10 tokens
    }),
  ],
});

export default aj;
