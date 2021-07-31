import IAction from './IAction';
import ActionManager from './actionManager';

export default class Transaction implements IAction {
  constructor(actionManager: ActionManager) {
    this.Actions = [];
    this.ActionManager = actionManager;
    actionManager.OpenTransaction(this);
  }

  ActionDesc: string;
  Tag: string;
  UpdateTime: Date = new Date();

  private _ExcuteBeforeCommit: boolean = true;
  public get ExcuteBeforeCommit(): boolean {
    return this._ExcuteBeforeCommit;
  }
  public set ExcuteBeforeCommit(v: boolean) {
    this._ExcuteBeforeCommit = v;
  }

  public readonly Actions: IAction[] = [];
  private readonly ActionManager: ActionManager;

  private Aborted: boolean;

  AllowToMergeWithPrevious: boolean;

  CheckAutoNextDelegate: () => boolean;

  private _ExecuteCount: number = 0;
  public get ExecuteCount(): number {
    return this._ExecuteCount;
  }
  public set ExecuteCount(v: number) {
    this._ExecuteCount = v;
  }

  public get HasExecuted(): boolean {
    return this.ExecuteCount > 0;
  }
  public set HasExecuted(v: boolean) {
    if (v) this.ExecuteCount = 1;
    else this.ExecuteCount = 0;
  }

  /// <summary>
  /// 用于提交因为属性变化引起的UI变化，在Commit或RedoUndo结束时执行
  /// </summary>
  RaiseActions: (() => void)[];

  /// <summary>
  /// By default, the actions are delayed and executed only after
  /// the top-level transaction commits.
  /// </summary>
  /// <remarks>
  /// Make sure to dispose of the transaction once you're done - it will actually call Commit for you
  /// </remarks>
  /// <example>
  /// Recommended usage: using (Transaction.Create(actionManager)) { DoStuff(); }
  /// </example>
  public static Create(actionManager: ActionManager): Transaction {
    if (actionManager == null) {
      throw new Error('actionManager不能为空');
    }
    return new Transaction(actionManager);
  }

  //#region IAction implementation

  public Execute() {
    if (this.Actions != null) {
      for (let i = 0; i < this.Actions.length; i++) {
        var action = this.Actions[i];
        if (!action.HasExecuted) action.Execute();
      }
    }
    if (this.RaiseActions != null) {
      for (let i = 0; i < this.RaiseActions.length; i++) this.RaiseActions[i]();
    }
  }

  public UnExecute() {
    if (this.Actions != null) {
      for (let i = this.Actions.length - 1; i >= 0; i--) {
        var action = this.Actions[i];
        action.UnExecute();
        action.HasExecuted = false;
      }
    }
    if (this.RaiseActions != null) {
      for (const action of this.RaiseActions) action();
    }
  }

  public CanExecute(): boolean {
    if (this.Actions != null) {
      for (let i = 0; i < this.Actions.length; i++) {
        var action = this.Actions[i];
        if (!action.CanExecute()) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  public CanUnExecute(): boolean {
    if (this.Actions != null) {
      for (let i = this.Actions.length - 1; i >= 0; i--) {
        var action = this.Actions[i];
        if (!action.CanUnExecute()) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  public CheckAutoNext(): boolean {
    if (this.CheckAutoNextDelegate != null) return this.CheckAutoNextDelegate();
    else return false;
  }

  public TryToMerge(followingAction: IAction): boolean {
    var next = followingAction as Transaction;
    if (next == this) {
      //如果是重新打开的自己，默认已合并
      return true;
    }
    if (
      next != null &&
      ((this.Tag && this.Tag != '' && next.Tag == this.Tag) ||
        next.Tag == '#merge') &&
      next.UpdateTime.getTime() - this.UpdateTime.getTime() < 600
    ) {
      this.Add(followingAction);
      followingAction.Execute();
      this.UpdateTime = next.UpdateTime;
      return true;
    }
    return false;
  }

  //#endregion

  public Commit(...raiseActions: (() => void)[]) {
    this.ActionManager.CommitTransaction(...raiseActions);
  }

  public Rollback() {
    this.ActionManager.RollBackTransaction();
    this.Aborted = true;
  }

  public Dispose() {
    if (!this.Aborted) {
      this.Commit();
    }
  }

  public Add(actionToAppend: IAction) {
    if (actionToAppend == null) {
      throw new Error('actionToAppend 不能加入空的操作');
    }
    this.Actions.push(actionToAppend);
  }

  public HasActions(): boolean {
    return this.Actions.length != 0;
  }

  public Remove(actionToCancel: IAction) {
    if (actionToCancel == null) {
      throw new Error('actionToAppend 不能去除空的操作');
    }
    var index = this.Actions.indexOf(actionToCancel);
    if (index >= 0 && index < this.Actions.length)
      this.Actions.splice(index, 1);
  }
}
