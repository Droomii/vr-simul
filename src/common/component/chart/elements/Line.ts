import ChartElement from "./ChartElement";

class Line extends ChartElement<number> {
    private _stroke = 'red';

    setColor(color: string) {
        this._stroke = color;
    }

    draw() {
        const {ctx} = this;
        const {normalize} = this.controller;
        const normalizedData = this.slicedData.map(normalize);

        ctx.beginPath();
        ctx.moveTo(0, this.height - normalizedData[0]);
        ctx.strokeStyle = this._stroke;

        normalizedData.forEach((v, i) => {
            ctx.lineTo((i + 1) * this.zoom - Math.floor((this.zoom / 2)), this.height - v);
        })

        ctx.lineTo(this.width, this.height - (normalizedData.at(-1) ?? 0))
        ctx.stroke();
        ctx.closePath();
    }

    get range() {
        return this.slicedData.reduce((acc, v) => {
            acc.highest = Math.max(acc.highest, v);
            acc.lowest = Math.min(acc.lowest, v);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE})
    }
}

export default Line