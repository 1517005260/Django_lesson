class GameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
        <div class="game-menu">
        <div class="game-menu-field">
            <div class="game-menu-field-item game-menu-field-item-single-mode">
                人机对战
            </div>
            <br>
            <div class="game-menu-field-item game-menu-field-item-multi-mode">
                多人对战
            </div>
            <br>
            <div class="game-menu-field-item game-menu-field-item-settings">
                退出
            </div>
        </div>
        </div>
        `);

        this.root.$game.append(this.$menu);
        this.$single_mode = this.$menu.find('.game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.game-menu-field-item-settings');
        this.$menu.hide();  //新逻辑：用户进入网站后先进入登录界面，成功后才是菜单

        this.start();
    }

    start() {
        this.events();
    }

    events() {
        let outer = this;

        this.$single_mode.on('click', function () {
            outer.hide();
            outer.root.playground.show("single mode");
        });
        this.$multi_mode.on('click', function () {
            outer.hide();
            outer.root.playground.show("multi mode");
        });
        this.$settings.on('click', function () {
            outer.root.settings.sign_out();
        });
    }

    hide() {    //关闭menu界面
        this.$menu.hide();
    }

    show() {    //打开menu界面
        this.$menu.show();
    }
}
let Game_Objects = [];   //全局数组存储所有的游戏对象

class GameObject {
    constructor() {
        Game_Objects.push(this);

        this.has_called_start = false;
        this.timedelta = 0;  //这一帧距离上一帧的时间
        this.uuid = this.create_uuid();
    }

    create_uuid() {
        let res = "";
        //生成随机8位数
        for (let i = 0; i < 8; i++) {
            let x = parseInt(Math.floor(Math.random() * 10)); //返回[0,10)
            res += x;
        }
        return res;
    }

    start() { }

    update() { }

    on_destroy() { }  //在这个对象被销毁前执行一次  目的：删干净

    destroy() {
        this.on_destroy();

        for (let i = 0; i < Game_Objects.length; i++) {
            if (Game_Objects[i] === this) {
                Game_Objects.splice(i, 1);
                break;
            }
        }
    }
}

let last_timestamp = 0;
let Game_Animation = function (now_timestamp) {
    for (let i = 0; i < Game_Objects.length; i++) {
        let obj = Game_Objects[i];
        if (!obj.has_called_start) {
            obj.has_called_start = true;
            obj.start();
        } else {
            obj.timedelta = now_timestamp - last_timestamp;
            obj.update();
        }
    }
    last_timestamp = now_timestamp;

    requestAnimationFrame(Game_Animation);
}

requestAnimationFrame(Game_Animation);class GameMap extends GameObject {
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
}class NoticeBoard extends GameObject {
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
}//实现粒子效果
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
        this.eps = 0.01;

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
        let scale = this.root.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}class Player extends GameObject {
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
            this.fireball_coldtime = 3; //冷却时间3秒
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
                return false;  //仅战斗阶段才可以操作

            //修改绝对坐标为相对坐标
            const rect = outer.ctx.canvas.getBoundingClientRect();
            //现在rect有4个参数top,left,right,bottom,分别对应当前屏幕边界距离电脑屏幕边界的大小

            //1左键 2滚轮 3右键
            if (e.which === 1) //左键指定技能方向
            {
                let tx = (e.clientX - rect.left) / outer.root.scale;//e.clientX, e.clientY就是事件mousedown的位置
                let ty = (e.clientY - rect.top) / outer.root.scale
                if (outer.cur_skill === "fireball") {
                    if (outer.fireball_coldtime > outer.eps)
                        return false;

                    let fireball = outer.shoot_fireball(tx, ty);
                    if (outer.root.mode === "multi mode")
                        outer.root.mps.send_shoot_fireball(tx, ty, fireball.uuid);
                } else if (outer.cur_skill === "blink") {
                    if (outer.blink_coldtime > outer.eps)
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

        $(window).on("keydown", function (e) {
            //对整个视窗的事件监听

            if (outer.root.state !== "fighting")
                return false;

            if (e.which === 81) {
                //即q键
                if (outer.fireball_coldtime > outer.eps)
                    return false;
                outer.cur_skill = "fireball";
                return false; //禁用原Q键
            } else if (e.which === 70) {
                //即F键
                if (outer.blink_coldtime > outer.eps)
                    return false;
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
        this.fireball_coldtime = 3;  //重置冷却
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
        //ctx渲染技能冷却的转圈
        if (this.fireball_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.fireball_coldtime / 3) - Math.PI / 2, true);
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
        if (this.blink_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.blink_coldtime / 10) - Math.PI / 2, true);
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

        this.update_move();
        if (this.player.character !== "enemy")  //其他窗口无权判断受击，碰撞判断决策权完全归于发出者
            this.update_attack();
        this.render();
    }

    update_move() {
        let move_dist = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * move_dist;
        this.y += this.vy * move_dist;
        this.move_length -= move_dist;
    }

    update_attack() {
        for (let i = 0; i < this.root.players.length; i++) {
            let player = this.root.players[i];
            if (this.player != player && this.is_collision(player))  //不能攻击自己&&火球和对方碰撞
            {
                this.attack(player);
                break;  //解决一个火球可以攻击好几个玩家的问题
            }
        }
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

    attack(player) {  //player受击
        let sita = Math.atan2(player.y - this.y, player.x - this.x);
        player.is_attacked(sita, this.damage);

        if (this.root.mode === "multi mode")
            this.root.mps.send_attack(player.uuid, player.x, player.y, sita, this.damage, this.uuid);

        this.destroy();
    }

    render() {
        let scale = this.root.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    on_destroy() {
        let fireballs = this.player.fireballs;
        for (let i = 0; i < fireballs.length; i++) {
            if (this === fireballs[i]) {
                fireballs.splice(i, 1);
                break;
            }
        }
    }
}class MultiPlayerSocket {
    constructor(root) {
        this.root = root;
        this.ws = new WebSocket("wss://app6534.acapp.acwing.com.cn/wss/multiplayer/");  //客户端和服务器端建立连接请求，名称和路由一致
        this.start();
    }

    get_player(uuid) {  //找到uuid为指定的player
        let players = this.root.players;
        for (let i = 0; i < players.length; i++) {
            let player = players[i];
            if (uuid === player.uuid)
                return player;
        }
        return null;
    }


    start() {
        this.receive();
    }

    receive() {
        //ws协议的双端连接函数
        let outer = this;

        this.ws.onmessage = function (e) {  //接收信息
            let data = JSON.parse(e.data);  //将字符串转换成json
            if (data.uuid === outer.uuid)
                return false; //不用再向自己广播信息

            if (data.event === "create_player") {
                outer.receive_create_player(data.uuid, data.username, data.photo);
            } else if (data.event === "move_to") {
                outer.receive_move_to(data.uuid, data.tx, data.ty);
            } else if (data.event === "shoot_fireball") {
                outer.receive_shoot_fireball(data.uuid, data.tx, data.ty, data.ball_uuid);
            } else if (data.event === "attack") {
                outer.receive_attack(data.uuid, data.attackee_uuid, data.x, data.y, data.sita, data.damage, data.ball_uuid)
            }else if (data.event === "blink"){
                outer.receive_blink(data.uuid, data.tx, data.ty);
            }
        };
    }

    send_create_player(username, photo) {
        let outer = this;
        this.ws.send(JSON.stringify({   //将json转换成字符串
            'event': "create_player",
            'uuid': outer.uuid, //在playground类中被定义
            'username': username,
            'photo': photo,
        }));
    }

    receive_create_player(uuid, username, photo) {
        let player = new Player(this.root, {
            x: this.root.width / 2 / this.root.scale,
            y: 0.5,
            radius: 0.05,
            color: 'white',
            speed: 0.15,
            character: "enemy",
            username: username,
            photo: photo,
        });
        player.uuid = uuid;
        this.root.players.push(player);
    }

    send_move_to(tx, ty) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "move_to",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_move_to(uuid, tx, ty) {
        let player = this.get_player(uuid);
        if (player) {
            //未死亡且未掉线
            player.move_to(tx, ty);
        }
    }

    send_shoot_fireball(tx, ty, ball_uuid) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "shoot_fireball",
            'uuid': outer.uuid,   //谁发射的
            'tx': tx,
            'ty': ty,
            'ball_uuid': ball_uuid,  //哪个火球
        }));
    }

    receive_shoot_fireball(uuid, tx, ty, ball_uuid) {
        let player = this.get_player(uuid);
        if (player) {
            let fireball = player.shoot_fireball(tx, ty);
            fireball.uuid = ball_uuid; //所有视窗中的ball_uuid应该统一
        }
    }

    send_attack(attackee_uuid, x, y, sita, damage, ball_uuid) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "attack",
            'uuid': outer.uuid,
            'attackee_uuid': attackee_uuid,
            'x': x,
            'y': y,
            'sita': sita,
            'damage': damage,
            'ball_uuid': ball_uuid,
        }));
    }

    receive_attack(uuid, attackee_uuid, x, y, sita, damage, ball_uuid) {
        let attacker = this.get_player(uuid);
        let attackee = this.get_player(attackee_uuid);
        if (attacker && attackee) {
            attackee.receive_attack(x, y, sita, damage, ball_uuid, attacker);
        }
    }

    send_blink(tx, ty){
        let outer = this;
        this.ws.send(JSON.stringfy({
            'event': "blink",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_blink(uuid, tx, ty){
        let player = this.get_player(uuid);
        if(player)
            player.blink(tx,ty);
    }
}
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
class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB"; //默认是网页端登录
        if (this.root.os)   //如果os不是默认空值，由于我们只有web和acapp两个端，所以我们要给platform赋值acapp
            this.platform = "ACAPP";

        this.username = ""; //存储用户信息
        this.photo = "";

        this.$settings = $(`
    <div class="game-settings">
        <div class="game-settings-login">
            <div class="game-settings-title">
                登录
            </div>
            <div class="game-settings-username">
                <div class="game-settings-item">
                    <input type="text" placeholder="用户名">
                </div>
            </div>
            <div class="game-settings-password">
                <div class="game-settings-item">
                    <input type="password" placeholder="密码">
                </div>
            </div>
            <div class="game-settings-submit">
                <div class="game-settings-item">
                    <button>登录</button>
                </div>
            </div>
            <div class="game-settings-error-message">
            </div>
            <div class="game-settings-option">
                注册
            </div>
            <br>
            <div class="game-settings-third-part">
                <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
                <br>
                <div>第三方一键登录</div>
            </div>
        </div>
        <div class="game-settings-register">
            <div class="game-settings-title">
                注册
            </div>
            <div class="game-settings-username">
                <div class="game-settings-item">
                    <input type="text" placeholder="用户名">
                </div>
            </div>
            <div class="game-settings-password-first">
                <div class="game-settings-item">
                    <input type="password" placeholder="密码">
                </div>
            </div>
            <div class="game-settings-password-second">
                <div class="game-settings-item">
                    <input type="password" placeholder="确认密码">
                </div>
            </div>
            <div class="game-settings-submit">
                <div class="game-settings-item">
                    <button>注册</button>
                </div>
            </div>
            <div class="game-settings-error-message">
            </div>
            <div class="game-settings-option">
                登录
            </div>
            <br>
            <div class="game-settings-third-part">
                <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
                <br>
                <div>第三方一键登录</div>
            </div>
        </div>
    </div>`);

        this.root.$game.append(this.$settings);

        //接着把定义的元素都取出来，用于交互操作
        //注意find之前的对象是父类
        this.$login = this.$settings.find(".game-settings-login");
        this.$login_username = this.$login.find(".game-settings-username input");
        this.$login_password = this.$login.find(".game-settings-password input");
        this.$login_submit = this.$login.find(".game-settings-submit button");
        this.$login_error_message = this.$login.find(".game-settings-error-message");
        this.$login_register = this.$login.find(".game-settings-option");
        this.$login.hide();  //先默认隐藏，等用户调用

        this.$register = this.$settings.find(".game-settings-register");
        this.$register_username = this.$register.find(".game-settings-username input");
        this.$register_password = this.$register.find(".game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".game-settings-password-second input");
        this.$register_submit = this.$register.find(".game-settings-submit button");
        this.$register_error_message = this.$register.find(".game-settings-error-message");
        this.$register_login = this.$register.find(".game-settings-option");
        this.$register.hide();

        this.$third_part_login = this.$settings.find(".game-settings-third-part img");

        this.start();
    }

    start() {
        if (this.platform === "ACAPP") {
            //acapp端
            this.getinfo_acapp();
        } else {
            this.getinfo_web();
            this.events();  //绑定监听函数
        }
    }

    events() {
        this.events_login();
        this.events_register();

        let outer = this;
        this.$third_part_login.on("click", function () {
            outer.third_part_login_web();
        });
    }

    events_login() {
        let outer = this;
        this.$login_register.on("click", function () {
            outer.register();  //点击后跳转注册页面
        });
        this.$login_submit.on("click", function () {
            outer.sign_in();  //点击后登录
        });
    }

    events_register() {
        let outer = this;
        this.$register_login.on("click", function () {
            outer.login();
        });
        this.$register_submit.on("click", function () {
            outer.new_register();
        });
    }

    third_part_login_web() {
        $.ajax({
            url: "https://app6534.acapp.acwing.com.cn/settings/acwing/web/apply_code/",
            type: "GET",
            success: function (resp) {
                if (resp.result === "success") {
                    window.location.replace(resp.apply_code_url);
                    //窗口刷新，并重定向到 apply_code_url
                }//acwing的第三方登录如果点击拒绝则会重定向到acwing首页
            }
        });
    }

    third_part_login_acapp(appid, redirect_uri, scope, state) {
        let outer = this;

        this.root.os.api.oauth2.authorize(appid, redirect_uri, scope, state, function (resp) {
            //手动实现callback
            if (resp.result === "success") {
                //同web操作
                outer.username = resp.username;
                outer.photo = resp.photo;
                outer.hide();
                outer.root.menu.show();
            }//acwing没有提供用户拒绝后的api，所以用户拒绝后会比较尴尬，直接卡住
        });
    }

    sign_in() {
        //登录函数
        let outer = this;
        let username = this.$login_username.val(); //获取用户输入
        let password = this.$login_password.val();
        this.$login_error_message.empty(); //清空之前的报错记录

        $.ajax({
            url: "https://app6534.acapp.acwing.com.cn/settings/login/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },
            success: function (resp) {
                if (resp.result === "success")
                    location.reload();
                //刷新界面。机制：登录成功后重新刷新页面，再次访问网站时，getinfo函数会判定用户已经登录，所以会转至菜单页
                else {
                    outer.$login_error_message.html(resp.result);
                    //获取result并以html格式赋值给前端元素
                }
            }
        });
    }

    new_register() {
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();
        this.$register_error_message.empty();

        $.ajax({
            url: "https://app6534.acapp.acwing.com.cn/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
            },
            success: function (resp) {
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$register_error_message.html(resp.result);
                }
            }
        });

    }

    sign_out() {
        if (this.platform === "ACAPP") {
            this.root.os.api.window.close();
        } else {
            $.ajax({
                url: "https://app6534.acapp.acwing.com.cn/settings/logout/",
                type: "GET",
                //登出不用传输数据
                success: function (resp) {
                    if (resp.result === "success") {
                        location.reload();
                        //刷新后getinfo检测到用户未登录，返回到登录界面
                    }
                }
            });
        }
    }

    register() {
        //打开注册页面
        this.$login.hide();
        this.$register.show();
    }

    login() {
        //打开登录界面
        this.$register.hide();
        this.$login.show();
    }

    getinfo_web() {
        //获取用户信息
        let outer = this;

        $.ajax({
            //jQuery库的ajax发送请求
            url: "https://app6534.acapp.acwing.com.cn/settings/getinfo/",   //请求地址
            type: "GET",   //请求方式
            data: {   //传输数据
                platform: outer.platform,
            },
            success: function (resp) {   //return函数，不要被success名字迷惑。   resp就是JsonResponse
                //request -> resp(onse)
                if (resp.result === "success") {  //登录成功
                    outer.username = resp.username;  //获取信息
                    outer.photo = resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                } else {   //未登录
                    outer.login();
                }
            }
        })
    }

    getinfo_acapp() {
        let outer = this;
        $.ajax({
            url: "https://app6534.acapp.acwing.com.cn/settings/acwing/acapp/apply_code/",
            type: "GET",
            success: function (resp) {
                if (resp.result === "success") {
                    //根据acwing的api传参即可
                    outer.third_part_login_acapp(resp.appid, resp.redirect_uri, resp.scope, resp.state);
                }
            }
        });
    }

    hide() {
        this.$settings.hide();
    }

    show() {
        this.$settings.show();
    }

}// 本文件是总文件，用于调用其他文件中的类。由于js在调用之前必须先定义，且我们之前写好了按字典序排序所有js文件的函数，所以zbase会排在后面，即先定义再调用减少报错。

//由于最后都打包到一个文件里，所以各个类的相互调用不需要export
//但是整个文件需要一个export，所以在主类Game需要export

//在html文件中写了：let game = new Game();  就会调用到这里
export class Game {
    constructor(id, os) {  //你在哪个系统登录，os就自动传什么。WEB端默认没有os参数
        this.id = id;
        this.$game = $('#' + id);
        this.os = os;  //识别是哪个前端
        this.settings = new Settings(this);
        this.menu = new GameMenu(this);
        this.playground = new GamePlayground(this);

        this.start();
    }

    start() {

    };

}
