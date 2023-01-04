import ChartRoot from "./ChartRoot";

abstract class ChartElement<T> {
    constructor(protected readonly root: ChartRoot, protected readonly ctx: CanvasRenderingContext2D) {
        root.register(this);
    }

    protected data: T[] = [];

    setData(data: T[]) {
        this.data = data;
    }

    abstract draw(): void;
    clear() {
        const wrapper = this.ctx.canvas.parentElement;
        if (!wrapper) return;

        const {width, height} = wrapper.getBoundingClientRect();
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
    }

    protected get zoom() {
        return this.root.zoom;
    }


    protected get offset() {
        return this.root.offset
    }

    protected get width() {
        return this.ctx.canvas.width;
    }

    protected get height() {
        return this.ctx.canvas.height;
    }

    protected get visibleDataCount() {
        return Math.floor(this.ctx.canvas.width / (this.zoom));
    }

    protected get slicedData() {
        return this.data.slice(this.offset, this.visibleDataCount + this.offset)
    }

}

export default ChartElement;