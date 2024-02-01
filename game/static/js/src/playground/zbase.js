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
