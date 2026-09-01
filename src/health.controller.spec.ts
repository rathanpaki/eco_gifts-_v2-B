import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports that the API process is available', () => {
    expect(new HealthController().status()).toEqual({ status: 'ok' });
  });
});
