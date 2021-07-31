import AbstractAction from '../abstractAction';

export default class CallMethodAction extends AbstractAction {
  constructor(execute: () => void, unexecute: () => void, funcContext: any) {
    super();
    this.ExecuteDelegate = execute;
    this.UnexecuteDelegate = unexecute;
    this.FuncContext = funcContext;
  }

  ExecuteDelegate: () => void;
  UnexecuteDelegate: () => void;
  FuncContext: any;

  protected ExecuteCore(): void {
    if (this.FuncContext) this.ExecuteDelegate?.call(this.FuncContext);
    else this.ExecuteDelegate?.();
  }
  protected UnExecuteCore(): void {
    if (this.FuncContext) this.UnexecuteDelegate?.call(this.FuncContext);
    else this.UnexecuteDelegate?.();
  }
}
