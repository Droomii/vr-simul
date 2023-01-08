import ChartElement from "./ChartElement";
import ChartController from "../controller/ChartController";
import Util from "../../../../util/Util";

interface TimeGridOptions {
    unit?: 'week' | 'month';
    bin?: number;
}

class TimeGrid extends ChartElement<number> {
    constructor(ctrl: ChartController, options?: TimeGridOptions) {
        super(ctrl, data => data.map(({date}) => {
            const bin = options?.bin ?? 1;
            if (options?.unit === 'month') {
                return Math.floor(new Date(date).getMonth() / bin) % 2;
            }
            return Math.floor(Util.getWeek(date) / bin) % 2;
        }));
    }

    draw(): void {
        const {ctx} = this;
        ctx.fillStyle = '#f8f8f8'
        const first = this.slicedData[0];
        if (first === undefined) return;
        let startIdx = -1;
        this.slicedData.forEach((v, i) => {
            if (v) {
                if (startIdx > -1) {
                    return;
                }

                startIdx = i;
            } else {
                if (startIdx > -1) {
                    ctx.fillRect(startIdx * this.zoom, 0, (i - startIdx) * this.zoom, this.height);
                    startIdx = -1;
                }
            }
        })

        if (startIdx > -1) {
            ctx.fillRect(startIdx * this.zoom, 0, this.width - startIdx * this.zoom, this.height);
        }
    }

    get range(): { lowest: number; highest: number } | null {
        return null;
    }
}

export default TimeGrid;