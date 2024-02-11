class NoticeBoard extends GameObject {
    constructor(root) {
        super();
        this.root = root;
        this.ctx = this.root.game_map.ctx;
        this.text = "已就绪：0人";
    }
    start() {
    }

    write(text) {
        this.text = text;
    }

    update() {
        this.render();
    }

    render() {
        //canvas渲染文字api
        this.ctx.font = "20px serif";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.text, this.root.width / 2, 20);    //居中，高度距离上边界20px
    }
}