//实现粒子效果
class Particle extends GameObject {
    constructor(root, info) {
        super();
        this.root = root;
        this.ctx = this.root.game_map.ctx;

        this.x = info.x;
        this.y = info.y;
        this.radius = info.radius;
        this.vx = info.vx;
        this.vy = info.vy;
        this.color = info.color;
        this.speed = info.speed;
        this.move_length = info.move_length;

        this.f = 0.9;
        this.eps = 1;

        this.start();
    }

    start() { }

    update() {
        if (this.move_length < this.eps || this.speed < this.eps) {
            this.destroy();
            return false;
        }

        let move_dist = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * move_dist;
        this.y += this.vy * move_dist;
        this.speed *= this.f;
        this.move_length -= move_dist;
        this.render();
    }

    render() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}