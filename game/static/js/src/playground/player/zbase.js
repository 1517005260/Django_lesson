class Player extends GameObject {
    constructor(root, info) {
        super();
        this.root = root;
        this.ctx = this.root.game_map.ctx;

        this.x = info.x;  //x，y坐标
        this.y = info.y;
        this.vx = 0;  //vx,vy是向x,y的方向，大小[0,1]
        this.vy = 0;
        this.speed = info.speed; //速度，速度乘以上面的方向就是分速度
        this.radius = info.radius;
        this.color = info.color;
        this.character = info.character;  //判定当前玩家身份
        this.username = info.username;
        this.photo = info.photo;
        this.move_length = 0;  //移动向量的长度

        this.eps = 0.01;  //浮点数小于这个值判0;

        this.cur_skill = null;  //当前选中的技能
        this.spent_time = 0;  //当前角色进入游戏后经过的时间
        this.f = 0.9;   //摩擦系数

        this.damage_vx = 0;  //受击后移动的方向
        this.damage_vy = 0;
        this.damage_speed = 0;

        this.status = "live";

        if (this.character !== "robot") {
            //canvas用图片填充图形
            this.img = new Image();
            this.img.src = this.photo;
        }
    }

    start() {
        if (this.character === "me") {
            //自己的操作逻辑由自己定
            //别人的操作逻辑是通过后端发送出来的
            //ai的操作逻辑由我们的代码决定
            this.events();
        } else if (this.character === "robot") {
            //实现ai的随机走动
            //Math.random() 属于 [0,1)
            let target_x = Math.random() * this.root.width / this.root.scale;
            let target_y = Math.random() * this.root.height / this.root.scale;
            this.move_to(target_x, target_y);
        }
    }

    events() {
        let outer = this;

        this.root.game_map.$canvas.on("contextmenu", function () {
            return false; //禁用本游戏界面中的右键，因为我们仿英雄联盟右键走路
        });

        this.root.game_map.$canvas.on("mousedown", function (e) {

            //修改绝对坐标为相对坐标
            const rect = outer.ctx.canvas.getBoundingClientRect();
            //现在rect有4个参数top,left,right,bottom,分别对应当前屏幕边界距离电脑屏幕边界的大小

            //1左键 2滚轮 3右键
            if (e.which === 1) //左键指定技能方向
            {
                if (outer.cur_skill === "fireball")
                    outer.shoot_fireball((e.clientX - rect.left) / outer.root.scale, (e.clientY - rect.top) / outer.root.scale);  //e.clientX, e.clientY就是事件mousedown的位置
                outer.cur_skill = null;
            } else if (e.which === 2) {
                return false;  //禁用鼠标滚轮
            } else if (e.which === 3) {
                let tx = (e.clientX - rect.left) / outer.root.scale;
                let ty = (e.clientY - rect.top) / outer.root.scale;
                outer.move_to(tx, ty);

                if(outer.root.mode==="multi mode")
                    outer.root.mps.send_move_to(tx,ty);
            }
        });

        $(window).on("keydown", function (e) {
            //对整个视窗的事件监听
            if (e.which === 81) {
                //即q键
                outer.cur_skill = "fireball";
                return false; //禁用原Q键
            }
        });
    }

    shoot_fireball(target_x, target_y) {  //发射火球，传入终点坐标
        if (this.status === "die") return false;
        let sita = Math.atan2(target_y - this.y, target_x - this.x);  //发射角度
        new FireBall(this.root, {
            player: this,
            x: this.x,
            y: this.y,
            radius: 0.01,  //火球半径
            vx: Math.cos(sita),
            vy: Math.sin(sita),
            color: 'orange',   //火球是橙色的
            speed: 0.5,
            move_length: 1, //射程
            damage: 0.01,   //血量表现为球的大小，受击后减去damage半径
        });
    }

    get_dist(x1, y1, x2, y2) {
        //欧几里得距离
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(target_x, target_y) {
        this.move_length = this.get_dist(this.x, this.y, target_x, target_y);
        let sita = Math.atan2(target_y - this.y, target_x - this.x);
        this.vx = Math.cos(sita);
        this.vy = Math.sin(sita);
    }

    is_attacked(sita, damage) {
        //受击粒子效果
        for (let i = 0; i < Math.random() * 10 + 20; i++) {
            let alpha = Math.PI * 2 * Math.random(); //粒子射出的随机角度
            new Particle(this.root, {
                x: this.x,
                y: this.y,
                radius: this.radius * 0.1 * Math.random(),  //粒子半径
                vx: Math.cos(alpha),
                vy: Math.sin(alpha),
                color: this.color,
                speed: this.speed * 10,
                move_length: this.radius * 5 * Math.random(),
            });
        }

        this.radius -= damage;

        //死亡判定
        if (this.radius < this.eps) {
            this.destroy();
            return false;
        }

        //受击后的作用力
        this.damage_vx = Math.cos(sita);
        this.damage_vy = Math.sin(sita);
        this.damage_speed = damage * 100;
        //受击后体积减小，速度变快
        this.speed *= 1.5;
    }

    update() {
        this.update_move();
        this.render();
    }

    update_move() {
        this.spent_time += this.timedelta / 1000;
        //加入人机对战时前4秒ai不会攻击的机制
        //加入人机对战时ai每3秒放一次技能的机制
        if (this.character === "robot" && this.spent_time > 4 && Math.random() < 1 / 120.0) {
            //随机取出一名玩家
            let player = this.root.players[Math.floor(Math.random() * this.root.players.length)];
            //并加入预判机制
            let target_x = player.x + player.speed * player.vx * player.timedelta / 1000 * 0.3;
            let target_y = player.y + player.speed * player.vy * player.timedelta / 1000 * 0.3;
            this.shoot_fireball(target_x, target_y);
        }

        //受击后的作用力
        if (this.damage_speed > this.eps) {
            this.vx = this.vy = 0;
            this.move_length = 0;
            this.x += this.damage_vx * this.damage_speed * this.timedelta / 1000;
            this.y += this.damage_vy * this.damage_speed * this.timedelta / 1000;
            this.damage_speed *= this.f;
        } else {  //受击力逐渐衰减为0后
            if (this.move_length < this.eps) {
                this.move_length = 0;
                this.vx = this.vy = 0;
                if (this.character === "robot") {
                    let target_x = Math.random() * this.root.width / this.root.scale;
                    let target_y = Math.random() * this.root.height / this.root.scale;
                    this.move_to(target_x, target_y);
                }
            } else {
                //正常的移动
                let move_dist = Math.min(this.move_length, this.speed * this.timedelta / 1000);
                //限制每帧的移动距离小于起始位置到终点位置的向量长度
                this.x += this.vx * move_dist;
                this.y += this.vy * move_dist;
                this.move_length -= move_dist;
            }
        }

    }

    render() {
        let scale = this.root.scale;
        if (this.character !== "robot") {
            //渲染头像的canvas api
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        } else {
            //人机画纯色圆
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }
    }

    on_destroy() {
        for (let i = 0; i < this.root.players.length; i++) {
            if (this === this.root.players[i]) {
                this.status = "die";
                this.root.players.splice(i, 1);
                break;
            }
        }
    }
}