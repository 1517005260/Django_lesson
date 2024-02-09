class GamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`
        <div class="game-playground"><div>
        `);
        this.root.$game.append(this.$playground);
        this.width = this.$playground.width();
        this.height = this.$playground.height();

        this.hide();   //一开始我们在菜单界面，所以要隐藏playground界面

        this.start();
    }

    get_random_color() {
        let colors = ['blue', 'pink', 'red', 'grey', 'green', 'yellow', 'purple',];
        return colors[Math.floor(Math.random() * colors.length)];
    }


    start() {
        //每次修改窗口大小时都要修改resize函数
        let outer = this;
        $(window).resize(function () {
            outer.resize();
        });
    }

    resize() {
        //动态调整地图的函数
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        //每次resize都要重新获取，否则地图大小上限就不会变了
        let unit = Math.min(this.width / 16, this.height / 9);
        this.width = unit * 16;
        this.height = unit * 9;
        //16:9
        this.scale = this.height; //相对变化基准单位
        //虽然这里scale被定义在方法里，但是本实例可以作为root访问到scale

        if (this.game_map)
            this.game_map.resize();
    }

    show() {
        this.$playground.show();

        this.resize();  //随视窗要变化

        this.game_map = new GameMap(this);

        this.players = [];  //添加5个机器人和自己
        for (let i = 0; i < 5; i++)
            this.players.push(new Player(this, {
                x: this.width / 2 / this.scale,
                y: 0.5,  //即this.height/2/this.scale , this.height = this.scale
                radius: 0.05,
                color: this.get_random_color(),
                speed: 0.15,
                is_me: false,
            }));

        this.players.push(new Player(this, {
            x: this.width / 2 / this.scale,
            y: 0.5,
            radius: 0.05,
            color: 'white',
            speed: 0.15,
            is_me: true,
        }));
    }

    hide() {
        this.$playground.hide();
    }
}
