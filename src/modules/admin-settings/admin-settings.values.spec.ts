import { adminSettingsFrom } from './admin-settings.values';

describe('adminSettingsFrom', () => {
  it('returns safe defaults and excludes removed integration fields', () => {
    const settings = adminSettingsFrom({
      storeName: 'Green Store',
      analyticsEnabled: true,
      webhookUrl: 'https://example.com',
    });
    expect(settings.storeName).toBe('Green Store');
    expect(settings.storefrontActive).toBe(true);
    expect(settings).not.toHaveProperty('analyticsEnabled');
    expect(settings).not.toHaveProperty('webhookUrl');
  });
});
