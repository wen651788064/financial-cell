(function () {
    //在子线程 模拟一个耗时操作
    for (var i = 0; i < 1000000000; i++) {

    }
    //耗时操作完毕后，调用postMessage方法回到主线程，
    //并且把数据传回去
    postMessage(i);
})();