class MultiPlayerSocket {
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
}