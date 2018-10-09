import * as fs from 'fs';
import * as path from 'path';

import {InvocationContainer} from 'addict-ioc';

import {Logger} from 'loggerhythm';
const logger: Logger = Logger.createLogger('test:bootstrapper');

import {AppBootstrapper} from '@essential-projects/bootstrapper_node';
import {IIdentity} from '@essential-projects/iam_contracts';

import {IExternalTaskApi} from '@process-engine/external_task_api_contracts';
import {
  IExecuteProcessService,
  IProcessModelService,
  Model,
} from '@process-engine/process_engine_contracts';

import {initializeBootstrapper} from './setup_ioc_container';

export type IdentityCollection = {
  defaultUser: IIdentity;
  restrictedUser: IIdentity;
};

export class TestFixtureProvider {

  private bootstrapper: AppBootstrapper;
  private container: InvocationContainer;

  private _executeProcessService: IExecuteProcessService;
  private _externalTaskApiClientService: IExternalTaskApi;
  private _processModelService: IProcessModelService;

  private _identities: IdentityCollection;

  public get identities(): IdentityCollection {
    return this._identities;
  }

  public get executeProcessService(): IExecuteProcessService {
    return this._executeProcessService;
  }

  public get externalTaskApiClientService(): IExternalTaskApi {
    return this._externalTaskApiClientService;
  }

  public get processModelService(): IProcessModelService {
    return this._processModelService;
  }

  public async initializeAndStart(): Promise<void> {

    await this._initializeBootstrapper();

    await this.bootstrapper.start();

    await this._createMockIdentities();

    this._executeProcessService = await this.resolveAsync<IExecuteProcessService>('ExecuteProcessService');
    this._externalTaskApiClientService = await this.resolveAsync<IExecuteProcessService>('ExternalTaskApiClientService');
    this._processModelService = await this.resolveAsync<IProcessModelService>('ProcessModelService');
  }

  public async tearDown(): Promise<void> {
    const httpExtension: any = await this.container.resolveAsync('HttpExtension');
    await httpExtension.close();
    await this.bootstrapper.stop();
  }

  public async resolveAsync<T>(moduleName: string, args?: any): Promise<any> {
    return this.container.resolveAsync<T>(moduleName, args);
  }

  public async importProcessFiles(processFileNames: Array<string>): Promise<void> {

    for (const processFileName of processFileNames) {
      await this._registerProcess(processFileName);
    }
  }

  public readProcessModelFile(processFileName: string): string {

    const bpmnFolderPath: string = this.getBpmnDirectoryPath();
    const fullFilePath: string = path.join(bpmnFolderPath, `${processFileName}.bpmn`);

    const fileContent: string = fs.readFileSync(fullFilePath, 'utf-8');

    return fileContent;
  }

  public getBpmnDirectoryPath(): string {

    const bpmnDirectoryName: string = 'bpmn';
    let rootDirPath: string = process.cwd();
    const integrationTestDirName: string = '_integration_tests';

    if (!rootDirPath.endsWith(integrationTestDirName)) {
      rootDirPath = path.join(rootDirPath, integrationTestDirName);
    }

    return path.join(rootDirPath, bpmnDirectoryName);
  }

  public async executeProcess(identity: IIdentity,
                              processKey: string,
                              startEventKey: string,
                              correlationId: string,
                              initialToken: any = {}): Promise<any> {

    const processModel: Model.Types.Process = await this._getProcessById(processKey);

    return this
      .executeProcessService
      .startAndAwaitEndEvent(identity, processModel, startEventKey, correlationId, initialToken);
  }

  private async _initializeBootstrapper(): Promise<void> {

    try {
      this.container = await initializeBootstrapper();

      const appPath: string = path.resolve(__dirname);
      this.bootstrapper = await this.container.resolveAsync<AppBootstrapper>('AppBootstrapper', [appPath]);

      logger.info('Bootstrapper started.');
    } catch (error) {
      logger.error('Failed to start bootstrapper!', error);
      throw error;
    }
  }

  private async _createMockIdentities(): Promise<void> {

    this._identities = {
      // all access user
      defaultUser: await this._createIdentity('defaultUser'),
      // no access user
      restrictedUser: await this._createIdentity('restrictedUser'),
    };
  }

  private async _createIdentity(username: string): Promise<IIdentity> {

    // Note: Since the iam facade is mocked, it doesn't matter what type of token is used here.
    // It only matters that one is present.
    return <IIdentity> {
      token: username,
    };
  }

  private async _registerProcess(processFileName: string): Promise<void> {
    const xml: string = this._readProcessModelFromFile(processFileName);
    await this.processModelService.persistProcessDefinitions(this.identities.defaultUser, processFileName, xml, true);
  }

  private _readProcessModelFromFile(fileName: string): string {

    const bpmnFolderLocation: string = this.getBpmnDirectoryPath();
    const processModelPath: string = path.join(bpmnFolderLocation, `${fileName}.bpmn`);

    const processModelAsXml: string = fs.readFileSync(processModelPath, 'utf-8');

    return processModelAsXml;
  }

  private async _getProcessById(processId: string): Promise<Model.Types.Process> {

    const processModel: Model.Types.Process = await this.processModelService.getProcessModelById(this.identities.defaultUser, processId);

    return processModel;
  }
}
