import { IActionHistory } from './IActionHistory';
import SimpleHistoryNode from './SimpleHistoryNode';
import { InvalidOperationException } from 'linq-to-typescript';
import IAction from '../IAction';
import EventCenter from '@/utils/eventCenter';

export default class SimpleHistory implements IActionHistory {
  constructor() {
    this.Init();
  }

  //#region Events

  Events: EventCenter = new EventCenter();

  protected RaiseUndoBufferChanged(): void {
    this.Events.fire('historyChanged');
  }
  //#endregion

  private mCurrentState: SimpleHistoryNode = new SimpleHistoryNode();
  /// <summary>
  /// "Iterator" to navigate through the sequence, "Cursor"
  /// </summary>
  public get CurrentState(): SimpleHistoryNode {
    return this.mCurrentState;
  }

  public set CurrentState(v: SimpleHistoryNode) {
    if (v != null) {
      this.mCurrentState = v;
    } else {
      throw new Error('RedoUndo:CurrentState 不能为null');
    }
  }

  public Head: SimpleHistoryNode;
  public LastAction: IAction;

  /// <summary>
  /// Adds a new action to the tail after current state. If
  /// there exist more actions after this, they're lost (Garbage Collected).
  /// This is the only method of this class that actually modifies the linked-list.
  /// </summary>
  /// <param name="newAction">Action to be added.</param>
  /// <returns>true if action was appended, false if it was merged with the previous one</returns>
  public AppendAction(newAction: IAction): boolean {
    if (
      this.CurrentState.PreviousAction != null &&
      this.CurrentState.PreviousAction.TryToMerge(newAction)
    ) {
      this.RaiseUndoBufferChanged();
      return false;
    }
    this.CurrentState.NextAction = newAction;
    this.CurrentState.NextNode = new SimpleHistoryNode(
      newAction,
      this.CurrentState,
    );
    return true;
  }

  /// <summary>
  /// All existing Nodes and Actions are garbage collected.
  /// </summary>
  public Clear() {
    this.Init();
    this.RaiseUndoBufferChanged();
  }

  private Init() {
    this.CurrentState = new SimpleHistoryNode();
    this.Head = this.CurrentState;
    this.Length = 0;
  }

  public EnumUndoableActions(): IAction[] {
    var current = this.Head;
    var result: IAction[] = [];
    while (
      current != null &&
      current != this.CurrentState &&
      current.NextAction != null
    ) {
      result.push(current.NextAction);
      current = current.NextNode;
    }
    return result;
  }

  public EnumRedoableActions(): IAction[] {
    var current = this.CurrentState;
    var result: IAction[] = [];
    while (current != null && current.NextAction != null) {
      result.push(current.NextAction);
      current = current.NextNode;
    }
    return result;
  }

  public MoveForward() {
    if (!this.CanMoveForward) {
      throw new InvalidOperationException(
        'History.MoveForward() cannot execute because' +
          ' CanMoveForward returned false (the current state' +
          ' is the last state in the undo buffer.',
      );
    }
    if (!this.CurrentState.NextAction.HasExecuted) {
      this.CurrentState.NextAction.Execute();
    }
    this.CurrentState = this.CurrentState.NextNode;
    this.Length += 1;
    this.RaiseUndoBufferChanged();

    if (this.CurrentState.PreviousAction.CheckAutoNext() && this.CanMoveForward)
      this.MoveForward();
  }

  public MoveBack() {
    if (!this.CanMoveBack) {
      throw new InvalidOperationException(
        'History.MoveBack() cannot execute because' +
          ' CanMoveBack returned false (the current state' +
          ' is the last state in the undo buffer.',
      );
    }
    this.CurrentState.PreviousAction.UnExecute();
    this.CurrentState.PreviousAction.HasExecuted = false;
    this.CurrentState = this.CurrentState.PreviousNode;
    this.Length -= 1;
    this.RaiseUndoBufferChanged();

    if (this.CurrentState.NextAction.CheckAutoNext() && this.CanMoveBack)
      this.MoveBack();
  }

  public get CanMoveForward(): boolean {
    return (
      this.CurrentState.NextAction != null && this.CurrentState.NextNode != null
    );
  }

  public get CanMoveBack(): boolean {
    return (
      this.CurrentState.PreviousAction != null &&
      this.CurrentState.PreviousNode != null
    );
  }

  Length: number;
}
