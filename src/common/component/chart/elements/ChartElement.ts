import IStockHistory from "../../../../define/IStockHistory";
import ChartController from "../controller/ChartController";
import IDrawable from "../interface/IDrawable";

abstract class ChartElement<T = IStockHistory> implements IDrawable {
    protected _data: T[] = [];

    constructor(
        protected readonly controller: ChartController,
        protected readonly convertFunc: (data: IStockHistory[]) => T[]) {
        controller.register(this);
        this.setData();
    }

    setData() {
        this._data = this.convertFunc(this.controller.data);
    }

    protected get data() {
        return this._data;
    }

    abstract draw(): void;

    protected get zoom() {
        return this.controller.zoom;
    }


    protected get offset() {
        return this.controller.offset
    }

    protected get width() {
        return this.controller.width;
    }

    protected get height() {
        return this.controller.height;
    }

    protected get visibleDataCount() {
        return this.controller.visibleDataCount;
    }

    get slicedData() {
        return this.data.slice(this.offset, this.visibleDataCount + this.offset)
    }

    get ctx() {
        return this.controller.ctx
    }

    abstract get range(): { lowest: number, highest: number } | null;

    protected get isLog() {
        return this.controller.isLog;
    }
}

export default ChartElement;