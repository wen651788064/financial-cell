import {CellRange} from "../../src/core/cell_range";

export function copyPasteTemplate(cell, data) {
    data.rows.setCell(3, 4, cell, 'all_with_no_workbook');
    const srcCellRange = new CellRange(3, 4, 3, 4, 0, 0);
    const dstCellRange = new CellRange(4, 4, 12, 4, 0, 0);
    data.rows.copyPaste(srcCellRange, dstCellRange, 'all', true);
}