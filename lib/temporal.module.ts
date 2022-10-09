import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TemporalMetadataAccessor } from './temporal-metadata.accessors';
import { TemporalExplorer } from './temporal.explorer';
import {
  SharedWorkerAsyncConfiguration,
  TemporalModuleOptions,
} from './interfaces';
import { WorkerOptions, RuntimeOptions } from '@temporalio/worker';
import {
  TEMPORAL_CORE_CONFIG,
  TEMPORAL_WORKER_CONFIG,
} from './temporal.constants';
import { createClientProviders } from './temporal.providers';

@Module({})
export class TemporalModule {
  static forRoot(
    workerConfig: WorkerOptions,
    runtimeConfig?: RuntimeOptions,
  ): DynamicModule {
    const workerConfigProvider: Provider = {
      provide: TEMPORAL_WORKER_CONFIG,
      useValue: workerConfig,
    };

    const coreConfigProvider: Provider = {
      provide: TEMPORAL_CORE_CONFIG,
      useValue: runtimeConfig || {},
    };

    return {
      global: true,
      module: TemporalModule,
      providers: [workerConfigProvider, coreConfigProvider],
      imports: [TemporalModule.registerCore()],
    };
  }

  static forRootAsync(
    asyncWorkerConfig: SharedWorkerAsyncConfiguration,
    asyncRuntimeConfig?: RuntimeOptions,
  ): DynamicModule {
    const providers: Provider[] = [this.createAsyncProvider(asyncWorkerConfig)];

    const runtimeConfigProvider: Provider = {
      provide: TEMPORAL_CORE_CONFIG,
      useValue: asyncRuntimeConfig || {},
    };

    return {
      global: true,
      module: TemporalModule,
      providers: [...providers, runtimeConfigProvider],
      imports: [TemporalModule.registerCore()],
      exports: providers,
    };
  }

  private static createAsyncProvider(
    options: SharedWorkerAsyncConfiguration,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: TEMPORAL_WORKER_CONFIG,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
  }

  static registerClient(options?: TemporalModuleOptions): DynamicModule {
    const createClientProvider = createClientProviders([].concat(options));
    return {
      global: true,
      module: TemporalModule,
      providers: createClientProvider,
      exports: createClientProvider,
    };
  }
  static registerClientAsync(options: TemporalModuleOptions): DynamicModule {
    throw new Error('Method not implemented.');
  }

  private static registerCore() {
    return {
      global: true,
      module: TemporalModule,
      imports: [DiscoveryModule],
      providers: [TemporalExplorer, TemporalMetadataAccessor],
    };
  }
}
