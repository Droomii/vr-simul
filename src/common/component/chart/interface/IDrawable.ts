interface IDrawable {
    draw(): void;

    range: { lowest: number, highest: number } | null;
}

export default IDrawable;