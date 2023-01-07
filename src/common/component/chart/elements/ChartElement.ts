import IStockData from "../../../../define/IStockData";
import ChartController from "../controller/ChartController";

abstract class ChartElement<T = IStockData> {
    protected _clearBeforeDraw = true;
    protected _data: T[] = [];

    constructor(
        protected readonly controller: ChartController,
        protected readonly mapFunc: (v: IStockData, i: number, arr: IStockData[]) => T = v => v as T) {
        controller.register(this);
        this.setData();
    }

    setData() {
        this._data = this.controller.data.map(this.mapFunc);
    }

    protected get data() {
        return this._data;
    }

    setClearBeforeDraw(val: boolean) {
        this._clearBeforeDraw = val;
    }

    abstract draw(): void;

    clear() {
        if (!this._clearBeforeDraw) return;
        const wrapper = this.ctx.canvas.parentElement;
        if (!wrapper) return;

        const {width, height} = wrapper.getBoundingClientRect();
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
    }

    protected get zoom() {
        return this.controller.zoom;
    }


    protected get offset() {
        return this.controller.offset
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

    get slicedData() {
        return this.data.slice(this.offset, this.visibleDataCount + this.offset)
    }

    get ctx() {
        return this.controller.ctx
    }

    abstract get range(): { lowest: number, highest: number } | null;
}

export default ChartElement;