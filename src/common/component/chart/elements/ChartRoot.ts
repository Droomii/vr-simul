import ChartElement from "./ChartElement";

class ChartRoot {
    zoom = 4;
    offset = 0;
    elements: ChartElement<unknown>[] = [];

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