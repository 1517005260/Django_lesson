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

        this.fireballs = [];

        if (this.character !== "robot") {
            //canvas用图片填充图形
            this.img = new Image();
            this.img.src = this.photo;
        }

        if (this.character === "me") {  //只需要给自己渲染技能图标和冷却
            this.fireball_coldtime = 2; //冷却时间2秒
            this.fireball_img = new Image();
            this.fireball_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";

            this.blink_coldtime = 0;  //初始可以闪现
            this.blink_img = new Image();
            this.blink_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";
        }
    }

    start() {
        this.root.player_count++;
        this.root.notice_board.write("已就绪：" + this.root.player_count + "人/3人");
        if (this.root.player_count >= 3) {
            this.root.state = "fighting";
            this.root.notice_board.write("Fighting!");
        }

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

        $(window).on("contextmenu", function () {  //发现更新完地图后如果点击地图外会弹出菜单影响游戏体验，遂全局禁用
            return false; //禁用本游戏界面中的右键，因为我们仿英雄联盟右键走路
        });

        this.root.game_map.$canvas.on("mousedown", function (e) {
            if (outer.root.state !== "fighting")
                return true;  //仅战斗阶段才可以操作
            //true就是不处理后续的事件，但是不禁用其他键。现在我们新增了聊天框，所以不能禁用所有键

            //修改绝对坐标为相对坐标
            const rect = outer.ctx.canvas.getBoundingClientRect();
            //现在rect有4个参数top,left,right,bottom,分别对应当前屏幕边界距离电脑屏幕边界的大小

            //1左键 2滚轮 3右键
            if (e.which === 1) //左键指定技能方向
            {
                let tx = (e.clientX - rect.left) / outer.root.scale;//e.clientX, e.clientY就是事件mousedown的位置
                let ty = (e.clientY - rect.top) / outer.root.scale
                if (outer.cur_skill === "fireball") {
                    if (outer.fireball_coldtime > 0)
                        return false;

                    let fireball = outer.shoot_fireball(tx, ty);
                    if (outer.root.mode === "multi mode")
                        outer.root.mps.send_shoot_fireball(tx, ty, fireball.uuid);
                } else if (outer.cur_skill === "blink") {
                    if (outer.blink_coldtime > 0)
                        return false;
                    outer.blink(tx, ty);

                    if (outer.root.mode === "multi mode")
                        outer.root.mps.send_blink(tx, ty);
                }

                outer.cur_skill = null;

            } else if (e.which === 2) {
                return false;  //禁用鼠标滚轮
            } else if (e.which === 3) {
                let tx = (e.clientX - rect.left) / outer.root.scale;
                let ty = (e.clientY - rect.top) / outer.root.scale;
                outer.move_to(tx, ty);

                if (outer.root.mode === "multi mode")
                    outer.root.mps.send_move_to(tx, ty);
            }
        });

        this.root.game_map.$canvas.on("keydown", function (e) {

            //在开始前也可聊天
            if (e.which === 13){
                //enter
                if (outer.root.mode === "multi mode"){
                    outer.root.chat_field.show_input();
                    return false;
                }
            }else if (e.which === 27){
                //esc
                if (outer.root.mode === "multi mode"){
                    outer.root.chat_field.hide_input();
                }
            }

            if (outer.root.state !== "fighting")
                return true;

            if (e.which === 81) {
                //即q键
                if (outer.fireball_coldtime > 0)
                    return true;
                outer.cur_skill = "fireball";
                return false; //禁用原Q键
            } else if (e.which === 70) {
                //即F键
                if (outer.blink_coldtime > 0)
                    return true;
                outer.cur_skill = "blink";
                return false;
            }
        });
    }

    shoot_fireball(target_x, target_y) {  //发射火球，传入终点坐标
        let sita = Math.atan2(target_y - this.y, target_x - this.x);  //发射角度
        let fireball = new FireBall(this.root, {
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
        this.fireball_coldtime = 2;  //重置冷却
        this.fireballs.push(fireball);
        return fireball; //需要获取这个火球的uuid
    }

    destroy_fireball(uuid) {
        for (let i = 0; i < this.fireballs.length; i++) {
            let fireball = this.fireballs[i];
            if (uuid === fireball.uuid) {
                fireball.destroy();
                break;
            }
        }
    }

    blink(tx, ty) {
        let d = this.get_dist(this.x, this.y, tx, ty);
        d = Math.min(d, 0.15);  //设置最大闪现上限
        let sita = Math.atan2(ty - this.y, tx - this.x);
        this.x += d * Math.cos(sita);
        this.y += d * Math.sin(sita);

        this.blink_coldtime = 12;
        this.move_length = 0;  //闪现后有僵直
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

    receive_attack(x, y, sita, damage, ball_uuid, attacker) {//强制受击判定
        attacker.destroy_fireball(ball_uuid);
        this.x = x;
        this.y = y;
        this.is_attacked(sita, damage);
    }

    update() {
        this.spent_time += this.timedelta / 1000;
        this.update_move();

        if (this.character === "me" && this.root.state === "fighting")
            this.update_coldtime();

        this.render();
    }

    update_coldtime() {
        this.fireball_coldtime = Math.max(0, this.fireball_coldtime - this.timedelta / 1000);
        this.blink_coldtime = Math.max(0, this.blink_coldtime - this.timedelta / 1000);
    }

    update_move() {
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

        if (this.character === "me" && this.root.state === "fighting")
            this.render_skill_coldtime();
    }

    render_skill_coldtime() {
        //宽最大16/9，长最大1
        let scale = this.root.scale;
        let x = 1.5, y = 0.9, r = 0.04;
        //ctx渲染技能图标
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();
        //ctx渲染技能提示
        let keyX = 1.5, keyY = 0.9 + 0.06;
        let fontsize = 12;
        this.ctx.font = `${fontsize}px Arial`; // 设置字体大小和类型
        this.ctx.fillStyle = "white"; // 设置字体颜色
        this.ctx.textAlign = "center";
        this.ctx.fillText("Q", keyX * scale, keyY * scale);
        //ctx渲染技能冷却的转圈
        if (this.fireball_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.fireball_coldtime / 2) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }

        // 闪现直接模仿火球写即可
        x = 1.62, y = 0.9, r = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();
        keyX = 1.62, keyY = 0.9 + 0.06;
        this.ctx.font = `${fontsize}px Arial`;
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText("F", keyX * scale, keyY * scale);
        if (this.blink_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.blink_coldtime / 12) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }
    }

    on_destroy() {
        if (this.characcter === "me")
            this.root.state = "over";

        for (let i = 0; i < this.root.players.length; i++) {
            if (this === this.root.players[i]) {
                this.root.players.splice(i, 1);
                break;
            }
        }
    }
}
