// Edge Config utility functions
import { get } from '@vercel/edge-config';

const EDGE_CONFIG_URL = process.env.EDGE_CONFIG_URL;
const API_TOKEN = process.env.VERCEL_API_TOKEN;

// Helper function to update Edge Config
export async function patchEdgeConfig(key, value) {
  try {
    const response = await fetch(EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        Authorization: API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'update',
            key,
            value,
          },
        ],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Edge Config update failed: ${result.message || 'Unknown error'}`);
    }
    console.log(`Updated ${key}:`, result);
    return result;
  } catch (error) {
    console.error(`Error updating ${key}:`, error);
    throw error;
  }
}

// Helper to get data from Edge Config
export async function getEdgeConfig(key) {
  try {
    return await get(key);
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    throw error;
  }
}
