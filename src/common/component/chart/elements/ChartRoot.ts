import IStockData from "../../../../define/IStockData";
import TQQQ from "../../../../stockData/TQQQ";
import ChartController from "../controller/ChartController";

class ChartRoot {
    zoom = 4;
    offset = 0;
    controllers: ChartController[] = [];
    data: IStockData[] = TQQQ;

    register(controller: ChartController) {
        this.controllers.push(controller);
    }

    readonly refresh = () => {
        this.controllers.forEach(v => {
            v.clear();
            v.draw()
        });
    }
}

export default ChartRoot;