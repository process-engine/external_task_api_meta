import * as jsonwebtoken from 'jsonwebtoken';

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

    const decodedToken: TokenBody = this._decodeToken(identity.token);
    const identityName: string = decodedToken.sub;

    const claimConfig: Array<string> = this.claimConfigs[identityName];

    const userHasClaim: boolean = claimConfig.some((claim: string): boolean => {
      return claim === requiredClaimName;
    });

    if (!userHasClaim) {
      throw new ForbiddenError('Access denied');
    }
  }

  private _decodeToken(token: string): TokenBody {
    const decodedToken: TokenBody = <TokenBody> jsonwebtoken.decode(token);

    return decodedToken;
  }
}
