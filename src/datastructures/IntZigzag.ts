class IntZigzag {
  private numRows: number;
  private rowLength: number;
  private indices: number;
  private itemList: Array<number | null>;
  constructor(rowLength: number, numRows: number) {
    this.rowLength = rowLength;
    this.numRows = numRows;
    this.indices = rowLength * numRows;
    this.itemList = Array(this.indices).fill(0);
  }

  insertAtIndex(index: number, value: number): void {
    this.itemList[index] = value;
  }

  insertAtRowPos(row: number, col: number, value: number): void {
    const idx = row * this.rowLength + col;
    this.itemList[idx] = value;
  }
  public getItem(index: number): number | null {
    if (index >= 0 && index < this.indices) {
      return this.itemList[index];
    } else {
      console.error("Index out of bounds");
      return null;
    }
  }

  public getIndices(): number {
    return this.indices;
  }

  public getTotalRows(): number {
    return this.numRows;
  }

  public getRowLength(): number {
    return this.rowLength;
  }
}

// const test: IntZigzag = { numRows: 5, rowLength: 7 };
const test = new IntZigzag(5, 4);
for (let i = 0; i < test.getIndices(); i++) {
  test.insertAtIndex(i, Math.pow(i, 2));
}

console.log(test);

export default IntZigzag;
