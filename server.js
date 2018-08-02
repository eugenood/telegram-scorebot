// REQUIREMENTS

const dotenv = require('dotenv');
const express = require('express');
const Telegraf = require('telegraf');
const Model = require('./model');

// DOTENV SETUP

dotenv.config();

// BOT SETUP

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.telegram.getMe().then(botInfo => {
  bot.options.username = botInfo.username;
});

// START COMMAND

bot.start(ctx => {
  let message = '';
  message += 'Hello! I can help you keep track of scores. You can control me by sending me these commands.\n';
  message += '\n';
  message += '/addteamscore - add team score\n';
  message += '/addsoloscore - add solo score\n';
  message += '/adduser - add user\n';
  message += '/help - show detailed help\n';
  message += '/displayscore - display score\n';
  message += '/who - get user ID\n';
  return ctx.reply(message);
});

// HELP COMMAND

bot.help(ctx => {
  let message = '';
  message += 'Add [score] to [teamId].\n';
  message += '/addteamscore [teamId] [score]\n';
  message += '/t [teamId] [score]\n';
  message += '\n';
  message += 'Add [score] to [soloId] from [teamId].\n';
  message += '/addsoloscore [teamId] [soloId] [score]\n';
  message += '/s [teamId] [soloId] [score]\n';
  message += '\n';
  message += 'Add [userId].\n';
  message += '/adduser [userId]\n';
  message += '/u [teamId] [soloId] [score]\n';
  message += '\n';
  message += 'Show this detailed helpsheet.\n';
  message += '/help\n';
  message += '\n';
  message += 'Display score.\n';
  message += '/displayscore\n';
  message += '/ds\n';
  message += '\n';
  message += 'Get user ID.\n';
  message += '/who\n';
  message += '\n';
  return ctx.reply(message);
});

// ADDTEAMSCORE COMMAND

bot.command(['addteamscore', 't'], async ctx => {
  const args = ctx.message.text.split(' ');
  const teamId = args[1];
  const score = Number(args[2]);
  const userId = ctx.from.id;
 
  try {
    const res = await Model.addTeamScore(teamId, score, userId);
    const newScore = res.team.solos.reduce((accumulator, solo) => accumulator + solo.score, res.team.score);
    const message = `*${res.team.name}* has *${newScore}* points.`;
    return ctx.telegram.sendMessage(ctx.chat.id, message, { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    return ctx.reply(err);
  }
});

// ADDSOLOSCORE COMMAND

bot.command(['addsoloscore', 's'], async ctx => {
  const args = ctx.message.text.split(' ');
  const teamId = args[1];
  const soloId = args[2];
  const score = Number(args[3]);
  const userId = ctx.from.id;
  
  try {
    const res = await Model.addSoloScore(teamId, soloId, score, userId);
    const message = `*${res.solo.name}* from *${res.team.name}* has *${res.solo.score} points*`;
    return ctx.telegram.sendMessage(ctx.chat.id, message, { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    return ctx.reply(err);
  }
});

// ADDUSER COMMAND

bot.command(['adduser', 'u'], async ctx => {
  const args = ctx.message.text.split(' ');
  const targetId = Number(args[1]);
  const userId = ctx.from.id;
  
  try {
    const newScore = await Model.addUser(targetId, userId);
    const message = `User ${targetId} has been added`;
    return ctx.reply(message);
  } catch (err) {
    return ctx.reply(err);
  }
});

// DISPLAYSCORE COMMAND

bot.command(['displayscore', 'ds'], async ctx => {
  const teamsModel = await Model.getTeamsModel();
  const teamsMessage = teamsModel.map(team => {
    const totalScore = team.solos.reduce((score, solo) => score + solo.score, team.score);
    return team.solos.reduce((accumulator, solo) => {
      return `${accumulator}\n${solo.name} (${solo.id}) - \`${solo.score}\``;
    }, `*${team.name} (${team.id}) - ${totalScore} = ${totalScore - team.score} + ${team.score}*`);
  });
  
  const message = teamsMessage.reduce((accumulator, mess) => `${accumulator}\n\n${mess}`);
  return ctx.replyWithMarkdown(message);
});

// WHO COMMAND

bot.command('who', async ctx => {
  return ctx.replyWithMarkdown(`${ctx.from.first_name} your ID is \`${ctx.from.id}\``);
});

// BOT POLL

bot.startPolling()
