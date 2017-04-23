namespace Combat {
    let ongoing				: boolean = false;
    let hasStarted      	: boolean = false;
    let channel         	: TextChannel = null;
    let dmList				: Array<User> = new Array<User>();
    let currentCombatant	: Combatant = null;
    let combatantList		: Array<Combatant> = new Array<Combatant>();
    let initList			: Array<Combatant> = new Array<Combatant>();
    let delayList			: Array<Combatant> = new Array<Combatant>();

    export function handle(message) {
        let command = message.content.split(' ').slice(1);
        switch (command[0].toLowerCase()) {
            case 'new':
                newCombat(message, command.slice(1));
                break;
            case 'enter':
                enterCombat(message, command.slice(1));
                break;
            case 'start':
                startCombat(message);
                break;
            case 'init':
                listInit(message);
                break;
            case 'end':
                endTurn(message);
                break;
            case 'delay':
                delay(message);
                break;
            case 'act':
                act(message);
                break;
            case 'finish':
                finishCombat(message);
                break;
            case 'ongoing':
                isOngoing(message);
                break;
            case 'list':
                listCombatants(message);
                break;
            case 'help':
                help(message);
                break;
            case 'info':
                message.channel.sendMessage('ComBot ' + version + ' ready for battle!');
                break;
            default:
                message.channel.sendMessage(message.content + ' - command failed');
        }
    }

    function newCombat(message, command) {
        if (ongoing) {
            message.channel.sendMessage('There is already an ongoing combat.');
        } else {
            if (message.channel.type === 'text') {
                dmList.push(message.author);
                channel = message.channel;
                ongoing = true;
                hasStarted = false;
                message.channel.sendMessage(message.author + ' has started a new combat on channel ' + channel + '!');
            } else {
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
            let silent = false;
            for (let c in command) {
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
            } else {
                channel.sendMessage(command[0] + ' has entered the fray!');
            }
        } else {
            if (!ongoing) message.channel.sendMessage('There is no ongoing combat.');
            else message.channel.sendMessage('Combat has already started. You cannot join.');
        }
    }

    function startCombat(message) {
		if (!hasStarted) {
			hasStarted = true;
			initList = new Array<Combatant>();
			for (let c of combatantList) {
				c.rollInitiative();
				let i = initList.length - 1;
				while ((i > -1) && ((initList[i].init.total < c.init.total) || ((initList[i].init.total === c.init.total) && (initList[i].dex < c.dex)))) {
					i--;
				}
				initList.splice(i+1, 0, c);
			}
			channel.sendMessage('Combat has begun!\n');
			listInit(message);
			startTurn();
		} else {
			message.channel.sendMessage('Combat has already started.');
		}
    }

	function listInit(message) {
		if (hasStarted) {
			let msg = 'Round Order:\n';
			if (currentCombatant) {
				msg += currentCombatant.name + ' (' + currentCombatant.init.roll + '+' + currentCombatant.initMod + ' = ' + currentCombatant.init.total + ')\n';
			}
			for (let c of initList) {
				msg += c.name + ' (' + c.init.roll + '+' + c.initMod + ' = ' + c.init.total + ')\n';
			}
			if (delayList.length > 0) {
				msg += 'Delayed: ';
				for (let c of delayList) {
					msg += c.name;
					msg += delayList.indexOf(c) < delayList.length - 1 ? ',' : '';
				}
			}
			channel.sendMessage(msg);
		} else {
			message.channel.sendMessage('Combat has not started yet.');
		}
	}

    function startTurn(keyword = 'ended') {
        let msg = '';
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

    function endTurn(message) {
		if (hasStarted) {
			if ((message.author === currentCombatant.user) || (dmList.indexOf(message.user) !== -1)) {
				startTurn();
			} else {
				message.channel.sendMessage('You cannot end someone else\'s turn.');
			}
		} else {
			message.channel.sendMessage('Combat has not started yet.');
		}
    }

    function delay(message) {
		if (hasStarted) {
			if ((message.author === currentCombatant.user) || (dmList.indexOf(message.user) !== -1)) {
				delayList.push(currentCombatant);
				startTurn('delayed');
			} else {
				message.channel.sendMessage('You cannot delay someone else\'s turn.');
			}
		} else {
			message.channel.sendMessage('Combat has not started yet.');
		}
    }

	function act(message) {
		if (hasStarted) {
			let combatant = null;
			for (let c of delayList) {
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
			} else {
				message.channel.sendMessage('You don\'t have a delayed turn.');
			}
		} else {
			message.channel.sendMessage('Combat has not started yet.');
		}
	}

    function finishCombat(message) {
        if (ongoing) {
            if (dmList.indexOf(message.author) !== -1) {
                if ((message.channel.type === 'dm') || (message.channel === channel)) {
                    ongoing = false;
					currentCombatant = null;
                    dmList = new Array<User>();
                    combatantList = new Array<Combatant>();
					initList = new Array<Combatant>();
					delayList = new Array<Combatant>();
                    channel.sendMessage(message.author + ' has ended the combat!');
                } else {
                    message.channel.sendMessage('You cannot finish the current combat from this channel. Use either ' + channel +' or PM.');
                }
            } else {
                message.channel.sendMessage('You do not have permission to finish this combat.');
            }
        } else {
            message.channel.sendMessage('There is no ongoing combat.');
        }
    }

    function isOngoing(message) {
        if (ongoing) {
            let msg = 'Current combat status: ';
            if (hasStarted) {
                msg += 'started. Characters cannot join.'
            } else {
                msg += 'open. Characters can join by using !combat enter <charactername> <dexvalue>.'
            }
            msg += ' DM: ';
            for (let dm of dmList) {
                msg += dm.username;
                msg += dmList.indexOf(dm) !== dmList.length - 1 ? ' | ' : '.';
            }
            message.channel.sendMessage(msg);
        } else {
            message.channel.sendMessage('There is no ongoing combat.');
        }
    }

    function listCombatants(message) {
        if (ongoing) {
            let msg = '';
            if (combatantList.length > 0) {
                msg = 'Combatant list: ';
                for (let c of combatantList) {
                    msg += c.name + '(' + c.user.username + ')';
                    msg += combatantList.indexOf(c) !== combatantList.length - 1 ? ', ' : '.';
                }
            } else {
                msg = 'There are no combatants registered yet.'
            }
            message.channel.sendMessage(msg);
        } else {
            message.channel.sendMessage('There is no ongoing combat.');
        }
    }

    function help(message) {
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
}