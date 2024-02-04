class GamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`
        <div class="game-playground"><div>
        `);

        this.hide();   //一开始我们在菜单界面，所以要隐藏playground界面

        this.start();
    }

    get_random_color() {
        let colors = ['blue', 'pink', 'red', 'grey', 'green', 'yellow', 'purple',];
        return colors[Math.floor(Math.random() * colors.length)];
    }


    start() {

    }

    show() {
        this.$playground.show();

        this.root.$game.append(this.$playground);
        this.width = this.$playground.width();
        this.height = this.$playground.height();

        this.game_map = new GameMap(this);

        this.players = [];  //添加5个机器人和自己
        for (let i = 0; i < 5; i++)
            this.players.push(new Player(this, {
                x: this.width / 2,
                y: this.height / 2,
                radius: this.height * 0.05,
                color: this.get_random_color(),
                speed: this.height * 0.15,
                is_me: false,
            }));

        this.players.push(new Player(this, {
            x: this.width / 2,
            y: this.height / 2,
            radius: this.height * 0.05,
            color: 'white',
            speed: this.height * 0.15,
            is_me: true,
        }));
    }

    hide() {
        this.$playground.hide();
    }
}
