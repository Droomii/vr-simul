import IStockHistory from "../../../../define/IStockHistory";
import TQQQ from "../../../../stockData/TQQQ";
import ChartController from "../controller/ChartController";

class ChartRoot {
    zoom = 6;
    offset = 0;
    controllers: Set<ChartController> = new Set();
    data: IStockHistory[] = TQQQ;

    register(controller: ChartController) {
        this.controllers.add(controller);
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