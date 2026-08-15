import {
  calculateChecksum,
  generateTreeId,
  validateTreeId,
} from './tree-id-generator';

describe('tree id generator', () => {
  it('creates a year-aware identifier with a valid checksum', () => {
    const id = generateTreeId(2030);
    expect(id).toMatch(/^TREE-2030-[A-Z0-9]{5}$/);
    expect(validateTreeId(id)).toBe(true);
  });

  it('rejects a modified checksum', () => {
    const payload = 'TREE-2030-AAAA';
    const checksum = calculateChecksum(payload);
    const replacement = checksum === 'A' ? 'B' : 'A';
    expect(validateTreeId(`${payload}${replacement}`)).toBe(false);
    expect(validateTreeId('TREE-2030-AAAA!')).toBe(false);
  });
});
