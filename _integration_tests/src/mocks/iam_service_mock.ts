import {IIAMService, IIdentity} from '@essential-projects/iam_contracts';

export class IamServiceMock implements IIAMService {

  private claimConfigs: any = {
    defaultUser: ['can_access_external_tasks'],
    restrictedUser: [],
  };

  public async ensureHasClaim(identity: IIdentity, claimName: string): Promise<void> {
    return Promise.resolve();
  }
}
