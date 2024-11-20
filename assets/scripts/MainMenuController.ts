// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


const {ccclass, property} = cc._decorator;

@ccclass
export default class MainMenuController extends cc.Component {

    @property (cc.Node) playButton: cc.Node = null;
    
    

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        
    }

    onButtonClick(){
    }

    // update (dt) {}
}
