### x-sheet

###### 本项目在 [spreadsheet](https://github.com/myliang/x-spreadsheet) 进行二次开发，增加了一些新的功能。

- 新增功能: 增加很多函数
- 新增功能: 输入公式过程中，鼠标点击其他单元格，可以把这个单元格对应的位置填入到公式中
- 新增功能: 函数提示
- 新增功能: 从excel或者google sheet中能够粘贴数据，同时支持从sheet中把数据粘贴到excel、google sheet

+ 下面的是需要在代码中做进一步配置

- 添加功能: autoAdapt

  - 类型: Boolean
  - 描述:  自适应高和宽，目前该关键字会忽略第一行的数据。
  - 详情:  默认为false，为true时开启该功能。他会先按照列自适应列宽，然后再按照行自适应行宽，可配合关键字 *ignore* 使用。 目前已经在鼠标点击、input回车后、初始加载、format中使用该功能。 主要提供的函数为: renderAutoAdapt和autoRowResizer。

- 添加关键字: ignore

  - 类型: Array
  - 描述: 该关键字是一个数组，主要用与忽略宽的自适应，需要先开启autoAdapt。
  - 详情: 默认为[]。比如想第一列、第二列忽略宽的自适应， 写法如下:  ignore: [0, 1]。主要配合autoAdapt使用。

- 添加模板: flex

  - 类型: Array

  - 描述: 折叠功能，目前支持单层折叠。

  - 格式: 

    ```json
     {
         "ri": 5,		//  第几行，这里为第六行
         "ci": 0,		// 固定为0
         "set_total": 3,	// 折叠的行数
         "set_total_abj": 0,	// 默认设置为0
         "offset": 0,	// 默认设置为0
         "state": False	// false为展开，true为折叠
    },
    ```

- 添加关键字: minus
  - 类型: Boolean
  - 描述: 为true开启，主要作用是判断是否为一个负数，若为负数则文字颜色为红色表示。