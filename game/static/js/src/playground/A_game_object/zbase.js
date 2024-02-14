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

    late_update() {
        //每一帧执行一次，且在所有的update执行完后再执行
    }

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

    for (let i = 0; i < Game_Objects.length; i++) {
        let obj = Game_Objects[i];
        obj.late_update();
    }

    last_timestamp = now_timestamp;

    requestAnimationFrame(Game_Animation);
}

requestAnimationFrame(Game_Animation);
