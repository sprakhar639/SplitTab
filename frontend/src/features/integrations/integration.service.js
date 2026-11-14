import { mockIntegrations } from "../../services/mockData";

// Channels a user can send reminders and reports to. Email is built in and
// always uses the account email.
export const INTEGRATIONS = [
  {
    id: "email",
    name: "Email",
    badge: "@",
    color: "bg-mint",
    description: "Reminders and reports sent to your account email.",
    builtIn: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    badge: "WA",
    color: "bg-green-200",
    description: "Get reminders and digests as WhatsApp messages.",
    field: {
      label: "WhatsApp number",
      placeholder: "+91 98765 43210",
      pattern: /^\+\d[\d\s-]{9,15}$/,
      error: "Enter the number with its country code, like +91 98765 43210",
    },
    note: "We'll send a one-time code to this number to confirm it's yours.",
  },
  {
    id: "telegram",
    name: "Telegram",
    badge: "TG",
    color: "bg-sky-200",
    description: "Messages from the SplitTab bot in Telegram.",
    field: {
      label: "Telegram username",
      placeholder: "@vishal",
      pattern: /^@?[a-zA-Z0-9_]{5,32}$/,
      error: "Usernames are 5-32 letters, numbers or underscores",
    },
    note: "You'll open @SplitTabBot and press Start to finish connecting.",
  },
  {
    id: "slack",
    name: "Slack",
    badge: "SL",
    color: "bg-purple-200",
    description: "Post group reminders and reports to a Slack channel.",
    field: {
      label: "Slack channel",
      placeholder: "#flat-302",
      pattern: /^#?[a-z0-9_-]{1,80}$/,
      error: "Channel names use lowercase letters, numbers, - and _",
    },
    note: "You'll approve SplitTab in your Slack workspace.",
  },
  {
    id: "discord",
    name: "Discord",
    badge: "DC",
    color: "bg-indigo-200",
    description: "Post reminders to a Discord channel through a webhook.",
    field: {
      label: "Webhook URL",
      placeholder: "https://discord.com/api/webhooks/…",
      pattern: /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/.+/,
      error: "Paste the webhook URL from Channel settings → Integrations",
    },
  },
  {
    id: "sms",
    name: "SMS",
    badge: "SMS",
    color: "bg-amber-200",
    description: "Plain text messages for people who don't use chat apps.",
    field: {
      label: "Phone number",
      placeholder: "+91 98765 43210",
      pattern: /^\+\d[\d\s-]{9,15}$/,
      error: "Enter the number with its country code, like +91 98765 43210",
    },
  },
];

export function integrationName(id) {
  return INTEGRATIONS.find((integration) => integration.id === id)?.name ?? id;
}

// Mock for GET /integrations. Email is always connected.
export async function getConnections(accountEmail) {
  const connections = await mockIntegrations.list();

  return {
    email: { target: accountEmail || "Your account email", connectedAt: null },
    ...connections,
  };
}

// Mock for POST /integrations/:id
export function connectIntegration(id, target) {
  return mockIntegrations.connect(id, target.trim());
}

// Mock for DELETE /integrations/:id
export function disconnectIntegration(id) {
  return mockIntegrations.disconnect(id);
}

// Mock for POST /integrations/:id/test
export function sendTestMessage(id) {
  return mockIntegrations.sendTest(id);
}
