import ChartElement from "./ChartElement";
import IStockHistory from "../../../../define/IStockHistory";
import ChartController from "../controller/ChartController";

interface CandleOptions {
    riseBoxColor?: string;
    riseWickColor?: string;
    fallBoxColor?: string;
    fallWickColor?: string;
}

class Candle extends ChartElement<IStockHistory> {
    private _riseBoxColor = "#cb6869"
    private _riseWickColor = "#e51a1c"
    private _fallBoxColor = "#0f7cc4"
    private _fallWickColor = "#218cd3"

    constructor(controller: ChartController, options?: CandleOptions) {
        super(controller, v => v);

        if (options) {
            const {fallWickColor,riseWickColor,riseBoxColor,fallBoxColor} = options;
            this._riseBoxColor = riseBoxColor ?? this._riseBoxColor;
            this._fallBoxColor = fallBoxColor ?? this._fallBoxColor;
            this._riseWickColor = riseWickColor ?? this._riseWickColor;
            this._fallWickColor = fallWickColor ?? this._fallWickColor;
        }
    }

    draw() {
        const {ctx} = this;
        const {normalize} = this.controller;
        this.slicedData.map(({open, low, close, high}) => ({
            open: normalize(open),
            low: normalize(low),
            close: normalize(close),
            high: normalize(high)
        })).forEach(({low, close, open, high}, i) => {
            const x = i * (this.zoom) + 1;
            ctx.fillStyle = open < close ? this._riseWickColor : this._fallWickColor;
            ctx.fillRect(Math.floor(x + (this.zoom - 1) / 2), this.height - high, 1, high - low);
            ctx.fillStyle = open < close ? this._riseBoxColor : this._fallBoxColor;
            ctx.fillRect(x, this.height - Math.max(open, close), this.zoom - 1, Math.max(Math.abs(open - close), 1));
        })
    }

    get range() {
        return this.slicedData.reduce((acc, {low, high}) => {
            acc.highest = Math.max(acc.highest, high);
            acc.lowest = Math.min(acc.lowest, low);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE})
    }
}

export default Candle