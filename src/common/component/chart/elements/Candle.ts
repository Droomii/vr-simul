import ChartElement from "./ChartElement";
import Util from "../../../../util/Util";
import IStockData from "../../../../define/IStockData";

class Candle extends ChartElement<IStockData[]> {
    private containerX = 0;
    private containerY = 0;
    private width = 3;
    private offset = 0;
    private data: IStockData[] = [];

    setData(data: IStockData[]) {
        this.data = data;
    }

    draw() {
        const slicedData = this.data.slice(this.offset, this.candleCount + this.offset)

        const {highest, lowest} = slicedData.reduce((acc, {low, high}) => {
            acc.highest = Math.max(acc.highest, high);
            acc.lowest = Math.min(acc.lowest, low);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE})
        const normalize = (val: number) => Math.floor(Util.normalize(Math.log2(val), Math.log2(lowest * 0.9), Math.log2(highest / 0.9)) * this.containerHeight);
        const {ctx} = this;

        slicedData.map(({open, low, close, high}) => ({
            open: normalize(open),
            low: normalize(low),
            close: normalize(close),
            high: normalize(high)
        })).forEach(({low, close, open, high}, i) => {
            const x = this.containerX + i * (this.width + 1) + 1;
            ctx.fillStyle = open < close ? "#cb6869" : "#218cd3";
            ctx.fillRect(Math.floor(x + this.width / 2), this.containerX + this.containerHeight - high, 1, high - low);
            ctx.fillStyle = open < close ? "#e51a1c" : "#0f7cc4";
            ctx.fillRect(x, this.containerX + this.containerHeight - Math.max(open, close), this.width, Math.max(Math.abs(open - close), 1));
        })
    }

    private get containerHeight() {
        return this.ctx.canvas.height;
    }

    private get candleCount() {
        return Math.floor(this.ctx.canvas.width / (this.width + 1));
    }

    getOffsetSetter = () => {
        let originalOffset = this.offset;
        return (val: number) => {
            const newOffset = Math.min(Math.max(originalOffset + Math.floor(val / (this.width + 1)), 0), this.data.length - this.candleCount);
            if (newOffset < 0) return;
            this.offset = newOffset;
        }
    }

    handleZoom(val: number) {
        this.width = Math.max(0.1, this.width + (val > 0 ? -0.1 : 0.1));
    }
}

export default Candle