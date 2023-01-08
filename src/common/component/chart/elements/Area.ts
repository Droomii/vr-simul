import ChartElement from "./ChartElement";
import ChartController from "../controller/ChartController";
import IStockHistory from "../../../../define/IStockHistory";

interface AreaData {
    top: number;
    bottom?: number;
}

interface AreaOptions {
    color?: string;
}

class Area extends ChartElement<AreaData> {
    private _color = 'rgba(117,172,255,0.5)';

    setColor(color: string) {
        this._color = color;
    }

    constructor(controller: ChartController,
                convertFunc: (data: IStockHistory[]) => AreaData[], options?: AreaOptions) {
        super(controller, convertFunc);

        if (options) {
            const {color} = options;
            color && (this._color = color);
        }
    }

    draw(): void {
        const {ctx, controller: {normalize}} = this;
        ctx.fillStyle = this._color;
        this.slicedData.map(({top, bottom}) => ({
            top: normalize(top),
            bottom: bottom && normalize(bottom)
        })).forEach(({top, bottom}, i) => {
            ctx.fillRect(1 + this.zoom * i, this.height - top, this.zoom, top - (bottom ?? 0));
        });
    }

    get range(): { lowest: number; highest: number } | null {
        return this.slicedData.reduce((acc, {top, bottom}) => {
            acc.highest = Math.max(acc.highest, top, bottom ?? top);
            acc.lowest = Math.min(acc.lowest, bottom ?? top);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE})
    }

}

export default Area;