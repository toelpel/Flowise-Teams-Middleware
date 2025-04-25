const express = require('express');
const { BotFrameworkAdapter } = require('botbuilder');
const axios = require('axios');
require('dotenv').config();

const DEBUGGING = process.env.DEBUGGING === 'true';
const debugLog = (...args) => {
  if (DEBUGGING) console.log(...args);
};

const app = express();
const port = process.env.PORT || 3978;
const version = `1.0.5`;

const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
});

adapter.onTurnError = async (context, error) => {
  console.error('[onTurnError]', error);

  if (error.message?.toLowerCase().includes('unauthorized')) {
    console.warn('[Security] ❌ Invalid token – Access denied!');
  }

  try {
    await context.sendActivity("Something has gone wrong. Please try again.");
  } catch (err) {
    console.error('[SendActivity Error]', err);
  }
};

// Session store (in-memory)
const sessionMap = {}; // Key: userId, Value: sessionId

// Request-Logger Middleware
app.use(express.json());

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const path = req.originalUrl;
  const method = req.method;
  const port = req.socket.localPort;
  const body = req.body;
  const truncatedBody = JSON.stringify(body, null, 2);

  console.log(`[Request] ${method} ${path} from IP ${ip} (Port: ${port})`);

  if (method === 'OPTIONS') {
    debugLog(`  ↳ Request Headers: ${JSON.stringify(req.headers, null, 2)}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    debugLog('[OPTIONS] Response Headers:');
    debugLog(`  ↳ Access-Control-Allow-Origin: *`);
    debugLog(`  ↳ Access-Control-Allow-Methods: POST, GET, OPTIONS`);
    debugLog(`  ↳ Access-Control-Allow-Headers: Content-Type, Authorization`);
    return res.sendStatus(204);
  }

  debugLog(`  ↳ Body: ${truncatedBody.length > 2000 ? truncatedBody.slice(0, 2000) + '... [truncated]' : truncatedBody}`);
  next();
});

app.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    try {
      if (context.activity.type === 'message') {
        const userInput = context.activity.text?.trim();
        const userId = context.activity.from?.id;
        const conversationId = context.activity.conversation?.id;

        // Check for "reset history" command
        const isResetCommand = userInput?.toLowerCase() === 'reset history';

        if (isResetCommand || !sessionMap[userId]) {
          sessionMap[userId] = `${conversationId}-${Date.now()}`;
          console.log(`[Session Reset] User ${userId} → new sessionId: ${sessionMap[userId]}`);
        }

        const sessionId = sessionMap[userId];

        if (isResetCommand) {
          await context.sendActivity("History was successfully reset. Let’s start fresh!");
          return;
        }

        const response = await axios.post(`${process.env.FLOWISE_URL}/api/v1/prediction/${process.env.CHATFLOW_ID}`, {
          question: userInput,
          overrideConfig: {
            sessionId: sessionId
          }
        });

        const botReply = response.data.text || 'Unfortunately, I could not say anything useful 😅';
        await context.sendActivity(botReply);
      }
    } catch (err) {
      console.error("[Bot Error]", err);
      await context.sendActivity("An error has occurred.");
    }
  }).catch((err) => {
    console.error("[Adapter Error when processing /api/messages]", err.message || err);
  });
});

app.listen(port, () => {
  console.log(`Connected to Microsoft AppId: ${process.env.MicrosoftAppId}`);
  console.log(`Flowise Middleware v${version} listening on Port ${port}`);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});
