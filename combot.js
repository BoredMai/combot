/*
  An initiative tracker
*/
var Discord = require('discord.js');
var token = require('./token.js');
var combot = new Discord.Client();
var version = '1.0.0';
combot.login(token);
combot.on('ready', function () {
    Combat.setup();
    console.log('ComBot ' + version + ' ready for battle');
});
combot.on('message', function (message) {
    if (message.author.id !== combot.user.id) {
        if (message.content.indexOf('!combot') === 0)
            Combat.handle(message);
    }
});
var Combatant = (function () {
    function Combatant(user, name, dex, init) {
        if (init === void 0) { init = null; }
        this.init = null;
        this.user = user;
        this.name = name;
        this.dex = parseInt(dex);
        this.initMod = init ? parseInt(init) : Math.floor((this.dex - 10) / 2);
    }
    Combatant.prototype.rollInitiative = function () {
        var roll = Math.ceil(Math.random() * 20);
        this.init = { roll: roll, total: roll + this.initMod };
    };
    return Combatant;
}());
///<reference path="../main.ts" />
var Combat;
(function (Combat) {
    var ongoing = false;
    var hasStarted = false;
    var channel = null;
    var dmList = new Array();
    var currentCombatant = null;
    var combatantList = new Array();
    var initList = new Array();
    var delayList = new Array();
    var fMap = new Map();
    function setup() {
        fMap.set('new', newCombat);
        fMap.set('enter', enterCombat);
        fMap.set('start', startCombat);
        fMap.set('init', listInit);
        fMap.set('end', endTurn);
        fMap.set('delay', delayTurn);
        fMap.set('act', actTurn);
        fMap.set('finish', finishCombat);
        fMap.set('ongoing', isOngoing);
        fMap.set('list', listCombatants);
        fMap.set('help', help);
        fMap.set('info', info);
    }
    Combat.setup = setup;
    function handle(message) {
        var command = message.content.split(' ').slice(1);
        var f = fMap.get(command[0].toLowerCase());
        if (f)
            f(message, command.slice(1));
        else
            message.channel.sendMessage(message.content + ' - command failed');
    }
    Combat.handle = handle;
    function newCombat(message, command) {
        if (ongoing) {
            message.channel.sendMessage('There is already an ongoing combat.');
        }
        else {
            if (message.channel.type === 'text') {
                dmList.push(message.author);
                channel = message.channel;
                ongoing = true;
                hasStarted = false;
                message.channel.sendMessage(message.author + ' has started a new combat on channel ' + channel + '!');
            }
            else {
                message.channel.sendMessage('You cannot start a combat via DM.');
            }
        }
    }
    function enterCombat(message, command) {
        if ((ongoing) && (!hasStarted)) {
            if (command.length < 2) {
                message.channel.sendMessage('[ERROR] Not enough parameters.');
                return;
            }
            var silent = false;
            for (var c in command) {
                if ((command[c].toLowerCase() === '-s') || (command[c].toLowerCase() === '-silent')) {
                    silent = true;
                    command.splice(c, 1);
                    break;
                }
            }
            if (isNaN(parseInt(command[1]))) {
                message.channel.sendMessage('[ERROR] Invalid parameter dexvalue "' + command[1] + '"');
                return;
            }
            if ((command[2]) && (isNaN(parseInt(command[2])))) {
                message.channel.sendMessage('[ERROR] Invalid parameter initmod "' + command[2] + '"');
                return;
            }
            var combatant = new Combatant(message.author, command[0], command[1], command[2]);
            combatantList.push(combatant);
            if ((silent) && (dmList.indexOf(message.author !== -1))) {
                message.author.dmChannel.sendMessage(command[0] + ' has entered the fray!');
            }
            else {
                channel.sendMessage(command[0] + ' has entered the fray!');
            }
        }
        else {
            if (!ongoing)
                message.channel.sendMessage('There is no ongoing combat.');
            else
                message.channel.sendMessage('Combat has already started. You cannot join.');
        }
    }
    function startCombat(message, command) {
        if (!hasStarted) {
            hasStarted = true;
            initList = new Array();
            for (var _i = 0, combatantList_1 = combatantList; _i < combatantList_1.length; _i++) {
                var c = combatantList_1[_i];
                c.rollInitiative();
                var i = initList.length - 1;
                while ((i > -1) && ((initList[i].init.total < c.init.total) || ((initList[i].init.total === c.init.total) && (initList[i].dex < c.dex)))) {
                    i--;
                }
                initList.splice(i + 1, 0, c);
            }
            channel.sendMessage('Combat has begun!\n');
            listInit(message, command);
            startTurn();
        }
        else {
            message.channel.sendMessage('Combat has already started.');
        }
    }
    function listInit(message, command) {
        if (hasStarted) {
            var msg = 'Round Order:\n';
            if (currentCombatant) {
                msg += currentCombatant.name + ' (' + currentCombatant.init.roll + '+' + currentCombatant.initMod + ' = ' + currentCombatant.init.total + ')\n';
            }
            for (var _i = 0, initList_1 = initList; _i < initList_1.length; _i++) {
                var c = initList_1[_i];
                msg += c.name + ' (' + c.init.roll + '+' + c.initMod + ' = ' + c.init.total + ')\n';
            }
            if (delayList.length > 0) {
                msg += 'Delayed: ';
                for (var _a = 0, delayList_1 = delayList; _a < delayList_1.length; _a++) {
                    var c = delayList_1[_a];
                    msg += c.name;
                    msg += delayList.indexOf(c) < delayList.length - 1 ? ',' : '';
                }
            }
            channel.sendMessage(msg);
        }
        else {
            message.channel.sendMessage('Combat has not started yet.');
        }
    }
    function startTurn(keyword) {
        if (keyword === void 0) { keyword = 'ended'; }
        var msg = '';
        if (currentCombatant) {
            if (initList.indexOf(currentCombatant) === -1) {
                initList.push(currentCombatant);
            }
            msg += currentCombatant.name + ' has ' + keyword + ' their turn.\n';
        }
        currentCombatant = initList.shift();
        if (delayList.indexOf(currentCombatant) !== -1) {
            delayList.splice(delayList.indexOf(currentCombatant), 1);
        }
        msg += currentCombatant.user + ' ' + currentCombatant.name + '\'s turn!';
        channel.sendMessage(msg);
    }
    function endTurn(message, command) {
        if (hasStarted) {
            if ((message.author === currentCombatant.user) || (dmList.indexOf(message.user) !== -1)) {
                startTurn();
            }
            else {
                message.channel.sendMessage('You cannot end someone else\'s turn.');
            }
        }
        else {
            message.channel.sendMessage('Combat has not started yet.');
        }
    }
    function delayTurn(message, command) {
        if (hasStarted) {
            if ((message.author === currentCombatant.user) || (dmList.indexOf(message.user) !== -1)) {
                delayList.push(currentCombatant);
                startTurn('delayed');
            }
            else {
                message.channel.sendMessage('You cannot delay someone else\'s turn.');
            }
        }
        else {
            message.channel.sendMessage('Combat has not started yet.');
        }
    }
    function actTurn(message, command) {
        if (hasStarted) {
            var combatant = null;
            for (var _i = 0, delayList_2 = delayList; _i < delayList_2.length; _i++) {
                var c = delayList_2[_i];
                if (c.user === message.author) {
                    combatant = c;
                    break;
                }
            }
            if (combatant) {
                initList.splice(0, 0, currentCombatant);
                initList.splice(0, 0, combatant);
                delayList.splice(delayList.indexOf(combatant), 1);
                currentCombatant = null;
                channel.sendMessage(combatant.name + ' is acting their delayed turn.');
                startTurn();
            }
            else {
                message.channel.sendMessage('You don\'t have a delayed turn.');
            }
        }
        else {
            message.channel.sendMessage('Combat has not started yet.');
        }
    }
    function finishCombat(message, command) {
        if (ongoing) {
            if (dmList.indexOf(message.author) !== -1) {
                if ((message.channel.type === 'dm') || (message.channel === channel)) {
                    ongoing = false;
                    currentCombatant = null;
                    dmList = new Array();
                    combatantList = new Array();
                    initList = new Array();
                    delayList = new Array();
                    channel.sendMessage(message.author + ' has ended the combat!');
                }
                else {
                    message.channel.sendMessage('You cannot finish the current combat from this channel. Use either ' + channel + ' or PM.');
                }
            }
            else {
                message.channel.sendMessage('You do not have permission to finish this combat.');
            }
        }
        else {
            message.channel.sendMessage('There is no ongoing combat.');
        }
    }
    function isOngoing(message, command) {
        if (ongoing) {
            var msg = 'Current combat status: ';
            if (hasStarted) {
                msg += 'started. Characters cannot join.';
            }
            else {
                msg += 'open. Characters can join by using !combat enter <charactername> <dexvalue>.';
            }
            msg += ' DM: ';
            for (var _i = 0, dmList_1 = dmList; _i < dmList_1.length; _i++) {
                var dm = dmList_1[_i];
                msg += dm.username;
                msg += dmList.indexOf(dm) !== dmList.length - 1 ? ' | ' : '.';
            }
            message.channel.sendMessage(msg);
        }
        else {
            message.channel.sendMessage('There is no ongoing combat.');
        }
    }
    function listCombatants(message, command) {
        if (ongoing) {
            var msg = '';
            if (combatantList.length > 0) {
                msg = 'Combatant list: ';
                for (var _i = 0, combatantList_2 = combatantList; _i < combatantList_2.length; _i++) {
                    var c = combatantList_2[_i];
                    msg += c.name + '(' + c.user.username + ')';
                    msg += combatantList.indexOf(c) !== combatantList.length - 1 ? ', ' : '.';
                }
            }
            else {
                msg = 'There are no combatants registered yet.';
            }
            message.channel.sendMessage(msg);
        }
        else {
            message.channel.sendMessage('There is no ongoing combat.');
        }
    }
    function help(message, command) {
        message.channel.sendMessage('**[PRE-COMBAT]**\n' +
            '**!combot new** - Start a new combat, if there is none ongoing\n' +
            '**!combot ongoing** - Check if there is any ongoing combats\n' +
            '**!combot enter <charactername> <dexvalue> <initmod(optional)>** - Add a character to the combat. If not declared, initmod will be calculated based on dexvalue. ' +
            '_Flags:_ -s|-silent _[DM ONLY]_\n' +
            '**!combot list** - Returns the list of combatants engaged in battle\n' +
            '**!combot start** - _[DM ONLY]_ Start the current combat\n' +
            '\n**[COMBAT]**\n' +
            '**!combot end** - _[DM OR CURRENT PLAYER ONLY]_ Ends current combatant\'s turn\n' +
            '**!combot delay** - _[DM OR CURRENT PLAYER ONLY]_ Delay current combatant\'s turn\n' +
            '**!combot act** - Act your combatant\'s delayed turn\n' +
            '**!combot finish** - Ends current combat\n' +
            '\n**[EXTRA]**\n' +
            '**!combot help** - Shows command list\n' +
            '**!combot info** - Check current bot version');
    }
    function info(message, command) {
        message.channel.sendMessage('ComBot ' + version + ' ready for battle!');
    }
})(Combat || (Combat = {}));
