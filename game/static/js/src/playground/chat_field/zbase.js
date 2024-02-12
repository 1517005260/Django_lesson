//聊天部分我们不用canvas画布，只是一个html元素，也不用继承gameobject

class ChatField {
    constructor(root) {
        this.root = root;
        this.$history = $(`<div class="game-chat-field-history">历史记录</div>`);
        this.$input = $(`<input type="text" class="game-chat-field-input" placeholder="Enter键入信息/Esc关闭">`);

        this.$history.hide();

        this.func_id = null; //防止历史记录过快消失

        this.root.$playground.append(this.$history);
        this.root.$playground.append(this.$input);

        this.start();
    }

    start(){
        this.events();
    }

    events(){
        let outer = this;
        this.$input.on("keydown",function(e){
            if (e.which === 27){
                outer.hide_input();
                return false;
            }else if (e.which === 13){
                let username = outer.root.root.settings.username;
                let text = outer.$input.val();
                if(text){
                    outer.$input.val("");   //每次输入完后清空聊天框
                    outer.add_message(username, text);
                    outer.root.mps.send_message(username, text);
                }
                return false;
            }
        });
    }

    add_message(username, text){
        this.show_history();
        let message = `@${username}: ${text}`;
        this.$history.append(this.html_message(message));
        this.$history.scrollTop(this.$history[0].scrollHeight);  //每次发消息后追踪到最新消息
    }

    html_message(message){
        return $(`<div>${message}</div>`);
    }

    show_history(){
        let outer = this;
        this.$history.fadeIn();  //淡入

        if(this.func_id)
            clearTimeout(this.func_id);  //清空上个历史记录的显示计时

        this.func_id = setTimeout(function(){   //即过3s后执行function
            outer.$history.fadeOut();
            outer.func_id = null;   //只要关闭了就不用再记id了
        },3000);
    }

    show_input(){
        this.show_history();
        this.$input.show();
        this.$input.focus();   //聚焦到输入框上输入
    }

    hide_input(){
        this.$input.hide();
        this.root.game_map.$canvas.focus();  //重新让地图获取聚焦权
    }
}
