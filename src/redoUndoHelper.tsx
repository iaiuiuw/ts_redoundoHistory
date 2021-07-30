import ActionManager from './actionManager';
import IAction from './IAction';
import SetPropertyAction from './actions/setPropertyAction';
import CommonAction from './actions/commonAction';
import IPropUndoable from './IPropUndoable';
import { object } from 'prop-types';
import Transaction from './transaction';

export default class RUHelper {
  //#region 简化后的静态方法

  public static get Core() {
    return ActionManager.Instance;
  }

  public static Execute(action: IAction): void {
    var actionManager = ActionManager.Instance;
    if (actionManager == null) {
      actionManager.RecordAction(action);
    } else {
      actionManager.RecordAction(action);
    }
  }

  public static TryReopenLastTranscation() {
    var transaction: Transaction = null;
    if (RUHelper.Core.TransactionStack.length == 0) {
      var oldAction = RUHelper.Core.History.CurrentState.PreviousAction;
      var now = new Date();
      if (
        oldAction &&
        oldAction instanceof Transaction &&
        now.getTime() - oldAction.UpdateTime.getTime() < 200
      ) {
        transaction = oldAction;
        RUHelper.Core.OpenTransaction(transaction);
      }
    }
    return transaction;
  }

  public static SetProperty(
    instance: any,
    propertyName: string,
    value: any,
    oldValue: any,
    hasExcuted: boolean = false,
  ): void {
    let action = new SetPropertyAction(instance, propertyName, value, oldValue);
    action.HasExecuted = hasExcuted;
    RUHelper.Execute(action);
  }

  public static AddItem<T>(list: Array<T>, item: T, index: number = -1): void {
    if (list) {
      var action = new CommonAction<T>(
        t => {
          if (list) {
            if (index >= 0 && index < list.length) list.splice(index, 0, t);
            else list.push(t);
          }
        },
        t => {
          if (list && list.includes(t)) {
            var index = list.indexOf(t);
            if (index >= 0) list.splice(index, 1);
          }
        },
        item,
      );
      RUHelper.Execute(action);
    }
  }

  public static RemoveItem<T>(list: T[], item: T): void {
    if (list && list.includes(item)) {
      var index = list.indexOf(item);
      var action = new CommonAction<T>(
        t => list.splice(index, 1),
        t => list.splice(index, 0, t),
        item,
      );
      RUHelper.Execute(action);
    }
  }

  public static RemoveItemAt<T>(list: T[], index: number): void {
    if (list && index >= 0 && index < list.length) {
      var item = list[index];
      var action = new CommonAction<T>(
        t => list.splice(index, 1),
        t => list.splice(index, 0, t),
        item,
      );
      RUHelper.Execute(action);
    }
  }

  //#endregion

  //#region 针对IPropUndoable的函数

  static isEqual = function(value, other) {
    if (value == other) return true;
    if ((value != null && other == null) || (value == null && other != null))
      return false;

    // Get the value type
    var type = Object.prototype.toString.call(value);

    // If the two objects are not the same type, return false
    if (type !== Object.prototype.toString.call(other)) return false;

    // If items are not an object or array, return false
    if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

    // Compare the length of the length of the two items
    var valueLen =
      type === '[object Array]' ? value.length : Object.keys(value).length;
    var otherLen =
      type === '[object Array]' ? other.length : Object.keys(other).length;
    if (valueLen !== otherLen) return false;

    // Compare two items
    var compare = function(item1, item2) {
      // Get the object type
      var itemType = Object.prototype.toString.call(item1);

      // If an object or array, compare recursively
      if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
        if (!RUHelper.isEqual(item1, item2)) return false;
      }

      // Otherwise, do a simple comparison
      else {
        // If the two items are not the same type, return false
        if (itemType !== Object.prototype.toString.call(item2)) return false;

        // Else if it's a function, convert to a string and compare
        // Otherwise, just compare
        if (itemType === '[object Function]') {
          if (item1.toString() !== item2.toString()) return false;
        } else {
          if (item1 !== item2) return false;
        }
      }
    };

    // Compare properties
    if (type === '[object Array]') {
      for (var i = 0; i < valueLen; i++) {
        if (compare(value[i], other[i]) === false) return false;
      }
    } else {
      for (var key in value) {
        if (value.hasOwnProperty(key)) {
          if (compare(value[key], other[key]) === false) return false;
        }
      }
    }

    // If nothing failed, return true
    return true;
  };

  public static TryRecordRedoUndo<T extends IPropUndoable>(
    obj: T,
    propertyName: string,
    newValue: any,
    oldValue: any,
    hasExcuted: boolean = false,
  ): void {
    if (obj.CanRecordRedoUndo && !ActionManager.Instance.ActionIsExecuting) {
      RUHelper.SetProperty(obj, propertyName, newValue, oldValue, hasExcuted);
    }
  }

  public static TrySetPropRedoUndo<T extends IPropUndoable>(
    obj: T,
    propertyName: string,
    settingAction: () => void,
    newValue: any,
    oldValue: any,
  ): boolean {
    if (newValue == oldValue) return false;
    if (!RUHelper.isEqual(newValue, oldValue)) {
      RUHelper.Core.CreateTransaction();
      settingAction.call(obj);
      RUHelper.TryRecordRedoUndo(obj, propertyName, newValue, oldValue, true);
      RUHelper.Core.CommitTransaction();
      return true;
    }
    return false;
  }
  //#endregion
}
