import IAction from './IAction';

export default abstract class AbstractAction implements IAction {
  private _ActionDesc: string;
  public get ActionDesc(): string {
    return this._ActionDesc;
  }
  public set ActionDesc(v: string) {
    this._ActionDesc = v;
  }

  private _UpdateTime: Date = new Date();
  public get UpdateTime(): Date {
    return this._UpdateTime;
  }
  public set UpdateTime(v: Date) {
    this._UpdateTime = v;
  }

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

  Execute(): void {
    if (!this.CanExecute()) return;
    try {
      this.ExecuteCore();
      this.ExecuteCount++;
    } catch (e) {
      console.log(e);
    }
  }

  protected abstract ExecuteCore(): void;

  public UnExecute() {
    if (!this.CanUnExecute()) {
      return;
    }
    try {
      this.UnExecuteCore();
      this.ExecuteCount--;
    } catch (ex) {
      console.log(ex.Message);
    }
  }
  protected abstract UnExecuteCore(): void;

  public CheckAutoNext(): boolean {
    return false;
  }

  public CanExecute(): boolean {
    return !this.HasExecuted;
  }

  public CanUnExecute(): boolean {
    return this.HasExecuted;
  }

  /// <summary>
  /// If the last action can be joined with the followingAction,
  /// the following action isn't added to the Undo stack,
  /// but rather mixed together with the current one.
  /// </summary>
  /// <param name="FollowingAction"></param>
  /// <returns>true if the FollowingAction can be merged with the
  /// last action in the Undo stack</returns>
  public TryToMerge(followingAction: IAction): boolean {
    return false;
  }

  /// <summary>
  /// Defines if the action can be merged with the previous one in the Undo buffer
  /// This is useful for long chains of consecutive operations of the same type,
  /// e.g. dragging something or typing some text
  /// </summary>

  private _AllowToMergeWithPrevious: boolean;
  public get AllowToMergeWithPrevious(): boolean {
    return this._AllowToMergeWithPrevious;
  }
  public set AllowToMergeWithPrevious(v: boolean) {
    this._AllowToMergeWithPrevious = v;
  }
}
