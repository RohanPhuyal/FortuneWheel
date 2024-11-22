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
    @property(cc.Node)
    noCashPopup: cc.Node = null;
    @property(cc.Node)
    winPopup: cc.Node = null;
    @property totalSections = 8;
    @property offset = -22.5;
    @property desired = 0;
    @property({ type: cc.Integer, range: [0, 5, 1] })
    minSpinTimeWheel: number = 1;
    @property({ type: cc.Integer, range: [0, 5, 1] })
    maxSpinTimeWheel: number = 5;
    @property({ type: cc.Integer })
    minSpinAngle: number = 360;
    @property({ type: cc.Integer })
    maxSpinAngle: number = 3600;
    @property cash = 10;
    private lastMilestone: number = 0; // Tracks the last milestone score

    private currentGameState: GameState = GameState.Start; // Initial game state

    private sceneManagerController: any = null;


    @property([cc.String]) wheelValues: string[] = ["1", "2", "3", "4", "5", "6", "7", "Jackpot"];

    @property({ type: cc.Integer })
    minJackpotAmount: number = 2;
    @property({ type: cc.Integer })
    maxJackpotAmount: number = 7;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.randomizeWheelValues();
    }

    start() {
        this.scoreNode.getComponent(cc.Label).string = "$ " + this.cash;
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

    getRandomValueBetween(minValue: number, maxValue: number): number {
        return Math.random() * (maxValue - minValue) + minValue;
    }

    onSpinButtonClick() {
        cc.log("clicked spin button");
        //gaurd clause
        if (this.currentGameState === GameState.Spinning)
            return;

        if (this.currentGameState === GameState.Start || this.currentGameState === GameState.End) {
            if (this.cash <= 0) {
                this.noCashAvailablePopup();
            } else {
                this.cash--;
                this.scoreNode.getComponent(cc.Label).string = "$ " + this.cash;
                this.startAnimation();
            }
        }

    }
    private startAnimation() {
        this.currentGameState = GameState.Spinning; // Set game state to Spinning
        this.updateButtonsState(); // Disable the play/exit button
        // let randomNumber=Math.floor(Math.random()*8+1);
        let randomSpinAngle = this.getRandomValueBetween(this.minSpinAngle, this.maxSpinAngle);
        // cc.log("Random Number: " + randomNumber);
        let randomDuration = this.getRandomValueBetween(this.minSpinTimeWheel, this.maxSpinTimeWheel);
        cc.log("Random Angle: " + randomSpinAngle + " \nRandom Duration: " + randomDuration)
        cc.tween(this.wheelNode)
            .by(randomDuration, { angle: randomSpinAngle }, { easing: "quartOut" })
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

        this.youWinPopup(index);


        // Display the result
        // cc.log("Normalized Angle: " + normalizedAngle);
        // cc.log("Adjusted Angle: " + adjustedAngle);
        // cc.log("The wheel stopped at index: " + index);
    }

    private youWinPopup(index: number) {
        const labelValue = this.wheelNode.getComponentsInChildren(cc.Label)[index].string;

        if (labelValue === "Jackpot") {
            let jackpotAmount = Math.floor(this.getRandomValueBetween(this.minJackpotAmount, this.maxJackpotAmount));
            this.showWinPopup("+$" + jackpotAmount); // Show +2 for Jackpot
            cc.tween(this.winPopup)
                .by(1, { scale: 1 }, { easing: "quartOut" })
                .call(() => {
                    this.winPopup.active = false;
                    this.addCash(jackpotAmount);
                    this.freeSpinWin();
                })
                .start();
        } else {
            this.showWinPopup("+$" + labelValue);
            cc.tween(this.winPopup)
                .by(1, { scale: 1 }, { easing: "quartOut" })
                .call(() => this.countCash(index))
                .start();
        }
    }

    private showWinPopup(value: string) {
        this.winPopup.getComponent(cc.Label).string = value;
        this.winPopup.active = true;
        this.winPopup.scale = 1; // Reset scale to default
    }

    private addCash(amount: number) {
        this.cash += amount;
        this.scoreNode.getComponent(cc.Label).string = "$ " + this.cash;
    }

    private countCash(index: number) {
        const labelValue = this.wheelNode.getComponentsInChildren(cc.Label)[index].string;

        this.winPopup.active = false;
        const winAmount = parseInt(labelValue, 10) || 0;
        this.addCash(winAmount);

        this.currentGameState = GameState.End; // Set game state to End
        this.updateButtonsState(); // Re-enable the play/exit button
    }


    private updateButtonsState() {
        cc.log("GameState: " + this.currentGameState);
        if (this.playButton) {
            if (this.currentGameState === GameState.Start || this.currentGameState === GameState.End) {
                // if (this.cash <= 0) {
                //     this.playButton.getComponent(cc.Button).interactable = false;
                // } else {
                //     this.playButton.getComponent(cc.Button).interactable = true;
                // }
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

    onExitButtonClick() {
        this.currentGameState = GameState.Start; // Set game state to Start
        this.updateButtonsState(); // Disable the play/exit button
        // Find the SceneManager node
        const sceneManagerNode = cc.find("Canvas/SceneManager");
        this.sceneManagerController = sceneManagerNode.getComponent("SceneManagerController");
        this.sceneManagerController.onGameExit();
        cc.log("sceneManagerNode " + sceneManagerNode);
    }

    private noCashAvailablePopup() {
        this.noCashPopup.active = true;
        this.noCashPopup.scale = 1; // Reset scale to default
        cc.tween(this.noCashPopup)
            .by(1, { scale: 1 }, { easing: "quartOut" })
            .call(() => this.finishNoCashAnimation())
            .start();
    }
    private finishNoCashAnimation() {
        this.noCashPopup.active = false;
    }
    // update (dt) {}
}
