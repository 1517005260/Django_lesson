//火球
class FireBall extends GameObject {
    constructor(root, info) {
        super();

        this.root = root;
        this.player = info.player;
        this.ctx = this.root.game_map.ctx;
        this.x = info.x;
        this.y = info.y;
        this.vx = info.vx;
        this.vy = info.vy;
        this.radius = info.radius;
        this.color = info.color;
        this.speed = info.speed;
        this.move_length = info.move_length;
        this.damage = info.damage;

        this.eps = 0.01;

        this.start();
    }

    start() { }

    update() {
        if (this.move_length < this.eps) {
            this.destroy();
            return false;
        }

        let move_dist = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * move_dist;
        this.y += this.vy * move_dist;
        this.move_length -= move_dist;

        for (let i = 0; i < this.root.players.length; i++) {
            let player = this.root.players[i];
            if (this.player != player && this.is_collision(player))  //不能攻击自己&&火球和对方碰撞
                this.attack(player);
        }

        this.render();
    }

    get_dist(x1, y1, x2, y2) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    is_collision(player) {
        let dist = this.get_dist(this.x, this.y, player.x, player.y);
        return dist < this.radius + player.radius;
    }

    attack(player) {
        let sita = Math.atan2(player.y - this.y, player.x - this.x);
        player.is_attacked(sita, this.damage);
        this.destroy();
    }

    render() {
        let scale = this.root.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}