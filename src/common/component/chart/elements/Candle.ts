import ChartElement from "./ChartElement";
import Util from "../../../../util/Util";
import IStockData from "../../../../define/IStockData";

class Candle extends ChartElement<IStockData> {
    draw() {
        const {highest, lowest} = this.slicedData.reduce((acc, {low, high}) => {
            acc.highest = Math.max(acc.highest, high);
            acc.lowest = Math.min(acc.lowest, low);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE})
        const normalize = (val: number) => Math.floor(Util.normalize(Math.log2(val), Math.log2(lowest * 0.9), Math.log2(highest / 0.9)) * this.containerHeight);
        const {ctx} = this;

        this.slicedData.map(({open, low, close, high}) => ({
            open: normalize(open),
            low: normalize(low),
            close: normalize(close),
            high: normalize(high)
        })).forEach(({low, close, open, high}, i) => {
            const x = i * (this.zoom) + 1;
            ctx.fillStyle = open < close ? "#cb6869" : "#218cd3";
            ctx.fillRect(Math.floor(x + (this.zoom - 1) / 2), this.containerHeight - high, 1, high - low);
            ctx.fillStyle = open < close ? "#e51a1c" : "#0f7cc4";
            ctx.fillRect(x, this.containerHeight - Math.max(open, close), this.zoom - 1, Math.max(Math.abs(open - close), 1));
        })
    }

    private get containerHeight() {
        return this.ctx.canvas.height;
    }

    getOffsetSetter = () => {
        const originalOffset = this.root.offset;
        let lastOffset = this.root.offset;
        return (val: number, inertia?: boolean) => {
            const newOffset = Math.min(Math.max(originalOffset + Math.floor(val / this.zoom), 0), this.data.length - this.visibleDataCount);
            if (newOffset < 0 && inertia) return true;
            if (lastOffset === newOffset) return false;
            this.root.offset = newOffset;
            lastOffset = newOffset;
            return !inertia;
        }
    }

    handleZoom(val: number, x: number) {
        const rolledPos = Math.floor(x / this.zoom);
        this.root.zoom = Math.max(1, this.zoom * (1 + (val > 0 ? -0.1 : 0.1)));
        const newPos = Math.floor(x / this.zoom);
        const posDiff = rolledPos - newPos;
        this.root.offset = Math.max(0, Math.min(this.root.offset + posDiff, this.data.length - this.visibleDataCount))
    }
}

export default Candle