import IAction from '../IAction';
import SimpleHistoryNode from './SimpleHistoryNode';
import EventCenter from '@/utils/eventCenter';

export interface IActionHistory {
  /// <summary>
  /// Appends an action to the end of the Undo buffer.
  /// </summary>
  /// <param name="newAction">An action to append.</param>
  /// <returns>false if merged with previous, else true</returns>
  AppendAction(newAction: IAction): boolean;
  Clear(): void;

  MoveBack(): void;
  MoveForward(): void;

  readonly CanMoveBack: boolean;
  readonly CanMoveForward: boolean;
  readonly Length: number;

  readonly CurrentState: SimpleHistoryNode;

  EnumUndoableActions(): IAction[];
  EnumRedoableActions(): IAction[];

  Events: EventCenter;
}
