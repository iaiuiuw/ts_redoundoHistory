export default class EventCenter {
  /** 监听数组 */
  private listeners = {};

  // private static _instance = null;
  // public static get instance(): EventCenter {
  //     if (!this._instance || this._instance == null) {
  //         this._instance = new EventCenter();
  //     }
  //     return this._instance;
  // }

  /**
   * 注册事件
   * @param name 事件名称
   * @param callback 回调函数
   * @param context 上下文
   */
  public addListener(name: string, callback: Function, context: any) {
    let observers: Observer[] = this.listeners[name];
    if (!observers) {
      this.listeners[name] = [];
    }
    this.listeners[name].push(new Observer(callback, context));
  }

  /**
   * 移除事件
   * @param name 事件名称
   * @param callback 回调函数
   * @param context 上下文
   */
  public removeListener(name: string, context: any) {
    let observers: Observer[] = this.listeners[name];
    if (!observers) return;
    let length = observers.length;
    for (let i = 0; i < length; i++) {
      let observer = observers[i];
      if (observer.compar(context)) {
        observers.splice(i, 1);
        break;
      }
    }
    if (observers.length == 0) {
      delete this.listeners[name];
    }
  }

  /**
   * 发送事件
   * @param name 事件名称
   */
  public fire(name: string, ...args: any[]) {
    let observers: Observer[] = this.listeners[name];
    if (!observers) return;
    let length = observers.length;
    for (let i = 0; i < length; i++) {
      let observer = observers[i];
      observer.notify(name, ...args);
    }
  }
}

/**
 * 观察者
 */
class Observer {
  /** 回调函数 */
  private callback: Function = null;
  /** 上下文 */
  private context: any = null;

  constructor(callback: Function, context: any) {
    let self = this;
    self.callback = callback;
    self.context = context;
  }

  /**
   * 发送通知
   * @param args 不定参数
   */
  notify(...args: any[]): void {
    let self = this;
    self.callback.call(self.context, ...args);
  }

  /**
   * 上下文比较
   * @param context 上下文
   */
  compar(context: any): boolean {
    return context == this.context;
  }
}
