import IAction from '../IAction';

export default class SimpleHistoryNode {
  constructor(
    lastExistingAction?: IAction,
    lastExistingState?: SimpleHistoryNode,
  ) {
    this.PreviousAction = lastExistingAction;
    this.PreviousNode = lastExistingState;
  }

  PreviousAction: IAction;
  NextAction: IAction;
  PreviousNode: SimpleHistoryNode;
  NextNode: SimpleHistoryNode;
}
