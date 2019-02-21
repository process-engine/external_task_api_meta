import {ForbiddenError} from '@essential-projects/errors_ts';
import {IIAMService, IIdentity, TokenBody} from '@essential-projects/iam_contracts';

export class IamServiceMock implements IIAMService {

  private claimConfigs: any = {
    defaultUser: [
      'can_read_process_model',
      'can_write_process_model',
      'can_access_external_tasks',
      'Default_Test_Lane',
    ],
    restrictedUser: [],
  };

  public async ensureHasClaim(identity: IIdentity, requiredClaimName: string): Promise<void> {
    if (!identity || !identity.token) {
      throw new ForbiddenError('Access denied');
    }

    // The dummy token is used by the AutoStartService and must always be passed.
    const isDummyToken: boolean = identity.userId === 'dummy_token';
    if (isDummyToken) {
      return Promise.resolve();
    }

    const claimConfig: Array<string> = this.claimConfigs[identity.userId];

    const userHasClaim: boolean = claimConfig.some((claim: string): boolean => {
      return claim === requiredClaimName;
    });

    if (!userHasClaim) {
      throw new ForbiddenError('Access denied');
    }
  }
}
