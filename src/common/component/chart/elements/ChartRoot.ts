import IStockHistory from "../../../../define/IStockHistory";
import ChartController from "../controller/ChartController";
import Util from "../../../../util/Util";

class ChartRoot {
    zoom = 6;
    offset = 0;
    controllers: Set<ChartController> = new Set();
    private _data: IStockHistory[] = [];
    private _startDate = '2000-01-01';
    private _endDate = new Date().toISOString().substring(0, 10);
    private _slicedData: IStockHistory[] = [];
    private _cleanup: (() => void) | null = null;
    async loadData(ticker: string, callback: () => (() => void)) {
        this.zoom = 0;
        this.offset = 0;
        const dataFetch = fetch(`/data/${ticker}.csv`).then(v => v.text());
        const splitFetch = fetch(`/data/${ticker}_split.csv`).then(v => v.text());
        this._data = Util.parseData(await dataFetch, await splitFetch);
        this.updateSlice();
        this._cleanup = callback();
    }

    private updateSlice() {
        this._slicedData = this._data.slice(this._data.findIndex(v => v.date >= this.startTime))
        const endIdx = this._slicedData.findIndex(v => v.date >= this.endTime);
        if (endIdx > -1) {
            this._slicedData = this._slicedData.slice(0, endIdx + 1);
        }
    }

    register(controller: ChartController) {
        this.controllers.add(controller);
    }

    get startDate(): string {
        return this._startDate;
    }

    get startTime(): number {
     return new Date(this.startDate).getTime();
    }

    set startDate(value: string) {
        this._startDate = value;
    }

    get endDate(): string {
        return this._endDate;
    }

    get endTime(): number {
        return new Date(this.endDate).getTime();
    }

    set endDate(value: string) {
        this._endDate = value;
    }

    get data() {
        return this._slicedData;
    }

    unregister(controller: ChartController) {
        this.controllers.delete(controller);
    }

    readonly refresh = () => {
        this.controllers.forEach(v => v.refresh());
    }

    cleanup = () => {
        this.controllers.forEach(v => v.destroy());
        this._cleanup?.();
    }
}

export default ChartRoot;