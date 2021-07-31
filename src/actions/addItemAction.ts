import AbstractAction from '../abstractAction';

export default class AddItemAction<T> extends AbstractAction {
  constructor(
    adder: (arg0: number, arg1: T) => void,
    remover: (arg: T) => void,
    item: T,
    index: number = -1,
  ) {
    super();
    this.Adder = adder;
    this.Remover = remover;
    this.Item = item;
    this.Index = index;
  }

  Adder: (arg0: number, arg1: T) => void;

  Remover: (arg: T) => void;
  Item: T;
  Index: number;

  protected ExecuteCore(): void {
    if (this.Index >= 0) this.Adder(this.Index, this.Item);
    // else if(this.Adder.caller)
    //   (this.Adder.caller as unknown as Array<T>)?.push(this.Item);
  }
  protected UnExecuteCore(): void {
    this.Remover(this.Item);
  }
}
