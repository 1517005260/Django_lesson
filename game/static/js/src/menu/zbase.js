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