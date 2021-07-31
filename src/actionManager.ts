import IAction from './IAction';
import Transaction from './transaction';
import { IActionHistory } from './history/IActionHistory';
import SimpleHistory from './history/SimpleHistory';
import EventCenter from './eventCenter'

export default class ActionManager {
  private static _defaultinstance: ActionManager;

  static readonly E_UndoBufferChanged: string = 'UndoBufferChanged';

  constructor() {
    this.History = new SimpleHistory();
    this.Events = new EventCenter();
  }

  static get Instance(): ActionManager {
    if (ActionManager._defaultinstance == null)
      ActionManager._defaultinstance = new ActionManager();
    return ActionManager._defaultinstance;
  }

  //#region Events

  Events: EventCenter;

  RaiseUndoBufferChanged() {
    this.Events.fire(ActionManager.E_UndoBufferChanged);
  }

  AddUndoBufferChangedListener(func: Function, context: any) {
    this.Events.addListener(ActionManager.E_UndoBufferChanged, func, context);
  }

  RemoveUndoBufferChangedListener(context: any) {
    this.Events.removeListener(ActionManager.E_UndoBufferChanged, context);
  }

  //#endregion

  //#region RecordAction
  //#region Running

  CurrentAction: IAction;

  get ActionIsExecuting(): boolean {
    return this.CurrentAction != null;
  }

  //#endregion

  /// <summary>
  /// Defines whether we should record an action to the Undo buffer and then execute,
  /// or just execute it without it becoming a part of history
  /// </summary>

  RecordImmediatelyWithoutExecuting: boolean;
  ExcuteWithoutPutInHistory: boolean;

  /// <summary>
  /// Central method to add and execute a new action.
  /// </summary>
  /// <param name="existingAction">An action to be recorded in the buffer and executed</param>
  public RecordAction(action: IAction): void {
    if (action == null) {
      throw new Error(
        'ActionManager.RecordAction: the action argument is null',
      );
    }
    // make sure we're not inside an Undo or Redo operation
    this.CheckNotRunningBeforeRecording(action);

    action.UpdateTime = new Date();

    // Check if we're inside a transaction that is being recorded
    var currentTransaction: Transaction = this.RecordingTransaction;
    if (currentTransaction != null) {
      // if we're inside a transaction, just add the action to the transaction's list
      currentTransaction.Add(action);
      currentTransaction.UpdateTime = new Date();
      if (currentTransaction.ExcuteBeforeCommit) {
        //在事务提交之前执行子任务
        action.Execute();
      }
    } else {
      if (this.RecordImmediatelyWithoutExecuting) action.HasExecuted = true;
      if (this.ExcuteWithoutPutInHistory)
        //只作执行不记录
        action.Execute();
      else this.RunActionAndAddToHistory(action);
    }
  }

  CheckNotRunningBeforeRecording(candidate: IAction): void {
    if (this.CurrentAction != null) {
      var candidateActionName: string =
        candidate != null ? candidate.ActionDesc : '';
      throw new Error(
        'ActionManager.RecordActionDirectly: the ActionManager is currently running ' +
        `or undoing an action (${this.CurrentAction.ActionDesc}), and this action (while being executed) attempted ` +
        `to recursively record another action (${candidateActionName}), which is not allowed. ` +
        'You can examine the stack trace of this exception to see what the ' +
        'executing action did wrong and change this action not to influence the ' +
        'Undo stack during its execution. Checking if ActionManager.ActionIsExecuting == true ' +
        'before launching another transaction might help to avoid the problem. Thanks and sorry for the inconvenience.',
      );
    }
  }
  RunActionAndAddToHistory(actionToRun: IAction): void {
    this.CheckNotRunningBeforeRecording(actionToRun);

    this.CurrentAction = actionToRun;
    try {
      if (this.History.AppendAction(actionToRun)) {
        this.History.MoveForward();
      }
    } finally {
      this.CurrentAction = null;
    }
  }

  //#endregion

  //#region Transactions

  CreateTransaction(tag: string = null): Transaction {
    var transaction = Transaction.Create(this);
    transaction.Tag = tag;
    return transaction;
  }

  private mTransactionStack: Array<Transaction> = [];
  public get TransactionStack(): Array<Transaction> {
    return this.mTransactionStack;
  }

  public get RecordingTransaction(): Transaction {
    if (this.TransactionStack.length > 0) {
      return this.TransactionStack[this.TransactionStack.length - 1];
    }
    return null;
  }

  public OpenTransaction(t: Transaction) {
    this.TransactionStack.push(t);
  }

  public CommitTransaction(...raiseActions: (() => void)[]) {
    if (this.TransactionStack.length == 0) {
      throw new Error(
        'ActionManager.CommitTransaction was called' +
        ' when there is no open transaction (TransactionStack is empty).' +
        ' Please examine the stack trace of this exception to find code' +
        ' which called CommitTransaction one time too many.' +
        " Normally you don't call OpenTransaction and CommitTransaction directly," +
        ' but use using(var t = Transaction.Create(Root)) instead.',
      );
    }

    var committing: Transaction = this.TransactionStack.pop();
    committing.RaiseActions = [
      ...(committing.RaiseActions || []),
      ...raiseActions,
    ];

    if (committing.HasActions()) {
      if (committing.Actions.length > 1 || committing.RaiseActions != null)
        this.RecordAction(committing);
      else this.RecordAction(committing.Actions[0]); //防止浪费事务
    }
  }

  public RollBackTransaction(): void {
    if (this.TransactionStack.length != 0) {
      var topLevelTransaction = this.RecordingTransaction;
      if (topLevelTransaction != null) {
        topLevelTransaction.UnExecute();
      }

      this.TransactionStack.pop();
    }
  }
  //#endregion

  //#region Undo, Redo
  public Undo(): void {
    if (!this.CanUndo) {
      return;
    }
    if (this.ActionIsExecuting) {
      throw new Error(
        'ActionManager is currently busy' +
        ` executing a transaction (${this.CurrentAction?.ActionDesc}). This transaction has called Undo()` +
        ' which is not allowed until the transaction ends.' +
        ' Please examine the stack trace of this exception to see' +
        ' what part of your code called Undo.',
      );
    }
    this.CurrentAction = this.History.CurrentState.PreviousAction;
    this.History.MoveBack();
    this.CurrentAction = null;
  }

  public Redo(): void {
    if (!this.CanRedo) {
      return;
    }
    if (this.ActionIsExecuting) {
      throw new Error(
        'ActionManager is currently busy' +
        ` executing a transaction (${this.CurrentAction?.ActionDesc}). This transaction has called Redo()` +
        ' which is not allowed until the transaction ends.' +
        ' Please examine the stack trace of this exception to see' +
        ' what part of your code called Redo.',
      );
    }
    this.CurrentAction = this.History.CurrentState.NextAction;
    this.History.MoveForward();
    this.CurrentAction = null;
  }

  get CanUndo(): boolean {
    return this.History.CanMoveBack;
  }

  get CanRedo(): boolean {
    return this.History.CanMoveForward;
  }

  //#endregion

  //#region Buffer
  Clear() {
    this.History.Clear();
    this.CurrentAction = null;
  }

  public static UseNewInstance(): void {
    if (this._defaultinstance != null) {
      this._defaultinstance.Clear();
    }
    this._defaultinstance = new ActionManager();
  }

  public EnumUndoableActions(): IAction[] {
    return this.History.EnumUndoableActions();
  }

  public EnumRedoableActions(): IAction[] {
    return this.History.EnumRedoableActions();
  }

  private mHistory: IActionHistory;
  public get History(): IActionHistory {
    return this.mHistory;
  }

  public set History(v: IActionHistory) {
    if (this.mHistory != null) {
      this.mHistory.Events?.removeListener('historyChanged', this);
    }
    this.mHistory = v;
    if (this.mHistory != null) {
      this.mHistory.Events?.addListener(
        'historyChanged',
        this.RaiseUndoBufferChanged,
        this,
      );
    }
  }

  //#endregion
}
