import { randomInt } from 'node:crypto';

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function calculateChecksum(payload: string): string {
  let sum = 0;
  for (let index = 0; index < payload.length; index += 1) {
    const character = payload[index];
    const code = CHARS.indexOf(character);
    sum += (code >= 0 ? code : character.charCodeAt(0)) * (index + 1);
  }
  return CHARS[sum % CHARS.length];
}

export function generateTreeId(year = new Date().getUTCFullYear()): string {
  let payload = '';
  for (let index = 0; index < 4; index += 1) {
    payload += CHARS[randomInt(CHARS.length)];
  }
  const value = `TREE-${year}-${payload}`;
  return `${value}${calculateChecksum(value)}`;
}

export function validateTreeId(treeId: string): boolean {
  if (!/^TREE-\d{4}-[A-Z0-9]{5}$/.test(treeId)) return false;
  const payload = treeId.slice(0, -1);
  return calculateChecksum(payload) === treeId.at(-1);
}
