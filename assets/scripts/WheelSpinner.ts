// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

enum GameState {
    Start, Spinning, End
}

@ccclass
export default class WheelSpinner extends cc.Component {
    @property(cc.Node)
    wheelNode: cc.Node = null;
    @property(cc.Node)
    scoreNode: cc.Node = null;
    @property(cc.Node)
    playButton: cc.Node = null;
    @property(cc.Node)
    exitButton: cc.Node = null;
    @property(cc.Node)
    freeSpin: cc.Node = null;
    @property totalSections = 8;
    @property offset = -22.5;
    @property desired = 0;
    @property({ type: cc.Integer, range: [0, 5, 1] })
    stopTime: number = 1;
    score = 0;
    private lastMilestone: number = 0; // Tracks the last milestone score

    private currentGameState: GameState = GameState.Start; // Initial game state

    private sceneManagerController: any = null;


    @property([cc.String]) wheelValues: string[] = ["1", "2", "3", "4", "5", "6", "7", "Jackpot"];

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.randomizeWheelValues();
    }

    start() {
        this.updateButtonsState();
    }

    private randomizeWheelValues() {
        // Fisher-Yates Sorting Algorithm
        const shuffle = (array: string[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };
        const shuffledValues = shuffle(this.wheelValues);
        cc.log("Shuffled Array: " + shuffledValues);

        // Get child nodes
        const childNodes = this.wheelNode.children;

        // Assign shuffled values to each child
        for (let i = 0; i < childNodes.length; i++) {
            const labelComponent = childNodes[i].getComponent(cc.Label);
            if (labelComponent) {
                labelComponent.string = shuffledValues[i];
            }
        }
    }

    onSpinButtonClick() {
        cc.log("clicked spin button");
        //gaurd clause
        if (this.currentGameState === GameState.Spinning)
            return;

        if (this.currentGameState === GameState.Start || this.currentGameState === GameState.End) {
            this.startAnimation();
        }

    }
    private startAnimation() {
        this.currentGameState = GameState.Spinning; // Set game state to Spinning
        this.updateButtonsState(); // Disable the play/exit button
        // let randomNumber=Math.floor(Math.random()*8+1);
        let randomNumber = Math.random();
        // cc.log("Random Number: " + randomNumber);
        let randDuration = Math.floor(Math.random() * 5 + this.stopTime);
        cc.tween(this.wheelNode)
            .by(randDuration, { angle: 360 * randomNumber * 5 }, { easing: "quartOut" })
            .call(() => this.calculateResult())
            .start();
    }


    private calculateResult() {
        // Get the current rotation angle of the wheel
        let currentAngle = this.wheelNode.angle;

        // Normalize the angle to a value between 0 and 360
        let normalizedAngle = currentAngle % 360;
        if (normalizedAngle < 0) {
            normalizedAngle += 360; // Ensure the angle is positive
        }

        // Offset adjustment to align with the wheel's numbering
        let totalSections = 8; // Number of sections on the wheel
        let sectionAngle = 360 / totalSections; // Angle of each section
        let offset = -22.5; // Adjust for the initial position (top section starts at -22.5 degrees)

        // Adjust the normalized angle with the offset
        let adjustedAngle = normalizedAngle + offset;
        if (adjustedAngle < 0) {
            adjustedAngle += 360; // Wrap around if negative
        }

        // Calculate the index of the section the wheel stopped on
        let index = Math.ceil(adjustedAngle / sectionAngle);
        if (index >= 8) {
            index = 0;
        }

        this.currentGameState = GameState.End; // Set game state to End
        this.updateButtonsState(); // Re-enable the play/exit button
        this.countScore(index);


        // Display the result
        // cc.log("Normalized Angle: " + normalizedAngle);
        // cc.log("Adjusted Angle: " + adjustedAngle);
        // cc.log("The wheel stopped at index: " + index);
    }
    private countScore(index: number) {
        let scoreIndex = index;
        if (this.scoreNode.getComponent(cc.Label).string === "$0") {
            if (this.wheelNode.getComponentsInChildren(cc.Label)[scoreIndex].string == "Jackpot") {
                this.freeSpinWin();
            } else {
                this.score = parseInt(this.wheelNode.getComponentsInChildren(cc.Label)[scoreIndex].string);
            }
        } else {
            if (this.wheelNode.getComponentsInChildren(cc.Label)[scoreIndex].string == "Jackpot") {
                this.freeSpinWin();
            } else {
                let tempScore = parseInt(this.wheelNode.getComponentsInChildren(cc.Label)[scoreIndex].string);
                this.score += tempScore;
            }
        }
        this.scoreNode.getComponent(cc.Label).string = "$ " + this.score;

    }

    private updateButtonsState() {
        cc.log("GameState: " + this.currentGameState);
        if (this.playButton) {
            if (this.currentGameState === GameState.Start || this.currentGameState === GameState.End) {
                this.playButton.getComponent(cc.Button).interactable = true;
                this.exitButton.getComponent(cc.Button).interactable = true;
            } else {
                this.playButton.getComponent(cc.Button).interactable = false;
                this.exitButton.getComponent(cc.Button).interactable = false;
            }
        }
    }

    private freeSpinWin() {
        this.currentGameState = GameState.Spinning; // Set game state to Spinning
        this.updateButtonsState(); // Disable the play.exit button
        this.freeSpin.active = true;
        this.freeSpin.angle = 0; // Reset rotation
        this.freeSpin.scale = 1; // Reset scale to default
        cc.tween(this.freeSpin)
            .by(2, { angle: 360, scale: 1 }, { easing: "quartOut" })
            .call(() => this.finishFreeSpinAnimation())
            .start();
    }

    private finishFreeSpinAnimation() {
        this.freeSpin.active = false;
        this.startAnimation();
    }

    onExitButtonClick(){
        this.currentGameState = GameState.Start; // Set game state to Start
        this.updateButtonsState(); // Disable the play/exit button
        // Find the SceneManager node
        const sceneManagerNode = cc.find("Canvas/SceneManager");
        this.sceneManagerController = sceneManagerNode.getComponent("SceneManagerController");
        this.sceneManagerController.onGameExit();
        cc.log("sceneManagerNode "+sceneManagerNode);
    }

    // update (dt) {}
}
