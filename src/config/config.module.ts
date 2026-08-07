import { Global, Module } from '@nestjs/common';
import { EnvironmentConfig } from './environment.config';

@Global()
@Module({
  providers: [EnvironmentConfig],
  exports: [EnvironmentConfig],
})
export class ConfigModule {}
