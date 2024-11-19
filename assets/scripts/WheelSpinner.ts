// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    @property(cc.Node)
    wheelNode: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }
    onButtonClick() {
        this.startAnimation(-0.5);

    }
    // private startAnimation(){
    //     // let randomNumber=Math.floor(Math.random()*8+1);
    //     let randomNumber=Math.random();
    //     cc.log("Random Number: "+randomNumber);
    //     cc.tween(this.wheelNode)
    //         .by(4,{angle:360*randomNumber*5})
    //         .call(()=>this.calculateResult())
    //         .start();       
    //     }
    private startAnimation(targetIndex: number) {
        const totalSections = 8; // Number of sections on the wheel
        const sectionAngle = 360 / totalSections; // Each section spans 45 degrees
        const offset = -22.5; // Adjust for the initial position (top section at -22.5 degrees)

        // Calculate the target angle for the desired index
        const baseAngle = targetIndex * sectionAngle; // Target section angle
        const targetAngle = 360 * 5 - offset + baseAngle; // Add multiple full rotations (5 spins)

        // Animate the wheel
        cc.tween(this.wheelNode)
            .to(4, { angle: targetAngle }, { easing: "quartOut" }) // Use easing for smooth deceleration
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

        // Display or handle the result
        cc.log("Normalized Angle: " + normalizedAngle);
        cc.log("Adjusted Angle: " + adjustedAngle);
        cc.log("The wheel stopped at index: " + index);
    }

    // update (dt) {}
}
