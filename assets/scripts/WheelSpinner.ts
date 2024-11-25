// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

enum GameState {
    Start, Idle, Spinning, End
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
    betPlusButton: cc.Node = null;
    @property(cc.Node)
    betMinusButton: cc.Node = null;
    @property(cc.Node)
    betAmountLabel: cc.Node = null;
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
    @property({ type: cc.Integer })
    minSpin: number = 4;
    @property({ type: cc.Integer })
    maxSpin: number = 6;
    @property cash = 10;

    private currentGameState: GameState = GameState.Start; // Initial game state

    private sceneManagerController: any = null;


    @property([cc.String]) wheelValues: string[] = ["1", "2", "3", "4", "5", "6", "7", "Jackpot"];

    @property({ type: cc.Integer })
    minJackpotAmount: number = 2;
    @property({ type: cc.Integer })
    maxJackpotAmount: number = 7;

    betAmount = 1;

    @property(cc.EditBox) targetAmount: cc.EditBox;
    // @property(cc.Node)
    // targetAmountLabel: cc.Node = null;
    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.randomizeWheelValues();
    }

    start() {
        this.scoreNode.getComponent(cc.Label).string = "$ " + this.cash;
        // this.targetAmountLabel.getComponent(cc.Label).string = "Target Amount: " + this.targetAmount;
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

    // onSpinButtonClicked(){
    //     if(this.currentGameState === GameState.Start || this.currentGameState === GameState.End){
    //         this.currentGameState=GameState.Spinning;
    //     }
    //     if(this.currentGameState === GameState.Spinning){
    //         this.currentGameState=GameState.End;
    //     }

    //     if(this.currentGameState=GameState.Spinning){
    //         cc.log("I'm spinning");
    //     }

    //     if(this.currentGameState=GameState.End){
    //         cc.log("I'm ending");
    //     }
    // }

    // onSpinButtonClick() {
    //     // cc.log("Gamestate: "+this.currentGameState);
    //     if (this.currentGameState === GameState.Start) {
    //         this.currentGameState = GameState.Spinning;//Set currentGameState to Spinning at first run
    //         cc.log("Start to Gamestate: "+this.currentGameState);
    //         this.updateButtonsState();
    //         this.startInfiniteSpin(); // Start spinning the wheel indefinitely
    //     }
    //     if (this.currentGameState === GameState.Spinning) {
    //         cc.log("Spinning to Gamestate: "+this.currentGameState);
    //         this.currentGameState = GameState.End;//Set currentGameState to Spinning at first run
    //         this.stopWheelAtTarget(this.targetAmount);
    //     }
    //     if (this.currentGameState === GameState.End) {
    //         this.stopWheelAtTarget(this.targetAmount); // Stop the wheel at the target index
    //     }
    // }
    onSpinButtonClick() {
        cc.log("clicked spin button");
        //gaurd clause
        if (this.currentGameState === GameState.Spinning)
            return;

        if (this.currentGameState === GameState.Start || this.currentGameState === GameState.End) {
            if (this.cash <= 0) {
                this.noCashAvailablePopup();
            } else {
                if (this.betAmount) {
                    this.cash -= this.betAmount;
                } else {
                    this.cash--;
                }
                this.scoreNode.getComponent(cc.Label).string = "$ " + this.cash;
                // this.startAnimation();
                this.startAnimationTarget(this.targetAmount.string);
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
            // .by(randomDuration, { angle: randomSpinAngle })
            .by(randomDuration, { angle: randomSpinAngle }, { easing: "quartOut" })
            // .repeatForever()
            .call(() => this.calculateResult())
            .start();
    }
   
    private startAnimationTarget(targetIndex) {
        // Get child nodes
        // targetIndex=targetIndex.toString();
        const childNodes = this.wheelNode.children;
        for (let i = 0; i < this.wheelValues.length; i++) {
            cc.log("" + this.wheelValues[i]);
            const labelComponent = childNodes[i].getComponent(cc.Label).string;
            cc.log("lc: " + labelComponent);
            if (labelComponent == targetIndex) {
                cc.log("HERE" + i);
                targetIndex = i;
                break;
            }
        }

        cc.log("TI: " + targetIndex);

        this.currentGameState = GameState.Spinning; // Set game state to Spinning
        this.updateButtonsState(); // Disable the play/exit button

        const sectionAngle = 360 / this.totalSections;  // Angle of each section (e.g., 45° for 8 sections)

        // Apply the offset to adjust for the starting position (e.g., to make the first section start at -22.5°)
        const adjustedTargetIndex = targetIndex - Math.random();  // Offset adjustment to shift the target slightly

        // Calculate the base angle that corresponds to the desired target section
        const baseAngle = adjustedTargetIndex * sectionAngle;

        // Total angle the wheel will rotate to (5 full rotations plus the target section's base angle)
        let randomSpinAngle = Math.floor(this.getRandomValueBetween(this.minSpin, this.maxSpin));
        const targetAngle = 360 * randomSpinAngle - this.offset + baseAngle;  // 5 full rotations + offset

        cc.log("Target Angle: " + targetAngle);  // Log the target angle for debugging

        // cc.log("Random Number: " + randomNumber);
        let randomDuration = this.getRandomValueBetween(this.minSpinTimeWheel, this.maxSpinTimeWheel);

        // Animate the wheel to the calculated target angle
        this.wheelNode.angle = 0;
        cc.tween(this.wheelNode)
            .by(randomDuration, { angle: targetAngle }, { easing: "quartOut" }) // Smooth easing
            .call(() => this.calculateResult())  // Callback to calculate and log the result
            .start();  // Start the animation
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
        let totalSections = this.totalSections; // Number of sections on the wheel
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
            this.showWinPopup("+$" + jackpotAmount); // Show win amount for Jackpot
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

    // private updateButtonsState() {
    //     // cc.log("GameState: " + this.currentGameState);
    //     if (this.playButton) {
    //         if (this.currentGameState === GameState.Start || this.currentGameState === GameState.End || this.currentGameState === GameState.Idle) {
    //             // if (this.cash <= 0) {
    //             //     this.playButton.getComponent(cc.Button).interactable = false;
    //             // } else {
    //             //     this.playButton.getComponent(cc.Button).interactable = true;
    //             // }
    //             this.playButton.getComponent(cc.Button).interactable = true;
    //             this.exitButton.getComponent(cc.Button).interactable = true;
    //         } else if (this.currentGameState === GameState.Spinning) {
    //             this.playButton.getComponent(cc.Button).interactable = true;
    //             this.exitButton.getComponent(cc.Button).interactable = false;
    //         }
    //     }
    // }

    private freeSpinWin() {
        this.currentGameState = GameState.Spinning; // Set game state to Spinning
        this.updateButtonsState(); // Disable the play.exit button
        cc.log("Free spin ayo hai ayo");
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

    onBetPlusButtonClicked() {
        let currentBetAmount = parseInt(this.betAmountLabel.getComponent(cc.Label).string.replace("$", ""));
        if (this.cash > 0 && this.betAmount >= 0 && this.betAmount < this.cash) {
            this.betAmount += 1;
            this.betAmountLabel.getComponent(cc.Label).string = "$" + this.betAmount;
            // this.currentBetAmount=parseInt(this.betAmountLabel.getComponent(cc.Label).string="$1");
            cc.log("Current Bet Amount: " + currentBetAmount);
        }

    }

    onBetMinusButtonClicked() {
        let currentBetAmount = parseInt(this.betAmountLabel.getComponent(cc.Label).string.replace("$", ""));
        if (this.cash > 0 && this.betAmount > 1 && this.betAmount <= this.cash) {
            this.betAmount -= 1;
            this.betAmountLabel.getComponent(cc.Label).string = "$" + this.betAmount;
            // this.currentBetAmount=parseInt(this.betAmountLabel.getComponent(cc.Label).string="$1");
            cc.log("Current Bet Amount: " + currentBetAmount);
        }

    }
    // update (dt) {}
}
