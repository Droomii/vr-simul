import ChartElement from "./ChartElement";
import ChartController from "../controller/ChartController";
import IStockHistory from "../../../../define/IStockHistory";

interface Options {
    stroke?: string;
}

class VerticalLine extends ChartElement<boolean> {
    private _stroke = 'red';

    constructor(controller: ChartController,
                convertFunc: (data: IStockHistory[]) => boolean[], options?: Options) {
        super(controller, convertFunc)

        if (options) {
            options.stroke && (this._stroke = options.stroke);
        }
    }

    setColor(color: string) {
        this._stroke = color;
    }

    draw() {
        const {ctx} = this;
        ctx.strokeStyle = this._stroke;
        this.slicedData.forEach((v, i) => {
            if (v) {
                ctx.beginPath()
                ctx.moveTo((i + 1) * this.zoom - Math.floor((this.zoom / 2)), 0);
                ctx.lineTo((i + 1) * this.zoom - Math.floor((this.zoom / 2)), this.height);
                ctx.stroke();
                ctx.closePath();
                ctx.textAlign = 'left';
                ctx.fillStyle = this._stroke;
            }
        })
    }

    get range() {
        return null;
    }
}

export default VerticalLine