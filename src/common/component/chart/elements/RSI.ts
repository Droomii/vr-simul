import Line from "./Line";

class RSI extends Line {
    get range() {
        return {lowest: 0, highest: 100};
    }
}

export default RSI