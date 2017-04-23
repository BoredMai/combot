class Combatant {
    user: User;
    name: string;
    dex: number;
    initMod: number;
    init = null;

    constructor(user, name, dex, init = null) {
        this.user = user;
        this.name = name;
        this.dex = parseInt(dex);
        this.initMod = init ? parseInt(init) : Math.floor((this.dex - 10) / 2);

    }

    rollInitiative() {
        let roll = Math.ceil(Math.random() * 20);
        this.init = { roll: roll, total: roll + this.initMod };
    }
}