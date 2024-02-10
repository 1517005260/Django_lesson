class MultiPlayerSocket {
    constructor(root) {
        this.root = root;
        this.ws = new WebSocket("wss://app6534.acapp.acwing.com.cn/wss/multiplayer/");  //客户端和服务器端建立连接请求，名称和路由一致
        this.start();
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
}