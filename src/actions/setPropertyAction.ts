import AbstractAction from '../abstractAction';
import IAction from '../IAction';
import RUHelper from '../redoUndoHelper';

export default class SetPropertyAction extends AbstractAction {
  constructor(parentObj: any, propName: string, value: any, oldValue: any) {
    super();

    if (!parentObj || !propName)
      throw new Error('SetPropertyAction 不能记录对空对象或空属性的操作');
    this.ParentObject = parentObj;
    this.Property = propName;
    this.Value = value;
    this.OldValue = oldValue;
    // if ( oldValue != undefined)
    // else this.OldValue = Reflect.get(parentObj, propName);
  }

  ParentObject: any;
  Property: string;
  Value: any;
  OldValue: any;

  protected ExecuteCore(): void {
    if (!RUHelper.isEqual(this.OldValue, this.Value))
      Reflect.set(this.ParentObject, this.Property, this.Value);
  }
  protected UnExecuteCore(): void {
    Reflect.set(this.ParentObject, this.Property, this.OldValue);
  }

  public TryToMerge(followingAction: IAction): boolean {
    var next = followingAction as SetPropertyAction;
    if (
      next != null &&
      next.ParentObject == this.ParentObject &&
      next.Property == this.Property &&
      next.UpdateTime.getTime() - this.UpdateTime.getTime() < 600
    ) {
      this.Value = next.Value;
      Reflect.set(this.ParentObject, this.Property, this.Value);
      this.UpdateTime = next.UpdateTime;
      return true;
    }
    return false;
  }
}
