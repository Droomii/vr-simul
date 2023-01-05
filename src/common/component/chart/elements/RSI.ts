import ChartElement from "./ChartElement";

class RSI extends ChartElement<number> {
    private _color = 'red';

    setColor(color: string) {
        this._color = color;
    }

    draw() {
        const {ctx} = this;
        // draw RSI
        ctx.beginPath();
        ctx.moveTo(0, this.height - this.height * this.slicedData[0] / 100);
        ctx.strokeStyle = this._color;

        this.slicedData.forEach(( v, i) => {
            ctx.lineTo((i+1) * this.zoom - Math.floor((this.zoom / 2)), this.height - this.height * v / 100);
        })

        ctx.lineTo(this.width, this.height - this.height * (this.slicedData.at(-1) ?? 0) / 100)
        ctx.stroke();
        ctx.closePath();
    }

    get range() {
        return {lowest: 0, highest: 100};
    }
}
export default RSI