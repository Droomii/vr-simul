interface IDrawable {
    draw(): void;

    independentRange?: boolean;
    range: { lowest: number, highest: number } | null;
}

export default IDrawable;