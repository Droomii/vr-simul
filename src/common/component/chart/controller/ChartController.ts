import ChartRoot from "../elements/ChartRoot";
import IDrawable from "../interface/IDrawable";
import Line from "../elements/Line";
import Candle from "../elements/Candle";
import Area from "../elements/Area";
import LineArea from "../elements/LineArea";
import Split from "../elements/Split";
import TimeGrid from "../elements/TimeGrid";
import YTick from "../elements/YTick";
import Util from "../../../../util/Util";
import addChartEventListener from "./addChartEventListener";
import IStockHistory from "../../../../define/IStockHistory";

export interface ControllerConstructorOptions {
  debug?: string;
  log?: boolean;
  isSub?: boolean;
}

const ElementMap = {
  line: Line,
  area: Area,
  candle: Candle,
  lineArea: LineArea,
  stockSplit: Split,
  timeGrid: TimeGrid,
  yTick: YTick,
} as const;

type ElementClass = new (ctrl: ChartController, ...args: any) => IDrawable
type ElementConstructorParams<T extends ElementClass> = T extends new (ctrl: ChartController, ...args: infer P) => IDrawable ? P : any;

interface IMousePosData {
  mouseX: number;
  mouseY: number;
  dataIndex: number;
  data: IStockHistory;
  valueX: number;
}

type EventHandlerMap = {
  mousemove: ((data: IMousePosData) => void);
  mouseout: ((data: IMousePosData) => void);
  mousedown: ((data: IMousePosData) => void);
}

class ChartController implements IDrawable {
  private _debugName?: string;
  independentRange = false;
  elements: IDrawable[] = [];
  isLog = false;
  cleanup?: () => void;
  readonly canvas: HTMLCanvasElement;
  onMouseMove?: ((data: IMousePosData) => void) | null = null;
  onMouseOut?: ((data: IMousePosData) => void) | null = null;
  onMouseDown?: ((data: IMousePosData) => void) | null = null;

  constructor(
    public readonly root: ChartRoot,
    readonly ctx: CanvasRenderingContext2D, options?: ControllerConstructorOptions) {
    this.canvas = ctx.canvas;

    if (options) {
      this.isLog = options.log ?? false;
      this._debugName = options.debug
    }

    if (options?.isSub) {
      this.independentRange = true;
      return;
    }

    root.register(this);

    this.cleanup = addChartEventListener(this);
  }

  addElement<Element extends keyof typeof ElementMap>(element: Element, ...options: ElementConstructorParams<typeof ElementMap[Element]>): InstanceType<typeof ElementMap[Element]> {
    return new ElementMap[element](this, ...(options as [any])) as InstanceType<typeof ElementMap[Element]>;
  }

  setEventListener<Event extends keyof EventHandlerMap>(event: Event, handler: EventHandlerMap[Event]) {
    switch (event) {
      case 'mousemove':
        this.onMouseMove = handler;
        return;
      case 'mousedown':
        this.onMouseDown = handler;
        return;
      case 'mouseout':
        this.onMouseOut = handler;
    }
  }

  removeEventListeners() {
    this.onMouseDown = null;
    this.onMouseOut = null;
    this.onMouseMove = null;
  }

  addSubController(options: Omit<ControllerConstructorOptions, 'isSub'>) {
    const subCtrl = new ChartController(this.root, this.ctx, {...options, isSub: true});
    this.register(subCtrl);
    return subCtrl;
  }

  register(element: IDrawable) {
    this.elements.push(element);
  }

  refresh() {
    this.clear();
    this.zoom = Math.min(Math.max(this.width / this.data.length, this.zoom), this.width);
    this.offset = Math.max(0, Math.min(this.offset, this.data.length - this.visibleDataCount))
    this.draw();
  }

  clear() {
    const wrapper = this.ctx.canvas.parentElement;
    if (!wrapper) return;

    const {width, height} = wrapper.getBoundingClientRect();
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;
  }

  draw() {
    this.fitToContainer();
    this.updateRange();
    this.updateNormalizer();
    this.elements.forEach(v => v.draw());
  }

  get data() {
    return this.root.data
  }

  get zoom() {
    return this.root.zoom
  }

  set zoom(val: number) {
    this.root.zoom = val;
  }

  get offset() {
    return this.root.offset
  }

  set offset(val: number) {
    this.root.offset = val;
  }

  readonly range: { highest: number, lowest: number } = {highest: Number.MAX_VALUE, lowest: Number.MIN_VALUE};

  protected updateRange() {
    const {highest, lowest} = this.elements.reduce((acc, {range, independentRange}) => {
      if (!range || independentRange) return acc;
      const {highest, lowest} = range;
      acc.highest = Math.max(acc.highest, highest, lowest);
      acc.lowest = Math.min(acc.lowest, highest, lowest);
      return acc;
    }, {highest: Number.MIN_VALUE, lowest: Number.MAX_VALUE});
    this.range.highest = highest;
    this.range.lowest = lowest;
  }

  private updateNormalizer() {
    const {highest, lowest} = this.range;
    const {multiplier} = this;
    this.normalize = (val: number) => Math.floor(Util.normalize(multiplier(val), multiplier(lowest * 0.9), this.multiplier(highest / 0.9)) * this.height);
  }

  handleZoom(val: number, x: number) {
    const rolledPos = Math.floor(x / this.zoom);
    this.zoom = Math.min(Math.max(this.width / this.data.length, this.zoom * (1 + (val > 0 ? -0.1 : 0.1))), this.width);
    const newPos = Math.floor(x / this.zoom);
    const posDiff = rolledPos - newPos;
    this.offset = Math.max(0, Math.min(this.offset + posDiff, this.data.length - this.visibleDataCount))
  }

  private fitToContainer() {
    this.zoom = Math.min(Math.max(this.width / this.data.length, this.zoom), this.width);
    this.offset = Math.max(0, Math.min(this.offset, this.data.length - this.visibleDataCount))
  }

  getOffsetSetter = () => {
    const originalOffset = this.offset;
    let lastOffset = this.offset;
    return (val: number, inertia?: boolean) => {
      const newOffset = Math.min(Math.max(originalOffset + Math.floor(val / this.zoom), 0), this.data.length - this.visibleDataCount);

      if (inertia) {
        if (lastOffset !== newOffset) {
          this.offset = newOffset;
          lastOffset = newOffset;
        }

        if (originalOffset + Math.floor(val / this.zoom) <= 0) {
          return true;
        }

        if (originalOffset + Math.floor(val / this.zoom) >= this.data.length - this.visibleDataCount) {
          return true;
        }
        return false;
      }

      if (newOffset < 0 && inertia) return true;
      if (lastOffset === newOffset) return true;
      this.offset = newOffset;
      lastOffset = newOffset;
      return !inertia;
    }
  }

  get width() {
    return this.ctx.canvas.width;
  }

  get height() {
    return this.ctx.canvas.height;
  }

  get visibleDataCount() {
    return Math.floor(this.width / (this.zoom));
  }

  get multiplier(): (val: number) => number {
    if (this.isLog) return Math.log2;
    return (v) => v;
  }

  normalize = (val: number) => val;

  destroy() {
    this.root.unregister(this);
    this.removeEventListeners();
    this.cleanup?.()
  }

  getMousePosData(coord: { x: number, y: number }): IMousePosData {
    let {x, y} = this.canvas.getBoundingClientRect();
    x = coord.x - x;
    y = coord.y - y;

    const {lowest, highest} = this.range;
    const dataIndex = Math.max(Math.min(Math.floor(x / this.zoom) + this.offset, this.data.length), 0);
    return {
      mouseX: Math.ceil(x / this.zoom) * this.zoom - Math.floor(this.zoom / 2),
      mouseY: y,
      dataIndex,
      valueX: lowest * 0.9 + (highest / 0.9 - lowest * 0.9) * (1 - y / this.height),
      data: this.data[dataIndex]
    }
  }
}

export default ChartController