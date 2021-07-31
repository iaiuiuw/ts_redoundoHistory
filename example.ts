import CallMethodAction from "./src/actions/callMethodAction";
import IPropUndoable from "./src/IPropUndoable";
import RUHelper from "./src/redoUndoHelper";

class SimpleClass implements IPropUndoable {

    public inited: boolean = false;


    get CanRecordRedoUndo(): boolean {
        return this.inited; //if true the propertyChange can be redoundo,else the propertyChange without redo/undo
    }


    //#region  properties and actions

    private _PropA!: string;
    public get PropA(): string {
        return this._PropA;
    }
    public set PropA(v: string) {
        RUHelper.TrySetPropRedoUndo(this, "PropA", () => {
            this._PropA = v
        }, v, this._PropA);
    }


    private _PropB!: number;
    public get PropB(): number {
        return this._PropB;
    }
    public set PropB(v: number) {
        RUHelper.TrySetPropRedoUndo(this, "PropB", () => {
            this._PropB = v
        }, v, this._PropB);
    }


    public ArrayItems: string[] = [];

    public addItem(str: string) {
        RUHelper.AddItem(this.ArrayItems, str);
    }

    public removeItem(str: string) {
        RUHelper.RemoveItem(this.ArrayItems, str);
    }

    //#endregion


    //#region  tests

    public testTransaction(): void {

        console.log('start Test Transaction...')

        RUHelper.Core.CreateTransaction();

        console.log('Transaction created')

        //RUHelper.Core.RecordAction(new CallMethodAction(this.Print, this.Print, this));




        this.PropA = 'tttt--testTransaction111';
        this.PropB = 3;

        this.addItem("good job");




        RUHelper.Core.CommitTransaction(() => {
            console.log("Test Transaction Redo/Undo Completed");
        })
    }

    public Print(str = '') {
        console.log(`${str || 'state'}---PropA:${this.PropA},PropB:${this.PropB},ArrayItems:[${this.ArrayItems}]`);
    }

    public Undo() {
        console.log("start undo");
        RUHelper.Core.Undo();
        console.log("undo Complete");
    }
    public Redo() {
        console.log("start redo");
        RUHelper.Core.Redo();
        console.log("redo Complete");
    }

    //#endregion
}


var sample = Object.assign(new SimpleClass(), { PropA: "startvalue", PropB: 1 });

sample.Print('before,init');
sample.PropA = 'initedVaule2222';
sample.Undo();//this Undo is not work
sample.Print('not work undo');

sample.inited = true;//only inited can redo/undo

sample.testTransaction();
//sample.PropA = '123';
sample.Print('transaction result');
sample.Undo();
sample.Print('undo result');
sample.Redo();
sample.Print('redo result');
