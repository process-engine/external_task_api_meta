'use strict';

import {InvocationContainer} from 'addict-ioc';

import {
  ExternalTaskApiClientService,
  ExternalTaskApiExternalAccessor,
  ExternalTaskApiInternalAccessor,
} from '@process-engine/external_task_api_client';

import {IamServiceMock} from '../mocks/index';

export function registerInContainer(container: InvocationContainer): void {

  const useInternalAccessor: boolean = process.env.EXTERNAL_TASK_API_ACCESS_TYPE === 'internal';

  if (useInternalAccessor) {

    container.register('ExternalTaskApiInternalAccessor', ExternalTaskApiInternalAccessor)
      .dependencies('ExternalTaskApiService');

    container.register('ExternalTaskApiClientService', ExternalTaskApiClientService)
      .dependencies('ExternalTaskApiInternalAccessor');

  } else {

    container.register('ExternalTaskApiExternalAccessor', ExternalTaskApiExternalAccessor)
      .dependencies('HttpService');

    container.register('ExternalTaskApiClientService', ExternalTaskApiClientService)
      .dependencies('ExternalTaskApiExternalAccessor');
  }

  // This removes the necessity for having a running IdentityServer during testing.
  container.register('IamService', IamServiceMock);
}
