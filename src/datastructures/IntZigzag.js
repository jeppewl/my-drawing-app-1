var IntZigzag = /** @class */ (function () {
    function IntZigzag(rowLength, numRows) {
        this.rowLength = rowLength;
        this.numRows = numRows;
        this.indices = rowLength * numRows;
        this.itemList = Array(this.indices).fill(0);
    }
    IntZigzag.prototype.insertAtIndex = function (index, value) {
        this.itemList[index] = value;
    };
    IntZigzag.prototype.insertAtRowPos = function (row, col, value) {
        var idx = row * this.rowLength + col;
        this.itemList[idx] = value;
    };
    IntZigzag.prototype.getItem = function (index) {
        if (index >= 0 && index < this.indices) {
            return this.itemList[index];
        }
        else {
            console.error("Index out of bounds");
            return null;
        }
    };
    IntZigzag.prototype.getIndices = function () {
        return this.indices;
    };
    IntZigzag.prototype.getTotalRows = function () {
        return this.numRows;
    };
    IntZigzag.prototype.getRowLength = function () {
        return this.rowLength;
    };
    return IntZigzag;
}());
// const test: IntZigzag = { numRows: 5, rowLength: 7 };
var test = new IntZigzag(5, 4);
for (var i = 0; i < test.getIndices(); i++) {
    test.insertAtIndex(i, Math.pow(i, 2));
}
// test.insertAtIndex(0, 1);
// test.insertAtRowPos(0, 1, 2);
// test.insertAtRowPos(1, 0, 3);
// // console.log(test.getItem(0));
// console.log(test.getIndices());
console.log(test);
