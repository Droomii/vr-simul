import ChartElement from "./ChartElement";
import ChartController from "../controller/ChartController";

interface XTickOptions {
    noTick?: boolean;
    noLabel?: boolean;
    fontColor?: string;
}

class XTick extends ChartElement {
    private _noTick = false;
    private _noLabel = false;
    private _fontColor = '#9b9b9b';

    constructor(controller: ChartController, options?: XTickOptions) {
        super(controller, v => v);
        this._noTick = options?.noTick ?? false;
        this._noLabel = options?.noLabel ?? false;
        this._fontColor = options?.fontColor ?? this._fontColor;
    }

    draw(): void {
        const {lowest, highest} = this.controller.range;
        const {normalize, multiplier} = this.controller
        const lowestLog = multiplier(lowest);
        const highestLog = multiplier(highest);
        const diff = highestLog - lowestLog

        const logTick = diff / 10;

        const ticks = Array(10).fill(0).map((v, i) => {
            if (this.isLog) {
                return Math.floor(2 ** (lowestLog + i * logTick) * 100) / 100;
            }
            return Math.floor((lowest + i * logTick) * 100) / 100;
        });
        const {ctx} = this;
        ctx.textAlign = 'right'
        ctx.font = '12px arial'
        ticks.forEach(y => {
            const normalized = normalize(y)
            if (!this._noTick) {
                ctx.fillStyle = '#efefef';
                ctx.fillRect(0, this.height - normalized, this.width, 1)
            }

            if (!this._noLabel) {
                ctx.fillStyle = this._fontColor;
                ctx.fillText(((this.slicedData.at(-1)?.ratio ?? 1) * y).toLocaleString(), this.width, this.height - normalized - 4)
            }
        })
    }

    get range() {
        return null;
    }

}

export default XTick;