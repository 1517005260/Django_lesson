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

    resize() {
        //每次视窗变化时都要渲染一下，防止地图出现颜色缓慢渐变
        this.ctx.canvas.width = this.root.width;
        this.ctx.canvas.height = this.root.height;
        //每次resize都要重新获取，否则地图大小上限就不会变了
        this.ctx.fillStyle = "rgba(0,0,0,1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    update() {
        this.render();
    }

    render() {
        this.ctx.fillStyle = "rgba(0,0,0,0.2)"
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}