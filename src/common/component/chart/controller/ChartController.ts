import ChartRoot from "../elements/ChartRoot";
import Util from "../../../../util/Util";
import IDrawable from "../interface/IDrawable";

interface ConstructorOptions {
    debug?: string;
    normalize?: boolean
}

class ChartController implements IDrawable {
    elements: IDrawable[] = [];
    isLog = true;
    protected _isNormalize: boolean = false;

    constructor(
        public readonly root: ChartRoot,
        readonly ctx: CanvasRenderingContext2D, options?: ConstructorOptions) {
        root.register(this);
        this._isNormalize = options?.normalize ?? false;
    }

    register(element: IDrawable) {
        this.elements.push(element);
    }

    clear() {
        const wrapper = this.ctx.canvas.parentElement;
        if (!wrapper) return;

        const {width, height} = wrapper.getBoundingClientRect();
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
    }

    draw() {
        this.updateRange();
        this._isNormalize && this.updateNormalizer();
        this.elements.forEach(v => v.draw());
    }

    get data() {
        return this.root.data
    }

    get zoom() {
        return this.root.zoom
    }

    set zoom(val: number) {
        this.root.zoom = val;
    }

    get offset() {
        return this.root.offset
    }

    set offset(val: number) {
        this.root.offset = val;
    }

    get containerHeight() {
        return this.ctx.canvas.height;
    }

    readonly range: { highest: number, lowest: number } = {highest: Number.MAX_VALUE, lowest: Number.MIN_VALUE};

    protected updateRange() {
        const {highest, lowest} = this.elements.reduce((acc, {range}) => {
            if (!range) return acc;
            const {highest, lowest} = range;
            acc.highest = Math.max(acc.highest, highest, lowest);
            acc.lowest = Math.min(acc.lowest, highest, lowest);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE});
        this.range.highest = highest;
        this.range.lowest = lowest;
    }

    private updateNormalizer() {
        const {highest, lowest} = this.range;
        const {multiplier} = this;
        this.normalize = (val: number) => Math.floor(Util.normalize(multiplier(val), multiplier(lowest * 0.9), this.multiplier(highest / 0.9)) * this.containerHeight);
    }

    get multiplier(): (val: number) => number {
        if (this.isLog) return Math.log2;
        return (v) => v;
    }

    normalize = (val: number) => val;

    destroy() {
        this.root.unregister(this);
    }

}

export default ChartController