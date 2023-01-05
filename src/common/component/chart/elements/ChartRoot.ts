import ChartElement from "./ChartElement";
import IStockData from "../../../../define/IStockData";
import TQQQ from "../../../../stockData/TQQQ";

class ChartRoot {
    zoom = 4;
    offset = 0;
    elements: ChartElement<unknown>[] = [];
    data: IStockData[] = TQQQ;

    register(element: ChartElement<unknown>) {
        this.elements.push(element);
    }

    readonly refresh = () => {
        this.elements.forEach(v => {
            v.clear();
            v.draw()
        });
    }
}

export default ChartRoot;