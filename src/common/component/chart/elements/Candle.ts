import ChartElement from "./ChartElement";
import IStockData from "../../../../define/IStockData";

class Candle extends ChartElement<IStockData> {
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
            ctx.fillStyle = open < close ? "#cb6869" : "#218cd3";
            ctx.fillRect(Math.floor(x + (this.zoom - 1) / 2), this.height - high, 1, high - low);
            ctx.fillStyle = open < close ? "#e51a1c" : "#0f7cc4";
            ctx.fillRect(x, this.containerHeight - Math.max(open, close), this.zoom - 1, Math.max(Math.abs(open - close), 1));
        })
    }

    private get containerHeight() {
        return this.controller.containerHeight;
    }

    getOffsetSetter = () => {
        const originalOffset = this.controller.offset;
        let lastOffset = this.controller.offset;
        return (val: number, inertia?: boolean) => {
            const newOffset = Math.min(Math.max(originalOffset + Math.floor(val / this.zoom), 0), this.data.length - this.visibleDataCount);
            if (newOffset < 0 && inertia) return true;
            if (lastOffset === newOffset) return false;
            this.controller.offset = newOffset;
            lastOffset = newOffset;
            return !inertia;
        }
    }

    handleZoom(val: number, x: number) {
        const rolledPos = Math.floor(x / this.zoom);
        this.controller.zoom = Math.min(Math.max(this.width / this.data.length, this.zoom * (1 + (val > 0 ? -0.1 : 0.1))), this.width);
        const newPos = Math.floor(x / this.zoom);
        const posDiff = rolledPos - newPos;
        this.controller.offset = Math.max(0, Math.min(this.controller.offset + posDiff, this.data.length - this.visibleDataCount))
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