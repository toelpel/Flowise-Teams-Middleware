# Flowise-Teams-Middleware

A lightweight middleware to connect Microsoft Teams (via Azure Bot Framework) to a Flowise Chatflow endpoint.

Built with Express and botbuilder, this middleware enables Teams users to talk to a Flowise LLM agent using conversational context. It supports per-user sessions, reset commands, and is ready to be deployed as a container.

---

## 🧠 What This Middleware Does

- Acts as an endpoint for a Microsoft Teams bot
- Forwards user input to Flowise using its REST API
- Supports session-based chat history using Flowise's internal memory (via `sessionId`)
- Recognizes a command (`reset history`) to reset conversation state

---

## 🧰 Requirements

- A public-facing server (or reverse proxy) that can host the middleware and expose it via HTTPS
- A [Flowise](https://github.com/FlowiseAI/Flowise) instance with a published Chatflow
- An Azure Bot Framework registration
- Docker (for containerizing the middleware)

---

## 🤖 Creating a Microsoft Teams Bot via the Developer Portal

Follow these steps to register your bot and connect it to Microsoft Teams using the [Microsoft Teams Developer Portal](https://dev.teams.microsoft.com):

### 1. Access the Developer Portal

- Navigate to [https://dev.teams.microsoft.com](https://dev.teams.microsoft.com)
- Sign in with your Microsoft 365 account

### 2. Create a New App

- Click **“Create a new app”**
- Fill in the required details:
  - **App name** – Name of your app
  - **Short description** – A brief summary
  - **Long description** – Detailed description of your app’s purpose
  - **Company name** – Your organization name
  - **Website** – Your company or project website
  - **Privacy statement URL** - Must be a valid URL
  - **Terms of use URL** - Must be a valid URL
  - **Application (client) ID** - Leave blank for the moment, we fill this up after creating the bot ressource in the next step
- Click **“Save”**

### 3. Configure Branding & App URLs

- Upload the required icons (check [requirements](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/apps-package#app-icons)):
  - **Color icon** (192x192 PNG)
  - **Outline icon** (32x32 PNG)

### 4. Add a Bot to the App

- Go to **“App features”**
- Click **“Bot”**
- Choose **“Create a new bot”**  → **“New bot”**
- Give your bot a name and click **Add**
- **Endpoint address** - Address of your reverse proxy hosting the middleware, e.g. https://<your-public-domain>/api/messages
- Navigate to **Client secrets** and add a new secret
- Save the generated **Client Secret** securely (you won’t see it again!) – you’ll need it for your `.env` file
- Go back to the **Bot management** and copy the **Bot ID** – you’ll need it for your `.env` file and also for the **Application (client) ID** in your Teams App in the previous step
- Go back to your **Bot** and navigate to **App features** and click on **Bot**
- Select the created bot from the drop down
- Select the scopes your bot should support:
  - ✅ Personal
  - ✅ Team
  - ✅ Group Chat
- Click **“Save”**

### 5. Finalize and validate the Teams-App

- Navigate in the **“Configure”** tab to **“Basic information”**
- Fill in the **Bot ID** (from the preivous step) into **Application (client) ID**
- Click **Save**
- Under **Publish** click on **App validation** and create a new validation
- Fix all issues (if there are any) and download the **App package** - you'll be able to import this **App package** into Teams

### 6. Upload Your App to Microsoft Teams

- Open Microsoft Teams
- Go to **“Apps”** → **“Manage your apps”** (at the bottom)
- Click **“Upload a custom app”** and select the `.zip` file
- Follow the prompts to install the app into Teams

### 7. Test the Bot

- Open a chat with your bot inside Microsoft Teams
- Send a message – if your middleware is deployed correctly, you should get a reply from your Flowise bot 🎉

---

## 🔐 .env Configuration

Create a `.env` file in the root of the project:

```env
MicrosoftAppId=<your Bot ID>
MicrosoftAppPassword=<your Client Secret>
FLOWISE_URL=https://your-flowise-instance.com
CHATFLOW_ID=<your Chatflow ID>
DEBUGGING=true
```

### Variable meanings:

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `MicrosoftAppId`       | From your Azure Bot App Registration                       |
| `MicrosoftAppPassword` | Secret associated with the App Registration                |
| `FLOWISE_URL`          | Base URL to your Flowise instance                          |
| `CHATFLOW_ID`          | ID of the Chatflow to connect to                           |
| `DEBUGGING`            | Set to `true` to enable console logging                    |

---

## 🐳 Docker: Build & Run

1. Build the image:

```bash
docker build -t flowise-teams-middleware .
```

2. Run the container (example using `.env` file):

```bash
docker run -p 3978:3978 --env-file .env flowise-teams-middleware
```

You should now have a running middleware on `http://localhost:3978/api/messages` (or behind your reverse proxy).

---

## 🧪 Testing the Middleware

Use the **Test** feature in the [Bot Framework](https://dev.botframework.com/bots), or connect via Microsoft Teams directly.

Send a message, and Flowise will respond via the bot. You can also test via PowerShell or `curl`:

```bash
curl -X POST https://your-domain.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message",
    "text": "Hello!",
    "from": { "id": "user1" },
    "recipient": { "id": "bot" },
    "conversation": { "id": "conv1" },
    "channelId": "test",
    "serviceUrl": "https://your-domain.com"
  }'
```

---

## ✨ Features

### 🧠 Session Handling

- Each user gets a unique `sessionId` based on their conversation & user ID
- Flowise uses this to maintain contextual memory

### 🔁 Reset Command

- If a user sends `reset history`, the middleware generates a new `sessionId`
- This clears Flowise's memory for that user

You can customize this behavior or extend it to support more commands.

---

## 🛡️ Security

This middleware respects Microsoft Bot Framework token validation. Do **not** disable authentication in production.

---

## 🤝 Contributing

Pull requests welcome!
Feel free to fork and improve!

---

## 📜 License

MIT – Use it, share it, improve it ✌️