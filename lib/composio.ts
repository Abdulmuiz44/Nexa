import { Composio } from '@composio/core';

if (!process.env.COMPOSIO_API_KEY) {
  throw new Error('COMPOSIO_API_KEY is not set');
}

export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});
