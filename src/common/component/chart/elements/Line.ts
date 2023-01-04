import ChartElement from "./ChartElement";

class Line extends ChartElement<number> {

    draw() {
        const {ctx} = this;
        // draw RSI
        ctx.beginPath();
        ctx.moveTo(0, this.height - this.height * this.slicedData[0] / 100);
        ctx.strokeStyle = "red";

        this.slicedData.forEach(( v, i) => {
            ctx.lineTo((i+1) * this.zoom - Math.floor((this.zoom / 2)), this.height - this.height * v / 100);
        })

        ctx.lineTo(this.width, this.height - this.height * (this.slicedData.at(-1) ?? 0) / 100)
        ctx.stroke();
        ctx.closePath();
    }
}
export default Line