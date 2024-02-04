class GameMap extends GameObject {
    constructor(root) {  //传入playground类
        super();
        this.root = root;
        this.$canvas = $(`<canvas></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.root.width;
        this.ctx.canvas.height = this.root.height;
        this.root.$playground.append(this.$canvas);
    }
    start() { }

    update() {
        this.render();
    }

    render() {
        this.ctx.fillStyle = "rgba(0,0,0,0.2)"
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}