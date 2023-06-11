import IStockHistory from "../../../../define/IStockHistory";
import ChartController, {ControllerConstructorOptions} from "../controller/ChartController";

class ChartRoot {
  zoom = 6;
  offset = 0;
  controllers: Set<ChartController> = new Set();
  private _data: IStockHistory[] = [];
  private _startDate = '2000-01-01';
  private _endDate = new Date().toISOString().substring(0, 10);
  private _slicedData: IStockHistory[] = [];

  loadData(data: IStockHistory[], callback: () => void) {
    this.zoom = 0;
    this.offset = 0;
    this._data = data;
    this.updateSlice();
    callback();
    this.refresh();
  }

  addController(context: CanvasRenderingContext2D, options: ControllerConstructorOptions) {
    return new ChartController(this, context, options);
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
  }
}

export default ChartRoot;