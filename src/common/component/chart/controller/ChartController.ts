import ChartRoot from "../elements/ChartRoot";
import ChartElement from "../elements/ChartElement";
import Util from "../../../../util/Util";

class ChartController {
    elements: ChartElement<unknown>[] = [];
    isLog = true;

    constructor(
        protected readonly root: ChartRoot,
        readonly ctx: CanvasRenderingContext2D) {
        root.register(this);
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

    get range(): {highest: number, lowest: number} {
        return this.elements.reduce((acc, {range: {highest, lowest}}) => {
            acc.highest = Math.max(acc.highest, highest, lowest);
            acc.lowest = Math.min(acc.lowest, highest, lowest);
            return acc;
        }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE});
    }

    readonly getNormalizeFunc = () => {
        const {highest, lowest} = this.range;
        return (val: number) => Math.floor(Util.normalize(Math.log2(val), Math.log2(lowest * 0.9), Math.log2(highest / 0.9)) * this.containerHeight);
    }

}

export default ChartController