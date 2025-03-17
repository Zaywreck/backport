import { EdgeConfig } from '@vercel/edge-config';

const edgeConfig = new EdgeConfig({
  token: process.env.EDGE_CONFIG_TOKEN,
});

export default edgeConfig;
