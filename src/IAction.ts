export default interface IAction {
  ActionDesc: string;
  UpdateTime: Date;
  HasExecuted: boolean;
  Execute(): void;
  UnExecute(): void;
  CheckAutoNext(): boolean;
  CanExecute(): boolean;
  CanUnExecute(): boolean;
  TryToMerge(followingAction: IAction): boolean;
  AllowToMergeWithPrevious: boolean;
}
