import ChartElement from "./ChartElement";
import ChartController from "../controller/ChartController";
import IStockHistory from "../../../../define/IStockHistory";

interface AreaData {
    top: number;
    bottom?: number;
}

interface LineAreaOptions {
    fill?: string;
    topStroke?: string;
    bottomStroke?: string;
}

class Area extends ChartElement<AreaData> {
    private _fill = 'rgba(117,172,255,0.5)';
    private _topStroke = 'blue';
    private _bottomStroke = 'blue';

    setColor(color: string) {
        this._fill = color;
    }

    constructor(controller: ChartController,
                convertFunc: (data: IStockHistory[]) => AreaData[], options?: LineAreaOptions) {
        super(controller, convertFunc);

        if (options) {
            const {fill, topStroke, bottomStroke} = options;
            fill && (this._fill = fill);
            topStroke && (this._topStroke = topStroke);
            bottomStroke && (this._bottomStroke = bottomStroke);
        }
    }

    draw(): void {
        const {ctx, controller: {normalize}} = this;
        ctx.fillStyle = this._fill;
        ctx.strokeStyle = this._topStroke;
        const normalizedData = this.slicedData.map(({top, bottom}) => ({
            top: normalize(top),
            bottom: bottom && normalize(bottom)
        }))
        const firstData = normalizedData[0];
        const lastData = normalizedData.at(-1);
        if (!firstData || !lastData) return;

        ctx.beginPath();
        ctx.moveTo(0, this.height - firstData.top);
        normalizedData.forEach(({top}, i) => {
            ctx.lineTo((i + 1) * this.zoom - Math.floor((this.zoom / 2)), this.height - top);
        });

        ctx.lineTo(this.width, this.height - lastData.top)
        ctx.stroke();
        ctx.lineTo(this.width, this.height - (lastData.bottom ?? 0));
        if (lastData.bottom === undefined) {
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(0, this.height);
            ctx.closePath();
            ctx.fill();
            return;
        }

        normalizedData.forEach((v, i, arr) => {
            const reverseIdx = arr.length - i - 1;
            const {bottom} = arr[reverseIdx];
            ctx.lineTo((reverseIdx + 1) * this.zoom - Math.floor((this.zoom / 2)), this.height - (bottom ?? 0));
        })
        ctx.lineTo(0, this.height - (firstData.bottom ?? 0))
        ctx.lineTo(0, this.height - firstData.top)
        ctx.fill();

        if (!this._bottomStroke) return;

        ctx.beginPath();
        ctx.strokeStyle = this._bottomStroke;
        ctx.moveTo(0, this.height - firstData.bottom!);
        normalizedData.forEach(({bottom}, i) => {
            ctx.lineTo((i + 1) * this.zoom - Math.floor((this.zoom / 2)), this.height - bottom!);
        });

        ctx.lineTo(this.width, this.height - lastData.bottom)
        ctx.stroke();

    }

    get range(): { lowest: number; highest: number } | null {
        return this.slicedData.reduce((acc, {top, bottom}) => {
            acc.highest = Math.max(acc.highest, top, bottom ?? top);
            acc.lowest = Math.min(acc.lowest, top, bottom ?? top);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE})
    }

}

export default Area;