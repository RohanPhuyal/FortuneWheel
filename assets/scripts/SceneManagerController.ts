// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class SceneManagerController extends cc.Component {

    @property(cc.Prefab) mainMenuScene: cc.Prefab = null;
    @property(cc.Prefab) gameScene: cc.Prefab = null;
    @property(cc.Prefab) loadingScene: cc.Prefab = null;

    private currentScene: cc.Node = null;



    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.setupMainMenuScene();
    }
    
    private setupMainMenuScene() {
        this.currentScene = cc.instantiate(this.mainMenuScene);
        this.node.addChild(this.currentScene);
    
        const playButton = this.currentScene.getChildByName("PlayButton");
        if (playButton) {
            playButton.on("click", this.onPlayButtonClick, this);
        }
    }
    

    private onPlayButtonClick() {
        cc.log("Clicked Play Button from Main Menu");

        this.currentScene.removeFromParent();
        this.currentScene = null;

        this.currentScene = cc.instantiate(this.loadingScene);
        this.node.addChild(this.currentScene);
    }
    public onLoadingFinished() {
        this.currentScene.removeFromParent();
        this.currentScene = null;

        this.currentScene = cc.instantiate(this.gameScene);
        this.node.addChild(this.currentScene);
    }
    public onGameExit() {
        this.currentScene.removeFromParent();
        this.currentScene = null;
    
        this.setupMainMenuScene();
    }

    // update(dt) {
    //     if (this.currentScene.getComponent("LoadingMenuManager")) {
    //         if (this.currentScene.getComponent("LoadingMenuManager").loaded) {
    //             this.currentScene.removeFromParent();
    //             this.currentScene = null;

    //             this.currentScene = cc.instantiate(this.gameScene);
    //             this.node.addChild(this.currentScene);
    //         }
    //     }
    // }
}
