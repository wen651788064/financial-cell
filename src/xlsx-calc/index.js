"use strict";

const int_2_col_str = require('./int_2_col_str.js');
const col_str_2_int = require('./col_str_2_int.js');
const exec_formula = require('./exec_formula.js');
const find_all_cells_with_formulas = require('./find_all_cells_with_formulas.js');
const Calculator = require('./Calculator.js');
const checker = require('./formula_check.js')
var mymodule = function(workbook) { // jobs: 初始化函数，从workook中获取所有的含有公式的
    var formulas = find_all_cells_with_formulas(workbook, exec_formula);
    for (var i = formulas.length - 1; i >= 0; i--) {
        try {
            var cell = formulas[i].cell
            if (!checker.cell_valid(cell)){
                formulas[i].cell.v = '#VALUE!'
            }else{
                // XW: 大括号参数判断
                if (cell.f.indexOf('{') >=0 && cell.f.indexOf('}')>=0 && cell.f.indexOf("'{") <0){
                    var f = formulas[i].cell.f
                    formulas[i].cell = checker.trans_params(cell)
                    exec_formula(formulas[i]);
                    formulas[i].cell.f = f
                // XW: 修改结束
                }else{
                    exec_formula(formulas[i]);
                }
            }
        } catch (e) {

        }
    }
};

mymodule.calculator = function calculator(workbook) {
    return new Calculator(workbook, exec_formula);
};

mymodule.set_fx = exec_formula.set_fx;
mymodule.exec_fx = exec_formula.exec_fx;
mymodule.col_str_2_int = col_str_2_int;
mymodule.int_2_col_str = int_2_col_str;
mymodule.import_functions = exec_formula.import_functions;
mymodule.import_raw_functions = exec_formula.import_raw_functions;
mymodule.xlsx_Fx = exec_formula.xlsx_Fx;
mymodule.localizeFunctions = exec_formula.localizeFunctions;

mymodule.XLSX_CALC = mymodule

module.exports = mymodule;
