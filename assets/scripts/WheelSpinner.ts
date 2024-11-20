// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class WheelSpinner extends cc.Component {
    @property(cc.Node)
    wheelNode: cc.Node = null;
    @property(cc.Node)
    scoreNode: cc.Node = null;
    @property totalSections=8;
    @property offset=-22.5;
    @property desired=0;
    @property({ type: cc.Integer, range: [0, 5, 1] })
    stopTime: number = 2;
    score=0;
    

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        
    }
    onButtonClick() {
        this.startAnimation();
    }
    private startAnimation(){
        // let randomNumber=Math.floor(Math.random()*8+1);
        let randomNumber=Math.random();
        cc.log("Random Number: "+randomNumber);
        const randDuration = Math.floor(Math.random() * 5 + this.stopTime);
        cc.tween(this.wheelNode)
            .by(randDuration,{angle:360*randomNumber*5}, { easing: "quartOut" })
            .call(()=>this.calculateResult())
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
        this.countScore(index);

        // Display or handle the result
        cc.log("Normalized Angle: " + normalizedAngle);
        cc.log("Adjusted Angle: " + adjustedAngle);
        cc.log("The wheel stopped at index: " + index);
    }
    private countScore(index: number){
        let scoreIndex = index;
        if(this.scoreNode.getComponent(cc.Label).string==="$0"){
            this.score = parseInt(this.wheelNode.getComponentsInChildren(cc.Label)[scoreIndex].string);
        }else{
            let tempScore = parseInt(this.wheelNode.getComponentsInChildren(cc.Label)[scoreIndex].string);
            this.score+=tempScore;
        }
        this.scoreNode.getComponent(cc.Label).string="$ "+this.score;
    }

    // update (dt) {}
}
