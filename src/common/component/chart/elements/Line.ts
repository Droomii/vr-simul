import ChartElement from "./ChartElement";
import ChartController from "../controller/ChartController";
import IStockHistory from "../../../../define/IStockHistory";

interface LineOptions {
    stroke?: string;
    square?: boolean;
    excludeRange?: boolean;
}

class Line extends ChartElement<number | null> {
    private _stroke = 'red';
    private _isSquare = false;
    private _excludeRange = false;

    constructor(controller: ChartController,
    convertFunc: (data: IStockHistory[]) => (number | null)[], options?: LineOptions) {
        super(controller, convertFunc)

        if (options) {
            options.stroke && (this._stroke = options.stroke);
            this._isSquare = options.square ?? false;
            this._excludeRange = options.excludeRange ?? false;
        }
    }

    setColor(color: string) {
        this._stroke = color;
    }

    draw() {
        const {ctx} = this;
        const {normalize} = this.controller;
        const normalizedData = this.slicedData.map(v => v ? normalize(v) : null);
        let lastData: number | null = null;

        normalizedData.forEach((v, i) => {
            if (lastData === null) {
                if (v === null) {
                    return;
                }

                lastData = v;
                ctx.beginPath();
                ctx.moveTo(i * this.zoom, this.height - v);
                ctx.strokeStyle = this._stroke;
                return;
            }

            if (v === null) {
                ctx.stroke();
                ctx.closePath();
                lastData = null;
                return;
            }

            if (this._isSquare) {
                ctx.lineTo(i * this.zoom, this.height - v);
                ctx.lineTo((i + 1) * this.zoom, this.height - v);
                return;
            }
            ctx.lineTo((i + 1) * this.zoom - Math.floor((this.zoom / 2)), this.height - v);
        })

        // ctx.lineTo(this.width, this.height - (normalizedData.at(-1) ?? 0))
        ctx.stroke();
        ctx.closePath();
    }

    get range() {
        return this._excludeRange ? null : this.slicedData.reduce((acc, v) => {
            acc.highest = Math.max(acc.highest, v ?? acc.highest);
            acc.lowest = Math.min(acc.lowest, v ?? acc.lowest);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE})
    }
}

export default Line