class ScoreBoard extends GameObject {
    constructor(root) {
        super();

        this.root = root;
        this.ctx = this.root.game_map.ctx;

        this.state = null;  //胜负状态

        this.win_img = new Image();
        this.win_img.src = "https://cdn.acwing.com/media/article/image/2021/12/17/1_8f58341a5e-win.png";

        this.lose_img = new Image();
        this.lose_img.src = "https://app6534.acapp.acwing.com.cn/static/image/game/lose.png";
    }

    start() {

    }

    events() {
        let outer = this;
        if (!this.root.game_map)
            return
        this.root.game_map.$canvas.on("click", function () {
            outer.root.hide();
            outer.root.root.menu.show();
        });
    }

    win() {
        this.state = "win";
        let outer = this;
        setTimeout(function () {   //结算动画持续1s
            outer.events();
        }, 1000);
    }

    lose() {
        this.state = "lose";
        let outer = this;
        setTimeout(function () {
            outer.events();
        }, 1000);
    }

    late_update() {
        //渲染在所有对象的最上面
        this.render();
    }

    render() {
        let len = this.root.height / 2;  //渲染图片的边长
        if (this.state === "win") {  //让图片的中心与屏幕中心重合，所以左上角为屏幕宽度/2 减去图片边长的一半
            this.ctx.drawImage(this.win_img, this.root.width / 2 - len / 2, this.root.height / 2 - len / 2, len, len);
        } else if (this.state === "lose") {
            this.ctx.drawImage(this.lose_img, this.root.width / 2 - len / 2, this.root.height / 2 - len / 2, len, len);
        }
    }
}
