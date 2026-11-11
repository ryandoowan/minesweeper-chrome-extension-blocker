const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const CHANNEL_NAME = 'annie-minesweeper-logs';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));

const app = express();
app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => res.send('ok')); // handy for checking the deploy is alive

app.post('/minesweeper', async (req, res) => {
  if (!process.env.SHARED_SECRET || req.get('x-secret') !== process.env.SHARED_SECRET) {
    return res.sendStatus(401);
  }

  const { name, reason, usedMin, limitMin } = req.body || {};
  const left = Math.max(0, Number(limitMin) - Number(usedMin));
  const who = String(name || 'Annie').slice(0, 40);



  // Find the log channel in every server the bot is in
  const channels = client.channels.cache.filter(
    (c) => c.name === CHANNEL_NAME && c.isTextBased()
  );
  if (channels.size === 0) return res.status(503).send('log channel not found');

  const content =
    (Number.isFinite(left) ? `⏱️ **${left} min** left to play today\n` : '') +
    `**${who}** said: "${String(reason || '').slice(0, 500)}"`;

  try {
    for (const channel of channels.values()) {
      await channel.send({ content, allowedMentions: { parse: [] } });
    }
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

client.login(process.env.BOT_TOKEN);
app.listen(process.env.PORT || 3000, () => console.log('HTTP server up'));