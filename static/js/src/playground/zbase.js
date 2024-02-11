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

    show(mode) {
        let outer = this;
        this.$playground.show();
        this.game_map = new GameMap(this);
        this.resize();  //要在地图创建之后resize

        this.mode = mode;   //记得保存mode类型，用于后续player广播判断
        this.state = "waiting";  //状态 waiting->fighting->over
        this.notice_board = new NoticeBoard(this);
        this.player_count = 0; //初始下没有人

        this.players = [];  //添加玩家

        this.players.push(new Player(this, {
            x: this.width / 2 / this.scale,
            y: 0.5,
            radius: 0.05,
            color: 'white',
            speed: 0.15,
            character: "me",
            username: this.root.settings.username,
            photo: this.root.settings.photo
        }));
        //所以players[0]代表的是自己

        if (mode === "single mode") {
            for (let i = 0; i < 5; i++)
                this.players.push(new Player(this, {
                    x: this.width / 2 / this.scale,
                    y: 0.5,  //即this.height/2/this.scale , this.height = this.scale
                    radius: 0.05,
                    color: this.get_random_color(),
                    speed: 0.15,
                    character: "robot",
                    //机器人不要头像和名字
                }));
        } else if (mode === "multi mode") {
            this.mps = new MultiPlayerSocket(this);  //简称mps，类似ctx的作用
            this.mps.uuid = this.players[0].uuid;   //直接为mps新定义了一个uuid
            this.mps.ws.onopen = function () {   //当ws连接创建成功后激发回调函数
                outer.mps.send_create_player(
                    outer.root.settings.username,
                    outer.root.settings.photo
                );
            };
        }
    }

    hide() {
        this.$playground.hide();
    }
}
