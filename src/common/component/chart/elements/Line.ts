import ChartElement from "./ChartElement";
import ChartController from "../controller/ChartController";
import IStockHistory from "../../../../define/IStockHistory";

interface LineOptions {
    stroke?: string;
    square?: boolean;
}

class Line extends ChartElement<number> {
    private _stroke = 'red';
    private _isSquare = false;

    constructor(controller: ChartController,
    convertFunc: (data: IStockHistory[]) => number[], options?: LineOptions) {
        super(controller, convertFunc)

        if (options) {
            options.stroke && (this._stroke = options.stroke);
            this._isSquare = options?.square ?? false;
        }
    }

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
            if (this._isSquare) {
                ctx.lineTo(i * this.zoom, this.height - v);
                ctx.lineTo((i + 1) * this.zoom, this.height - v);
                return;
            }
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