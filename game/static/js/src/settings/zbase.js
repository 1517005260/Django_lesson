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

        this.$third_part_login = this.$settings.find(".game-settings-third-part img");

        this.start();
    }

    start() {
        this.getinfo();
        this.events();  //绑定监听函数
    }

    events() {
        this.events_login();
        this.events_register();

        let outer = this;
        this.$third_part_login.on("click", function () {
            outer.third_part_login();
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

    third_part_login() {
        $.ajax({
            url: "https://app6534.acapp.acwing.com.cn/settings/acwing/web/apply_code/",
            type: "GET",
            success: function (resp) {
                console.log(resp);
                if (resp.result === "success") {
                    window.location.replace(resp.apply_code_url);
                    //窗口刷新，并重定向到 apply_code_url
                }
            }
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

}