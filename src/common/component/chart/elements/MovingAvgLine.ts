import Line from "./Line";
import ChartController from "../controller/ChartController";

class MovingAvgLine extends Line {
    constructor(controller: ChartController, n: number, color = 'red') {
        super(controller, data => data.map((v, i, acc) => {
            const sliced = acc.slice(Math.max(0, i - n), i + 1);
            return sliced.reduce((a, b) => a + b.close, 0) / sliced.length
        }));

        this.setColor(color);
    }
}

export default MovingAvgLine;