import IStockHistory from "../../../../define/IStockHistory";
import ChartController from "../controller/ChartController";
import Util from "../../../../util/Util";

class ChartRoot {
    zoom = 6;
    offset = 0;
    controllers: Set<ChartController> = new Set();
    private _data: IStockHistory[] = [];
    startDate = '2021-04-16';

    async loadData(ticker: string) {
        const dataFetch = fetch(`/data/${ticker}.csv`).then(v => v.text());
        const splitFetch = fetch(`/data/${ticker}_split.csv`).then(v => v.text());
        await Promise.all([dataFetch, splitFetch])
        this._data = Util.parseData(await dataFetch, await splitFetch);
    }

    register(controller: ChartController) {
        this.controllers.add(controller);
    }

    get data() {
        return this._data.slice(this._data.findIndex(v => v.date >= new Date(this.startDate).getTime()))
    }

    unregister(controller: ChartController) {
        this.controllers.delete(controller);
    }

    readonly refresh = () => {
        this.controllers.forEach(v => {
            v.refresh();
        });
    }
}

export default ChartRoot;