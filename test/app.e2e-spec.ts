jest.mock('../src/auth/firebase-admin.service', () => ({
  FirebaseAdminService: class FirebaseAdminService {},
}));

import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('API smoke tests', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('reports process health', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('rejects an unauthenticated admin request', async () => {
    await request(app.getHttpServer()).get('/api/admin/dashboard').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
