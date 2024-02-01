// 本文件是总文件，用于调用其他文件中的类。由于js在调用之前必须先定义，且我们之前写好了按字典序排序所有js文件的函数，所以zbase会排在后面，即先定义再调用减少报错。

//在html文件中写了：let game = new Game();  就会调用到这里
class Game{
    constructor(id){
        this.id = id;
        this.$game = $('#' + id);
        this.menu = new GameMenu(this);
        this.playground = new GamePlayground(this);

        this.start();
    }

    start(){

    };

}
