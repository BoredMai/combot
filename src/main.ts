/*
  An initiative tracker
*/
const Discord = require('discord.js');
const combot = new Discord.Client();
const token = 'MzA1NDUxOTY2ODIwMjUzNjk4.C91Z2g.-31utlOdV5RT2A79qEl5eYq2XLI';
const version = '1.0.0';

combot.login(token);

combot.on('ready', () => {
  console.log('ComBot ' + version + ' ready for battle');
});

combot.on('message', message => {
  if (message.author.id !== combot.user.id) {
    if (message.content.indexOf('!combot') === 0) Combat.handle(message);
  }
});