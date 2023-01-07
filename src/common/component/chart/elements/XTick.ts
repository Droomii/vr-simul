import ChartElement from "./ChartElement";

class XTick extends ChartElement {
    draw(): void {
        const {lowest, highest} = this.controller.range;
        const {normalize, multiplier} = this.controller
        const lowestLog = multiplier(lowest);
        const highestLog = multiplier(highest);
        const diff = highestLog - lowestLog

        const logTick = diff / 10;
        const ticks = Array(10).fill(0).map((v, i) => {
            if (this.isLog) {
                return Math.floor(2 ** (lowestLog + i * logTick) * 100) / 100;
            }
            return Math.floor((lowest + i * logTick) * 100) / 100;
        });
        const {ctx} = this;
        ctx.textAlign = 'right'
        ticks.forEach(y => {
            const normalized = normalize(y)
            ctx.fillStyle = '#efefef';
            ctx.fillRect(0, this.height - normalized, this.width, 1)
            ctx.fillStyle = '#b7b7b7';
            ctx.fillText(String(y), this.width, this.height - normalized - 4)
        })
    }

    get range() {
        return null;
    }

}

export default XTick;