"use strict";
//XW：参数为dfsd:dfsdf这样时会死循环卡住，修复部分（对cell中参数做判断，不符合要球将值修改为错误值返回
exports.cell_valid = function (cell) {
  var text = cell.f
  var params = text.match('[a-z|A-Z]+:[a-z|A-Z]+')
  if (params != null){
    for (var i=0;i<params.length;i++){
      if (params[i].split(':')[0].length != params[i].split(':')[1].length){
        return false
      }
    }
  }
  // //对参数形如=ADD(ABCDE, ABC, abc) =ABfsdaf这种纯字母不带""时直接报错
  // if (text.indexOf('(') <=0 && text.match('[a-z|A-Z]{2,100}') != null){
  //   return false
  // }
  // var param_text = text.match('\((.*?)\)')
  // var params = text.match('[a-z|A-Z]{2,100}')
  // console.log(params)
  return true
}
//XW: end
//XW:大括号参数判断,有大括号参数用''包起来作为一个参数
exports.trans_params = function (cell) {
  var reg = new RegExp('\{(.*?)\}', 'g')
  var arg = cell.f.match(reg)
  if (arg != null){
    for (var i=0; i<arg.length; i++){
      var param = arg[i]
      var rep = "'" + param + "'"
      cell.f = cell.f.replace(param, rep)
    }
  }
  return cell
}
//XW:end


exports.check_params = function (args){
  try{
    if (typeof args[0] == 'string' && args[0][0] == '='){
      return '#ERROR!'
    }
    for (var i=0;i<args.length;i++){
      if (args[i].name == 'RefValue'){
        var sheet = args[i].formula.sheet
        //未定义单元格置为0
        if (sheet[args[i].str_expression] == undefined){
          args[i].formula.sheet[args[i].str_expression] = {v: 0}
        }
        //=A0形式参数报错
        if (args[i].str_expression.slice(1, args[i].str_expression.length) == '0'){
          return '#NAME?';
        }
        // if (sheet[args[i].str_expression] == '""""'){
        //     args[i].formula.sheet[args[i].str_expression] = {v: '"'}
        // }
      }
    }
  }catch (e) {
  }
  try{
    //2019年10月19日形式参数转为2019-10-19
    if (args[0].name == 'RefValue' && args[1] == '-' && args[2].name == 'RefValue'){
      var sheet = args[0].formula.sheet
      var a = sheet[args[0].str_expression].v
      var b = sheet[args[2].str_expression].v
      var a = a.replace('年', '-').replace('月', '-').replace('日', '')
      var b = b.replace('年', '-').replace('月', '-').replace('日', '')
      return datedifference(a, b)
    }
  }catch (e) {
  }
}