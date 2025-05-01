// Edge Config utility functions with local fallback
import { get } from '@vercel/edge-config';
import fs from 'fs';
import path from 'path';

const EDGE_CONFIG_URL = process.env.EDGE_CONFIG_URL;
const API_TOKEN = process.env.VERCEL_API_TOKEN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create data directory:', err);
}

// Helper to get local file path for a key
function getLocalFilePath(key) {
  return path.join(DATA_DIR, `${key}.json`);
}

// Helper to read from local JSON file
function readLocalFile(key) {
  try {
    const filePath = getLocalFilePath(key);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Error reading local file for ${key}:`, error);
    return null;
  }
}

// Helper to write to local JSON file
function writeLocalFile(key, value) {
  try {
    const filePath = getLocalFilePath(key);
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing local file for ${key}:`, error);
    return false;
  }
}

// Helper function to update Edge Config with local fallback
export async function patchEdgeConfig(key, value) {
  // Always update local file as fallback
  writeLocalFile(key, value);
  
  try {
    // Skip Edge Config in development if not configured
    if (!IS_PRODUCTION && (!EDGE_CONFIG_URL || !API_TOKEN)) {
      console.log(`[DEV] Updated ${key} in local file`);
      return { success: true, message: 'Updated in local file' };
    }
    
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
    console.log(`Updated ${key} in Edge Config:`, result);
    return result;
  } catch (error) {
    console.error(`Error updating ${key} in Edge Config:`, error);
    console.log(`Falling back to local file for ${key}`);
    return { success: true, message: 'Updated in local file only', error: error.message };
  }
}

// Helper to get data from Edge Config with local fallback
export async function getEdgeConfig(key) {
  try {
    // Skip Edge Config in development if not configured
    if (!IS_PRODUCTION && (!EDGE_CONFIG_URL || !API_TOKEN)) {
      console.log(`[DEV] Reading ${key} from local file`);
      return readLocalFile(key) || null;
    }
    
    // Try Edge Config first
    const data = await get(key);
    if (data) {
      // Update local cache
      writeLocalFile(key, data);
      return data;
    }
    
    // Fall back to local file if Edge Config returns null
    const localData = readLocalFile(key);
    return localData;
  } catch (error) {
    console.error(`Error getting ${key} from Edge Config:`, error);
    console.log(`Falling back to local file for ${key}`);
    return readLocalFile(key) || null;
  }
}
