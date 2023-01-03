import ChartElement from "./ChartElement";
import Util from "../../../../util/Util";
import IStockData from "../../../../define/IStockData";

class Candle extends ChartElement<IStockData[]> {
    private containerX = 0;
    private containerY = 0;
    private width = 3;

    draw(data: IStockData[]) {
        const {highest, lowest} = data.reduce((acc, {low, high}) => {
            acc.highest = Math.max(acc.highest, high);
            acc.lowest = Math.min(acc.lowest, low);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE})
        const normalize = (val: number) => Math.floor(Util.normalize(Math.log2(val), Math.log2(lowest), Math.log2(highest)) * this.containerHeight);
        const {ctx} = this;

        data.map(({open, low, close, high}) => ({
            open: normalize(open),
            low: normalize(low),
            close: normalize(close),
            high: normalize(high)
        })).forEach(({low, close, open, high}, i) => {
            const x = this.containerX + i * (this.width + 1) + 1;
            ctx.fillStyle = open < close ? "#e51a1c" : "#0f7cc4";
            ctx.fillRect(x, this.containerX + this.containerHeight - Math.max(open, close), this.width, Math.max(Math.abs(open - close), 1));
            ctx.fillRect(Math.floor(x + this.width / 2), this.containerX + this.containerHeight - high, 1, high - low);
        })
    }

    private get containerHeight() {
        return this.ctx.canvas.height;
    }

}

export default Candle