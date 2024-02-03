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
                设置
            </div>
        </div>
        </div>
        `);

        this.root.$game.append(this.$menu);
        this.$single_mode = this.$menu.find('.game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.game-menu-field-item-settings');

        this.start();
    }

    start(){
        this.events();
    }

    events() {
        let outer = this;

        this.$single_mode.on('click', function () {
            outer.hide();
            outer.root.playground.show();
        });
        this.$multi_mode.on('click', function () {
            console.log('click multi mode');
        });
        this.$settings.on('click', function () {
            console.log('click settings');
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
    }

    start() { }

    update() { }

    on_destroy() { }  //在这个对象被销毁前执行一次

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

    update() {
        this.render();
    }

    render() {
        this.ctx.fillStyle = "rgba(0,0,0,0.2)"
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
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
        this.is_me = info.is_me;  //判定当前玩家是不是自己
        this.move_length = 0;  //移动向量的长度

        this.eps = 0.1;  //浮点数小于这个值判0;

        this.cur_skill = null;  //当前选中的技能
        this.spent_time = 0;  //当前角色进入游戏后经过的时间
        this.f = 0.9;   //摩擦系数

        this.damage_vx = 0;  //受击后移动的方向
        this.damage_vy = 0;
        this.damage_speed = 0;
    }

    start() {
        if (this.is_me) {
            //自己的操作逻辑由自己定
            //别人的操作逻辑是通过后端发送出来的
            //ai的操作逻辑由我们的代码决定
            this.events();
        } else {
            //实现ai的随机走动
            //Math.random() 属于 [0,1]
            let target_x = Math.random() * this.root.width;
            let target_y = Math.random() * this.root.height;
            this.move_to(target_x, target_y);
        }
    }

    events() {
        let outer = this;

        this.root.game_map.$canvas.on("contextmenu", function () {
            return false; //禁用本游戏界面中的右键，因为我们仿英雄联盟右键走路
        });

        this.root.game_map.$canvas.on("mousedown", function (e) {
            //1左键 2滚轮 3右键
            if (e.which === 1) //左键指定技能方向
            {
                if (outer.cur_skill === "fireball")
                    outer.shoot_fireball(e.clientX, e.clientY);  //e.clientX, e.clientY就是事件mousedown的位置
                outer.cur_skill = null;
            } else if (e.which === 2) {
                return false;  //禁用鼠标滚轮
            } else if (e.which === 3) {
                outer.move_to(e.clientX, e.clientY);
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
        let sita = Math.atan2(target_y - this.y, target_x - this.x);  //发射角度
        new FireBall(this.root, {
            player: this,
            x: this.x,
            y: this.y,
            radius: this.root.height * 0.01,  //火球半径
            vx: Math.cos(sita),
            vy: Math.sin(sita),
            color: 'orange',   //火球是橙色的
            speed: this.root.height * 0.5,
            move_length: this.root.height * 1, //射程
            damage: this.root.height * 0.01,   //血量表现为球的大小，受击后减去damage半径
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
        if (this.radius < 10) {
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
        this.spent_time += this.timedelta / 1000;
        //加入人机对战时前4秒ai不会攻击的机制
        //加入人机对战时ai每3秒放一次技能的机制
        if (!this.is_me && this.spent_time > 4 && Math.random() < 1 / 180.0) {
            //随机取出一名玩家
            let player = this.root.players[Math.floor(Math.random() * this.root.players.length)];
            //并加入预判机制
            let target_x = player.x + player.speed * player.vx * player.timedelta / 1000 * 0.3;
            let target_y = player.y + player.speed * player.vy * player.timedelta / 1000 * 0.3;
            this.shoot_fireball(target_x, target_y);
        }

        //受击后的作用力
        if (this.damage_speed > 10) {
            this.vx = this.vy = 0;
            this.move_length = 0;
            this.x += this.damage_vx * this.damage_speed * this.timedelta / 1000;
            this.y += this.damage_vy * this.damage_speed * this.timedelta / 1000;
            this.damage_speed *= this.f;
        } else {  //受击力逐渐衰减为0后
            if (this.move_length < this.eps) {
                this.move_length = 0;
                this.vx = this.vy = 0;
                if (!this.is_me) {
                    let target_x = Math.random() * this.root.width;
                    let target_y = Math.random() * this.root.height;
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

        this.render();
    }

    render() {
        //画圆
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    on_destroy() {
        for (let i = 0; i < this.root.players.length; i++) {
            if (this === this.root.players[i]) {
                this.root.players.splice(i, 1);
                break;
            }
        }
    }
}//火球
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

        this.eps = 0.1;

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
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}class GamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`
        <div class="game-playground"><div>
        `);

        this.hide();   //一开始我们在菜单界面，所以要隐藏playground界面

        this.root.$game.append(this.$playground);
        this.width = this.$playground.width();
        this.height = this.$playground.height();

        this.game_map = new GameMap(this);

        this.players = [];  //添加5个机器人和自己
        for (let i = 0; i < 5; i++)
            this.players.push(new Player(this, {
                x: this.width / 2,
                y: this.height / 2,
                radius: this.height * 0.05,
                color: this.get_random_color(),
                speed: this.height * 0.15,
                is_me: false,
            }));

        this.players.push(new Player(this, {
            x: this.width / 2,
            y: this.height / 2,
            radius: this.height * 0.05,
            color: 'white',
            speed: this.height * 0.15,
            is_me: true,
        }));


        this.start();
    }

    get_random_color() {
        let colors = ['blue', 'pink', 'red', 'grey', 'green', 'yellow', 'purple',];
        return colors[Math.floor(Math.random() * colors.length)];
    }


    start() {

    }

    show() {
        this.$playground.show();
    }

    hide() {
        this.$playground.hide();
    }
}
// 本文件是总文件，用于调用其他文件中的类。由于js在调用之前必须先定义，且我们之前写好了按字典序排序所有js文件的函数，所以zbase会排在后面，即先定义再调用减少报错。

//由于最后都打包到一个文件里，所以各个类的相互调用不需要export
//但是整个文件需要一个export，所以在主类Game需要export

//在html文件中写了：let game = new Game();  就会调用到这里
export class Game {
    constructor(id) {
        this.id = id;
        this.$game = $('#' + id);
        this.menu = new GameMenu(this);
        this.playground = new GamePlayground(this);

        this.start();
    }

    start() {

    };

}
