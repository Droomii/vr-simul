import ChartRoot from "../elements/ChartRoot";
import Util from "../../../../util/Util";
import IDrawable from "../interface/IDrawable";

interface ConstructorOptions {
    debug?: string;
    log?: boolean;
    isSub?: boolean;
}

class ChartController implements IDrawable {
    elements: IDrawable[] = [];
    isLog = false;

    constructor(
        public readonly root: ChartRoot,
        readonly ctx: CanvasRenderingContext2D, options?: ConstructorOptions) {
        if (options) {
            this.isLog = options.log ?? false;
        }

        if (!options?.isSub) root.register(this);
    }

    register(element: IDrawable) {
        this.elements.push(element);
    }

    refresh() {
        this.clear();
        this.draw();
    }

    clear() {
        const wrapper = this.ctx.canvas.parentElement;
        if (!wrapper) return;

        const {width, height} = wrapper.getBoundingClientRect();
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
    }

    draw() {
        this.fitToContainer();
        this.updateRange();
        this.updateNormalizer();
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

    readonly range: { highest: number, lowest: number } = {highest: Number.MAX_VALUE, lowest: Number.MIN_VALUE};

    protected updateRange() {
        const {highest, lowest} = this.elements.reduce((acc, {range, independentRange}) => {
            if (!range || independentRange) return acc;
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
        this.normalize = (val: number) => Math.floor(Util.normalize(multiplier(val), multiplier(lowest * 0.9), this.multiplier(highest / 0.9)) * this.height);
    }

    handleZoom(val: number, x: number) {
        const rolledPos = Math.floor(x / this.zoom);
        this.zoom = Math.min(Math.max(this.width / this.data.length, this.zoom * (1 + (val > 0 ? -0.1 : 0.1))), this.width);
        const newPos = Math.floor(x / this.zoom);
        const posDiff = rolledPos - newPos;
        this.offset = Math.max(0, Math.min(this.offset + posDiff, this.data.length - this.visibleDataCount))
    }

    private fitToContainer() {
        this.zoom = Math.min(Math.max(this.width / this.data.length, this.zoom), this.width);
        this.offset = Math.max(0, Math.min(this.offset, this.data.length - this.visibleDataCount))
    }

    getOffsetSetter = () => {
        const originalOffset = this.offset;
        let lastOffset = this.offset;
        return (val: number, inertia?: boolean) => {
            const newOffset = Math.min(Math.max(originalOffset + Math.floor(val / this.zoom), 0), this.data.length - this.visibleDataCount);
            if (newOffset < 0 && inertia) return true;
            if (lastOffset === newOffset) return false;
            this.offset = newOffset;
            lastOffset = newOffset;
            return !inertia;
        }
    }

    get width() {
        return this.ctx.canvas.width;
    }

    get height() {
        return this.ctx.canvas.height;
    }

    get visibleDataCount() {
        return Math.floor(this.width / (this.zoom));
    }

    get multiplier(): (val: number) => number {
        if (this.isLog) return Math.log2;
        return (v) => v;
    }

    normalize = (val: number) => val;

    destroy() {
        this.root.unregister(this);
    }

    getMousePosData({x, y}: {x: number, y: number}): {x: number; y: number; index: number; price: number;} {
        const {lowest, highest} = this.range;
        return {
            x: Math.ceil(x / this.zoom) * this.zoom - Math.floor(this.zoom / 2),
            y,
            index: Math.max(Math.min(Math.floor(x / this.zoom) + this.offset, this.data.length), 0),
            price: lowest * 0.9 + (highest / 0.9 - lowest * 0.9) * (1 - y / this.height),
        }
    }
}

export default ChartController