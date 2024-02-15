// 本文件是总文件，用于调用其他文件中的类。由于js在调用之前必须先定义，且我们之前写好了按字典序排序所有js文件的函数，所以zbase会排在后面，即先定义再调用减少报错。

//由于最后都打包到一个文件里，所以各个类的相互调用不需要export
//但是整个文件需要一个export，所以在主类Game需要export

//在html文件中写了：let game = new Game();  就会调用到这里
export class Game {
    constructor(id, os, access, refresh) {  //你在哪个系统登录，os就自动传什么。WEB端默认没有os参数
        this.id = id;
        this.$game = $('#' + id);
        this.os = os;  //识别是哪个前端
        this.access = access;
        this.refresh = refresh;
        this.settings = new Settings(this);
        this.menu = new GameMenu(this);
        this.playground = new GamePlayground(this);

        this.start();
    }

    start() {

    };

}
