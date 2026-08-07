import { EnvironmentConfig } from './environment.config';

describe('EnvironmentConfig cookie policy', () => {
  const environment = { ...process.env };

  afterEach(() => {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, environment);
  });

  it('requires secure cookies in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_ORIGIN = 'https://app.example.test';
    process.env.COOKIE_SECURE = 'false';

    expect(() => new EnvironmentConfig()).toThrow(
      'COOKIE_SECURE must be true in production.',
    );
  });

  it('requires secure cookies for cross-site sessions', () => {
    process.env.NODE_ENV = 'development';
    process.env.COOKIE_SECURE = 'false';
    process.env.COOKIE_SAME_SITE = 'none';

    expect(() => new EnvironmentConfig()).toThrow(
      'COOKIE_SAME_SITE=none requires COOKIE_SECURE=true.',
    );
  });
});
