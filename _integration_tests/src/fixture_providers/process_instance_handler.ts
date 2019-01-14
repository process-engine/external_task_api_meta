'use strict';

import {EventReceivedCallback, IEventAggregator} from '@essential-projects/event_aggregator_contracts';
import {ExternalTask, IExternalTaskRepository} from '@process-engine/external_task_api_contracts';
import {IFlowNodeInstanceService, Runtime} from '@process-engine/process_engine_contracts';

import {TestFixtureProvider} from './test_fixture_provider';

/**
 * This class handles the creation of ProcessInstances and waits for a ProcessInstance to reach a suspended ServiceTask.
 *
 * Only to be used in conjunction with the user task tests.
 */
export class ProcessInstanceHandler {

  private _eventAggregator: IEventAggregator;
  private _testFixtureProvider: TestFixtureProvider;

  constructor(testFixtureProvider: TestFixtureProvider) {
    this._testFixtureProvider = testFixtureProvider;
  }

  private get eventAggregator(): IEventAggregator {
    if (!this._eventAggregator) {
      this._eventAggregator = this.testFixtureProvider.resolve<IEventAggregator>('EventAggregator');
    }

    return this._eventAggregator;
  }

  private get testFixtureProvider(): TestFixtureProvider {
    return this._testFixtureProvider;
  }

  public async waitForProcessInstanceToReachSuspendedTask(
    correlationId: string,
    processModelId?: string,
    expectedNumberOfWaitingTasks: number = 1,
  ): Promise<void> {

    const maxNumberOfRetries: number = 60;
    const delayBetweenRetriesInMs: number = 200;

    const flowNodeInstanceService: IFlowNodeInstanceService = this.testFixtureProvider.resolve<IFlowNodeInstanceService>('FlowNodeInstanceService');

    for (let i: number = 0; i < maxNumberOfRetries; i++) {

      await this.wait(delayBetweenRetriesInMs);

      let flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = await flowNodeInstanceService.querySuspendedByCorrelation(correlationId);

      if (processModelId) {
        flowNodeInstances = flowNodeInstances.filter((fni: Runtime.Types.FlowNodeInstance) => {
          return fni.tokens[0].processModelId === processModelId;
        });
      }

      const enoughWaitingTasksFound: boolean = flowNodeInstances.length >= expectedNumberOfWaitingTasks;
      if (enoughWaitingTasksFound) {
        return;
      }
    }

    throw new Error(`No process instance within correlation '${correlationId}' found! The process instance likely failed to start!`);
  }

  public async waitForExternalTaskToBeCreated(topicName: string, maxTask: number = 100): Promise<void> {

    const maxNumberOfRetries: number = 60;
    const delayBetweenRetriesInMs: number = 200;

    const externalTaskRepository: IExternalTaskRepository = this.testFixtureProvider.resolve<IExternalTaskRepository>('ExternalTaskRepository');

    for (let i: number = 0; i < maxNumberOfRetries; i++) {

      await this.wait(delayBetweenRetriesInMs);

      const externalTasks: Array<ExternalTask<any>> = await externalTaskRepository.fetchAvailableForProcessing(topicName, maxTask);

      if (externalTasks.length >= 1) {
        return;
      }
    }

    throw new Error(`No ExternalTasks for topic '${topicName}' found! It is likely that creating the ExternalTask failed!`);
  }

  /**
   * There is a gap between the finishing of ManualTasks/UserTasks and the end
   * of the ProcessInstance.
   * Mocha resolves and disassembles the backend BEFORE the process was finished,
   * which leads to inconsistent database entries.
   * To avoid a messed up database that could break other tests, we must wait for
   * each ProcessInstance to finishe before progressing.
   *
   * @param correlationId  The correlation in which the process runs.
   * @param processModelId The id of the process model to wait for.
   * @param resolveFunc    The function to call when the process was finished.
   */
  public waitForProcessInstanceToEnd(correlationId: string, processModelId: string, resolveFunc: EventReceivedCallback): void {
    const endMessageToWaitFor: string = `/processengine/correlation/${correlationId}/processmodel/${processModelId}/ended`;
    this.eventAggregator.subscribeOnce(endMessageToWaitFor, resolveFunc);
  }

  public waitForProcessByInstanceIdToEnd(processInstanceId: string, resolveFunc: EventReceivedCallback): void {
    const endMessageToWaitFor: string = `/processengine/process/${processInstanceId}/ended`;
    this.eventAggregator.subscribeOnce(endMessageToWaitFor, resolveFunc);
  }

  /**
   * Delays test execution by the given amount of time.
   *
   * @async
   * @param delayTimeInMs The amount of time in ms by which to delay
   *                      test execution.
   */
  public async wait(delayTimeInMs: number): Promise<void> {
    await new Promise((resolve: Function): void => {
      setTimeout(() => {
        resolve();
      }, delayTimeInMs);
    });
  }

}
