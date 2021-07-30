import AbstractAction from '../abstractAction';

export default class CommonAction<T> extends AbstractAction {
  constructor(
    execute: (arg0: T) => void,
    unexecute: (arg0: T) => void,
    context: T,
    checkautonext?: (arg: T) => boolean,
    funcContext?: any,
  ) {
    super();
    this.ExecuteDelegaet = execute;
    this.UnexecuteDelegate = unexecute;
    this.CheckAutoNextDelegate = checkautonext;
    this.Context = context;
    this.FuncContext = funcContext;
  }

  ExecuteDelegaet: (arg: T) => void;
  UnexecuteDelegate: (arg: T) => void;
  CheckAutoNextDelegate: (arg: T) => boolean;
  Context: T;
  FuncContext: any;

  protected ExecuteCore(): void {
    if (!this.FuncContext) this.ExecuteDelegaet(this.Context);
    else this.ExecuteDelegaet.call(this.FuncContext, this.Context);
  }
  protected UnExecuteCore(): void {
    if (!this.FuncContext) this.UnexecuteDelegate(this.Context);
    else this.UnexecuteDelegate.call(this.FuncContext, this.Context);
  }

  public CheckAutoNext(): boolean {
    if (this.CheckAutoNextDelegate != null) {
      if (!this.FuncContext) return this.CheckAutoNextDelegate(this.Context);
      else
        return this.CheckAutoNextDelegate.call(this.FuncContext, this.Context);
    } else return false;
  }
}
