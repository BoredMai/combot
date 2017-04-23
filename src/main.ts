/*
  An initiative tracker
*/
const Discord = require('discord.js');
const token = require('./token.js');
const combot = new Discord.Client();
const version = '1.0.0';

combot.login(token);

combot.on('ready', () => {
  Combat.setup();
  console.log('ComBot ' + version + ' ready for battle');
});

combot.on('message', message => {
  if (message.author.id !== combot.user.id) {
    if (message.content.indexOf('!combot') === 0) Combat.handle(message);
  }
});