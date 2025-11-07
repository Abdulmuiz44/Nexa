import { Composio } from '@composio/core';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;

// Be safe at import time: do not throw if the key is missing.
// Export an optional instance; callers must guard before use.
let composio: Composio | undefined;
if (!COMPOSIO_API_KEY) {
  if (typeof console !== 'undefined') {
    console.warn('COMPOSIO_API_KEY is not set; Composio features will be disabled.');
  }
} else {
  composio = new Composio({ apiKey: COMPOSIO_API_KEY });
}

export { composio };
