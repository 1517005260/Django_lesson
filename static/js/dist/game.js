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
            outer.root.playground.show();
        });
        this.$multi_mode.on('click', function () {
            console.log('click multi mode');
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

        if (this.is_me) {
            //canvas用图片填充图形
            this.img = new Image();
            this.img.src = this.root.root.settings.photo;
        }
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

            //修改绝对坐标为相对坐标
            const rect = outer.ctx.canvas.getBoundingClientRect();
            //现在rect有4个参数top,left,right,bottom,分别对应当前屏幕边界距离电脑屏幕边界的大小

            //1左键 2滚轮 3右键
            if (e.which === 1) //左键指定技能方向
            {
                if (outer.cur_skill === "fireball")
                    outer.shoot_fireball(e.clientX - rect.left, e.clientY - rect.top);  //e.clientX, e.clientY就是事件mousedown的位置
                outer.cur_skill = null;
            } else if (e.which === 2) {
                return false;  //禁用鼠标滚轮
            } else if (e.which === 3) {
                outer.move_to(e.clientX - rect.left, e.clientY - rect.top);
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
        if (this.is_me) {
            //渲染头像的canvas api
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            this.ctx.restore();
        } else {
            //人机画纯色圆
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }
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

        //接着把定义的元素都取出来
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

        this.start();
    }

    start() {
        this.getinfo();
        this.events();  //绑定监听函数
    }

    events() {
        this.events_login();
        this.events_register();
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
                console.log(resp);
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
                console.log(resp);
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$register_error_message.html(resp.result);
                }
            }
        });

    }

    sign_out() {
        if (this.platform === "ACAPP") return false;
        //acapp不用登出，用户直接叉掉网页即可

        $.ajax({
            url: "https://app6534.acapp.acwing.com.cn/settings/logout/",
            type: "GET",
            //登出不用传输数据
            success: function (resp) {
                console.log(resp);
                if (resp.result === "success") {
                    location.reload();
                    //刷新后getinfo检测到用户未登录，返回到登录界面
                }
            }
        });

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

    getinfo() {
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
                console.log(resp);
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
