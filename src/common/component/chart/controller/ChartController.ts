import ChartRoot from "../elements/ChartRoot";
import ChartElement from "../elements/ChartElement";
import Util from "../../../../util/Util";

interface ConstructorOptions {
    debug?: string;
    normalize?: boolean
}

class ChartController {
    elements: ChartElement<unknown>[] = [];
    isLog = true;
    private readonly _isNormalize: boolean = false;

    constructor(
        protected readonly root: ChartRoot,
        readonly ctx: CanvasRenderingContext2D, options?: ConstructorOptions) {
        root.register(this);
        this._isNormalize = options?.normalize ?? false;
    }

    register(element: ChartElement<unknown>) {
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

    private updateRange() {
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

        this.normalize = (val: number) => Math.floor(Util.normalize(Math.log2(val), Math.log2(lowest * 0.9), Math.log2(highest / 0.9)) * this.containerHeight);
    }

    normalize = (val: number) => val;

    destroy() {
        this.root.unregister(this);
    }

}

export default ChartController