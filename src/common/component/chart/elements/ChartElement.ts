abstract class ChartElement<T> {
    constructor(protected readonly ctx: CanvasRenderingContext2D) {
    }

    abstract draw(options: T): void;
}

export default ChartElement;