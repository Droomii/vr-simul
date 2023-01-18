import IStockHistory from "../../../../define/IStockHistory";
import ChartController from "../controller/ChartController";
import TQQQ from "../../../../stockData/TQQQ";

class ChartRoot {
    zoom = 6;
    offset = 0;
    controllers: Set<ChartController> = new Set();
    private _data: IStockHistory[] = TQQQ;
    startDate = '2021-04-16';

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