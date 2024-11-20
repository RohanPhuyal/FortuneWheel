// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class LoadingMenuManager extends cc.Component {

    @property (cc.ProgressBar) progressBar: cc.ProgressBar = null;
    @property (cc.Node) loadingText: cc.Node = null;
    public loaded=false;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.startLoading();
    }

    private startLoading(){
        this.progressBar.progress=0;
        cc.tween(this.progressBar)
        .to(3,{progress:1})
        .call(()=>this.startGame())
        .start();
    }
    private startGame(){
        this.loaded=true;
    }

    // update (dt) {}
}
