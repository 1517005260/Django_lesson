class GameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
        <div class="game-menu">
        <div class="game-menu-field">
            <div class="game-menu-field-item game-menu-field-item-single-mode">
                人机对战
            </div>
            <br>
            <div class="game-menu-field-item game-menu-field-item-multi-mode">
                多人对战
            </div>
            <br>
            <div class="game-menu-field-item game-menu-field-item-settings">
                设置
            </div>
        </div>
        </div>
        `);

        this.root.$game.append(this.$menu);
        this.$single_mode = this.$menu.find('.game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.game-menu-field-item-settings');

        this.start();
    }

    start(){
        this.events();
    }

    events() {
        let outer = this;

        this.$single_mode.on('click', function () {
            outer.hide();
            outer.root.playground.show();
        });
        this.$multi_mode.on('click', function () {
            console.log('click multi mode');
        });
        this.$settings.on('click', function () {
            console.log('click settings');
        });
    }

    hide() {    //关闭menu界面
        this.$menu.hide();
    }

    show() {    //打开menu界面
        this.$menu.show();
    }
}
class GamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`
        <div>游戏界面<div>
        `);

        this.hide();   //一开始我们在菜单界面，所以要隐藏playground界面

        this.root.$game.append(this.$playground);

        this.start();
    }


    start() {

    }

    show() {
        this.$playground.show();
    }

    hide() {
        this.$playground.hide();
    }
}
// 本文件是总文件，用于调用其他文件中的类。由于js在调用之前必须先定义，且我们之前写好了按字典序排序所有js文件的函数，所以zbase会排在后面，即先定义再调用减少报错。

//在html文件中写了：let game = new Game();  就会调用到这里
export class Game {
    constructor(id) {
        this.id = id;
        this.$game = $('#' + id);
        this.menu = new GameMenu(this);
        this.playground = new GamePlayground(this);

        this.start();
    }

    start() {

    };

}
