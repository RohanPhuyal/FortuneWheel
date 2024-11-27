const { ccclass, property } = cc._decorator;

enum GameState {
    Start, Spinning, SetStop, End, Jackpot, CalculatingResult
}

@ccclass
export default class WheelSpinner extends cc.Component {
    // UI Nodes
    @property(cc.Node) wheelNode: cc.Node = null; // The spinning wheel
    @property(cc.Node) scoreNode: cc.Node = null; // Score display
    @property(cc.Node) playButton: cc.Node = null; // Play button
    @property(cc.Node) exitButton: cc.Node = null; // Exit button
    @property(cc.Node) betPlusButton: cc.Node = null; // Bet increase button
    @property(cc.Node) betMinusButton: cc.Node = null; // Bet decrease button
    @property(cc.Node) betAmountLabel: cc.Node = null; // Bet amount label
    @property(cc.Node) freeSpin: cc.Node = null; // Free spin indicator
    @property(cc.Node) noCashPopup: cc.Node = null; // No cash popup
    @property(cc.Node) winPopup: cc.Node = null; // Win popup

    // Wheel settings
    @property totalSections = 8; // Number of sections on the wheel
    @property offset = -22.5; // Offset angle to align sections
    @property desired = 0; // Placeholder for desired section index

    // Spin settings
    @property({ type: cc.Integer, range: [0, 5, 1] }) minSpinTimeWheel: number = 1;
    @property({ type: cc.Integer, range: [0, 5, 1] }) maxSpinTimeWheel: number = 5;
    @property({ type: cc.Integer }) minSpinAngle: number = 360;
    @property({ type: cc.Integer }) maxSpinAngle: number = 3600;
    @property({ type: cc.Integer }) minSpin: number = 4;
    @property({ type: cc.Integer }) maxSpin: number = 6;

    //new-spin property
    @property({ type: cc.Integer }) minSpinAcceleration: number = 12;
    spinAcceleration: number = 1000;
    @property({ type: cc.Integer }) maxSpinAcceleration: number = 18;

    // Player's cash and betting amount
    @property cash = 10; // Player's starting cash
    betAmount = 1; // Default bet amount

    @property(cc.EditBox) targetAmount: cc.EditBox; // Target amount input

    private currentGameState: GameState = GameState.Start; // Track the current game state

    private sceneManagerController: any = null; // Reference to the scene manager

    // Values for the wheel sections
    @property([cc.String]) wheelValues: string[] = ["1", "2", "3", "4", "5", "6", "7", "Jackpot"];

    @property({ type: cc.Integer }) minJackpotAmount: number = 2;
    @property({ type: cc.Integer }) maxJackpotAmount: number = 7;

    @property({ type: cc.Integer }) minDecelerationTime = 2.5;
    @property({ type: cc.Integer }) maxDecelerationTime = 3.5;

    onLoad() {
        this.randomizeWheelValues(); // Shuffle the wheel values on load
    }

    start() {
        // Set the initial score display
        this.scoreNode.getComponent(cc.Label).string = "$ " + this.cash;
        this.updateButtonsState(); // Update button states based on game state
    }

    private randomizeWheelValues() {
        // Shuffle the wheel values randomly
        const shuffle = (array: string[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const shuffledValues = shuffle(this.wheelValues);

        // Apply the shuffled values to each section of the wheel
        const childNodes = this.wheelNode.children;
        for (let i = 0; i < childNodes.length; i++) {
            const labelComponent = childNodes[i].getComponent(cc.Label);
            if (labelComponent) {
                labelComponent.string = shuffledValues[i];
            }
        }
    }

    getRandomValueBetween(minValue: number, maxValue: number): number {
        // Get a random value between the specified range
        return Math.random() * (maxValue - minValue) + minValue;
    }

    onSpinButtonClick() {
        this.spinAcceleration = this.getRandomValueBetween(this.minSpinAcceleration, this.maxSpinAcceleration);
        // Gaurd Clause
        if (this.currentGameState === GameState.Spinning) {
            this.onStopSpinButtonClick();
            return;
        }


        if (this.currentGameState === GameState.Start || this.currentGameState === GameState.End) {
            if (this.cash <= 0) {
                this.currentGameState = GameState.End;
                this.updateButtonsState();
                this.noCashAvailablePopup(); // Show "no cash" popup if cash is 0
            } else {
                this.cash -= this.betAmount || 1; // Deduct the bet amount
                this.scoreNode.getComponent(cc.Label).string = "$ " + this.cash;
                this.wheelNode.angle = 0;
                this.currentGameState = GameState.Spinning;
                this.updateButtonsState();
            }
        }

        // if (this.currentGameState === GameState.Start || this.currentGameState === GameState.End) {
        //     if (this.cash <= 0) {
        //         this.noCashAvailablePopup(); // Show "no cash" popup if cash is 0
        //     } else {
        //         this.cash -= this.betAmount || 1; // Deduct the bet amount
        //         this.scoreNode.getComponent(cc.Label).string = "$ " + this.cash;
        //         this.startAnimationTarget(this.targetAmount.string); // Start the wheel spin animation
        //     }
        // }
    }
    easeSpinRun = false;
    private startSpinningAnimation(dt) {
        // cc.log("SPINNING");
        this.wheelNode.angle += this.spinAcceleration;
    }

    // Variables for ease effect
    timeElapsed = 0;
    decelerationTime: number=2.5; // Dynamically calculated
    easeOutStarted = false;
    easeAcceleration = this.spinAcceleration;
    startAngle: number=0;
    targetAngle: number=0;
    progress = 0;

    private easeSpinningAnimation(dt) {
        if (!this.easeOutStarted) {
            this.startAngle = this.wheelNode.angle;
            this.targetAngle = this.getTargetAngle(this.targetAmount.string);

            // Ensure the target is ahead for smooth deceleration
            while (this.targetAngle < this.startAngle) {
                this.targetAngle += 360;
            }
            this.targetAngle += 360;  // Extra spin for smooth stop
            this.decelerationTime=this.getRandomValueBetween(this.minDecelerationTime,this.maxDecelerationTime);
            this.timeElapsed = 0;
            this.easeOutStarted = true;
        }

        this.timeElapsed += dt;
        this.progress = Math.min(this.timeElapsed / this.decelerationTime, 1);
        const easedProgress = 1 - Math.pow(1 - this.progress, 3);  // Cubic ease-out

        const deltaAngle = this.targetAngle - this.startAngle;
        this.wheelNode.angle = this.startAngle + easedProgress * deltaAngle;

        if (this.progress === 1) {
            this.wheelNode.angle = this.targetAngle % 360;
            this.easeOutStarted = false;
            this.currentGameState = GameState.CalculatingResult;
            this.calculateResult();
        }
    }


    // //variables for ease effect
    // timeElapsed = 0;
    // decelerationTime = 1.5;
    // easeOutStarted = false;
    // easeAcceleration = this.spinAcceleration;
    // startAngle: number;
    // targetAngle: number;
    // progress=0;
    // private easeSpinningAnimation(dt) {
    //     if (!this.easeOutStarted) {
    //         // Initialize easing variables
    //         this.startAngle = this.wheelNode.angle;
    //         this.targetAngle = this.getTargetAngle(this.targetAmount.string);

    //         // Ensure targetAngle is always ahead of startAngle in a clockwise direction
    //         while (this.targetAngle < this.startAngle) {
    //             this.targetAngle += 360; // Add 360 to move it forward
    //         }
    //         this.targetAngle += 360;

    //         this.timeElapsed = 0;
    //         this.progress = 0;
    //         this.easeOutStarted = true;
    //     }

    //     // Update time elapsed and progress
    //     this.timeElapsed += dt;
    //     this.progress = Math.min(this.timeElapsed / this.decelerationTime, 1);

    //     // Apply quadratic ease-out for smooth deceleration
    //     const easedProgress = 1 - Math.pow(1 - this.progress, 2);

    //     // Interpolate between startAngle and targetAngle
    //     const deltaAngle = this.targetAngle - this.startAngle;
    //     const currentAngle = this.startAngle + easedProgress * deltaAngle;

    //     // Update wheelNode angle (normalized to 0–360 degrees)
    //     this.wheelNode.angle = currentAngle ;
    //     // this.wheelNode.angle = currentAngle % 360;

    //     // Check if easing is complete
    //     if (this.progress === 1) {
    //         this.wheelNode.angle = this.targetAngle % 360; // Snap to target angle
    //         this.easeOutStarted = false;
    //         this.calculateResult();
    //     }
    // }

    // private easeSpinningAnimation(dt) {

    //     if (!this.easeOutStarted) {
    //         // cc.log("Current Angle: " + this.wheelNode.angle);
    //         this.startAngle = this.wheelNode.angle;
    //         this.targetAngle = this.getTargetAngle(this.targetAmount.string);

    //         // cc.log("Target Angle: " + this.targetAngle);
    //         this.timeElapsed = 0;
    //         this.progress=0;
    //         this.easeAcceleration = this.spinAcceleration;
    //         this.easeOutStarted = true;
    //     }

    //     // this.wheelNode.angle=targetAngle;

    //     // Update the timer
    //     this.timeElapsed += dt;
    //     // Calculate the progress (0 to 1)
    //     this.progress = Math.min(this.timeElapsed / this.decelerationTime, 1);

    //     // if(easedProgress<=0) progress=1;
    //     this.easeAcceleration -= this.progress;
    //     if (this.easeAcceleration <= 0) {
    //         this.progress=1;
    //         this.easeAcceleration = 0;

    //     }
    //     // cc.log("EAse Acce: " + this.easeAcceleration);
    //     this.wheelNode.angle += this.easeAcceleration;
    //     // Interpolate angle


    //     // cc.log("progess " + easedProgress);
    //     if (this.progress === 1) {
    //         this.easeOutStarted = false;
    //         this.calculateResult();
    //     }

    // }

    onStopSpinButtonClick() {
        this.currentGameState = GameState.SetStop;
        this.updateButtonsState();
    }
    private getTargetAngle(targetIndex) {
        // Find the index of the target section on the wheel
        const childNodes = this.wheelNode.children;
        for (let i = 0; i < this.wheelValues.length; i++) {
            const labelComponent = childNodes[i].getComponent(cc.Label).string;
            if (labelComponent == targetIndex) {
                targetIndex = i;
                break;
            }
        }

        // Calculate the angle per section
        const sectionAngle = 360 / this.totalSections;

        // Calculate the base angle for the target section
        const baseAngle = targetIndex * sectionAngle;

        // Add a random offset to the target angle (optional, but makes it feel more natural)
        const randomOffset = Math.random() * sectionAngle * 0.5; // Up to 50% of a section angle
        const adjustedTargetAngle = baseAngle + randomOffset;

        // Normalize to 0–360 degrees for the final target angle
        const targetAngle = (this.offset + adjustedTargetAngle) % 360;

        return targetAngle;
    }


    // private getTargetAngle(targetIndex) {
    //     // Start the wheel animation to the target section
    //     // Get child nodes
    //     // targetIndex=targetIndex.toString();
    //     const childNodes = this.wheelNode.children;
    //     for (let i = 0; i < this.wheelValues.length; i++) {
    //         const labelComponent = childNodes[i].getComponent(cc.Label).string;
    //         if (labelComponent == targetIndex) {
    //             targetIndex = i;
    //             break;
    //         }
    //     }


    //     // Calculate the target angle for the spin animation
    //     const sectionAngle = 360 / this.totalSections;
    //     const adjustedTargetIndex = targetIndex - Math.random();
    //     const baseAngle = adjustedTargetIndex * sectionAngle;
    //     // const randomSpinAngle = Math.floor(this.getRandomValueBetween(this.minSpin, this.maxSpin));
    //     // const targetAngle = randomSpinAngle - this.offset + baseAngle;
    //     const targetAngle = this.offset + baseAngle;

    //     // cc.log("TA: " + targetAngle);

    //     return targetAngle;
    //     // return targetAngle;

    // }

    private calculateResult() {
        this.currentGameState = GameState.CalculatingResult; // Set game state to Spinning
        this.updateButtonsState(); // Disable the play/exit button=
        // Determine the section where the wheel stops and process the result
        let currentAngle = this.wheelNode.angle;
        let normalizedAngle = currentAngle % 360;
        if (normalizedAngle < 0) {
            normalizedAngle += 360;
        }

        let sectionAngle = 360 / this.totalSections;
        let adjustedAngle = normalizedAngle + this.offset;
        if (adjustedAngle < 0) {
            adjustedAngle += 360;
        }

        let index = Math.ceil(adjustedAngle / sectionAngle);
        if (index >= 8) {
            index = 0;
        }

        this.youWinPopup(index); // Show the win popup based on the result
    }

    private youWinPopup(index: number) {
        // Show win popup and update the cash based on the result
        const labelValue = this.wheelNode.getComponentsInChildren(cc.Label)[index].string;

        if (labelValue === "Jackpot") {
            // Calculate jackpot amount and show win
            let jackpotAmount = Math.floor(this.getRandomValueBetween(this.minJackpotAmount, this.maxJackpotAmount));
            this.showWinPopup("+$" + jackpotAmount);
            cc.tween(this.winPopup)
                .by(1, { scale: 1 }, { easing: "quartOut" })
                .call(() => {
                    this.winPopup.active = false;
                    this.addCash(jackpotAmount); // Add jackpot to the player's cash
                    this.freeSpinWin(); // Trigger free spin if applicable
                })
                .start();
        } else {
            // Regular win, add the amount to player's cash
            this.showWinPopup("+$" + labelValue);
            cc.tween(this.winPopup)
                .by(1, { scale: 1 }, { easing: "quartOut" })
                .call(() => this.countCash(index)) // Update the player's cash after win
                .start();
        }
    }

    private showWinPopup(value: string) {
        // Show a win message in a popup
        this.winPopup.getComponent(cc.Label).string = value;
        this.winPopup.active = true;
        this.winPopup.scale = 1;
    }

    private addCash(amount: number) {
        // Add the specified amount to the player's cash and update the score display
        this.cash += amount;
        this.scoreNode.getComponent(cc.Label).string = "$ " + this.cash;
    }

    private countCash(index: number) {
        // Add the cash based on the result (win)
        const labelValue = this.wheelNode.getComponentsInChildren(cc.Label)[index].string;
        this.winPopup.active = false;
        const winAmount = parseInt(labelValue, 10) || 0;
        this.addCash(winAmount); // Update the cash amount
        this.currentGameState = GameState.End;
        this.updateButtonsState(); // Update button states
    }

    private updateButtonsState() {
        if (this.playButton) {
            if (this.currentGameState === GameState.Start || this.currentGameState === GameState.End) {
                // if (this.cash <= 0) {
                //     this.playButton.getComponent(cc.Button).interactable = false;
                // } else {
                //     this.playButton.getComponent(cc.Button).interactable = true;
                // }
                this.playButton.getComponent(cc.Button).interactable = true;
                this.exitButton.getComponent(cc.Button).interactable = true;
            }
            if (this.currentGameState === GameState.Spinning) {
                this.playButton.getComponent(cc.Button).interactable = true;
                this.exitButton.getComponent(cc.Button).interactable = false;
            }
            if (this.currentGameState === GameState.SetStop) {
                this.playButton.getComponent(cc.Button).interactable = false;
                this.exitButton.getComponent(cc.Button).interactable = false;
            }
            if (this.currentGameState === GameState.Jackpot) {
                this.playButton.getComponent(cc.Button).interactable = false;
                this.exitButton.getComponent(cc.Button).interactable = false;
            }
            if (this.currentGameState === GameState.CalculatingResult) {
                this.playButton.getComponent(cc.Button).interactable = false;
                this.exitButton.getComponent(cc.Button).interactable = false;
            }
        }
    }

    private freeSpinWin() {
        // Handle the case when the player wins a free spin
        this.freeSpin.active = true;
        this.freeSpin.scale = 1;
        cc.tween(this.freeSpin)
            .by(1, { scale: 1 }, { easing: "quartOut" })
            .call(() => {
                this.freeSpin.active = false;
                this.currentGameState = GameState.Jackpot; // Set game state to Spinning
                this.updateButtonsState(); // Disable the play/exit button=
                this.startAnimation();
            })
            .start();
    }
    private startAnimation() {
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


    private noCashAvailablePopup() {
        // Show the "no cash" popup when the player runs out of cash
        this.noCashPopup.active = true;
        this.noCashPopup.scale = 0;
        cc.tween(this.noCashPopup)
            .by(1, { scale: 1 }, { easing: "quartOut" })
            .call(() => {
                this.noCashPopup.active = false;
            })
            .start();
    }
    onExitButtonClick() {
        this.currentGameState = GameState.Start; // Set game state to Start
        this.updateButtonsState(); // Disable the play/exit button
        // Find the SceneManager node
        const sceneManagerNode = cc.find("Canvas/SceneManager");
        this.sceneManagerController = sceneManagerNode.getComponent("SceneManagerController");
        this.sceneManagerController.onGameExit();
    }
    update(dt) {
        if (this.currentGameState === GameState.Spinning) {
            this.startSpinningAnimation(dt);
        }
        if (this.currentGameState === GameState.SetStop) {
            this.easeSpinningAnimation(dt);
        }
    }
}
