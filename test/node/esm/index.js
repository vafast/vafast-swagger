if ('Bun' in globalThis) {
  throw new Error('❌ Use Node.js to run this test!');
}

import { swagger } from '@huyooo/elysia-swagger';

if (typeof swagger !== 'function') {
  throw new Error('❌ ESM Node.js failed');
}

console.log('✅ ESM Node.js works!');
