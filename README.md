# ComBot
An initiative tracker bot for Discord

#### 1. How do I use this?
First clone the repository, then run `npm install` and it should set everything up for you. After that, `gulp watch` will build the `*.ts` files into `combot.js` and run `nodemon combot.js`.
To actually use the bot, you will need to add it to your Discord server and leave it running somewhere.

#### 2. And in the server, how do I use it?
`!combot help` will give you everything you need.

#### 2. Can I reuse it? Change it? Do whatever?
Yes. Just credit me, but do whatever.

#### 3. There are errors in my editor! What do?!
There are a few errors in `combatant.ts` and `combat.ts` that show up because they don't see the `discord.js` types. I've googled quite a bit trying to fix that, but I couldn't. All `*.ts` files are compiled into a single file that has the correct import, so in the end, it doesn't even matter. Just chill.
