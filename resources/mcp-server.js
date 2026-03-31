var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/mcp/server.ts
var import_server = require("@modelcontextprotocol/sdk/server/index.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
var import_types = require("@modelcontextprotocol/sdk/types.js");
var import_net = __toESM(require("net"));
var import_os = __toESM(require("os"));
var import_path = __toESM(require("path"));
var SOCKET_PATH = import_path.default.join(import_os.default.homedir(), "Library", "Application Support", "MyBurn", "myburn.sock");
function sendToApp(command) {
  return new Promise((resolve, reject) => {
    const socket = import_net.default.createConnection(SOCKET_PATH);
    let buffer = "";
    socket.on("connect", () => {
      socket.write(JSON.stringify(command) + "\n");
    });
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      if (buffer.includes("\n")) {
        const line = buffer.split("\n")[0];
        try {
          resolve(JSON.parse(line));
        } catch {
          reject(new Error("Parse error"));
        }
        socket.destroy();
      }
    });
    socket.on("error", () => {
      reject(new Error("My Burn app is not running. Please open the app first."));
    });
    socket.setTimeout(5e3, () => {
      socket.destroy();
      reject(new Error("Connection timeout \u2014 is My Burn app running?"));
    });
  });
}
async function callApp(command) {
  const res = await sendToApp(command);
  if (!res.ok) throw new Error(res.error ?? "Unknown error");
  return res.data;
}
var TOOLS = [
  {
    name: "list_subscriptions",
    description: "List all subscriptions in My Burn with cost, billing cycle, next renewal date, tags, and status.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "get_analytics",
    description: "Get spending analytics: monthly/yearly totals, breakdown by category, zombie count, savings opportunities.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "get_upcoming_renewals",
    description: "Get subscriptions renewing soon, sorted by soonest first.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "How many days ahead to look (default: 30)" }
      }
    }
  },
  {
    name: "add_subscription",
    description: "Add a new subscription to My Burn. Use when user says they signed up for something.",
    inputSchema: {
      type: "object",
      required: ["name", "cost", "cycle"],
      properties: {
        name: { type: "string", description: 'Service name, e.g. "Notion", "Linear", "Figma"' },
        cost: { type: "number", description: "Cost amount" },
        costCurrency: { type: "string", enum: ["USD", "INR"], description: "Currency (default: USD)" },
        cycle: { type: "string", enum: ["monthly", "yearly", "custom"], description: "Billing cycle" },
        customDays: { type: "number", description: "Days per cycle (only for custom)" },
        tags: { type: "array", items: { type: "string" }, description: 'Tags e.g. ["Work", "Productivity"]' },
        notes: { type: "string" }
      }
    }
  },
  {
    name: "update_subscription",
    description: "Update an existing subscription (cost, name, cycle, tags, notes).",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "Subscription ID from list_subscriptions" },
        name: { type: "string" },
        cost: { type: "number" },
        cycle: { type: "string", enum: ["monthly", "yearly", "custom"] },
        tags: { type: "array", items: { type: "string" } },
        notes: { type: "string" }
      }
    }
  },
  {
    name: "cancel_subscription",
    description: "Mark a subscription as canceled in My Burn.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "Subscription ID from list_subscriptions" }
      }
    }
  },
  {
    name: "analyze_budget",
    description: "Analyze spending patterns and return actionable insights: top spends, zombies to cut, annual upgrade savings.",
    inputSchema: {
      type: "object",
      properties: {
        focus: { type: "string", description: 'Optional: "savings", "zombies", "work-tools", or omit for full analysis' }
      }
    }
  }
];
function fmtSub(s) {
  const days = Math.ceil((new Date(s.nextBilling).getTime() - Date.now()) / 864e5);
  return `\u2022 **${s.name}** \u2014 ${s.costCurrency === "INR" ? "\u20B9" : "$"}${s.cost}/${s.cycle} \u2014 renews in ${days}d (${new Date(s.nextBilling).toLocaleDateString()})` + (s.isCanceled ? " [CANCELED]" : "") + (s.tags?.length ? ` [${s.tags.join(", ")}]` : "");
}
async function handleTool(name, args) {
  switch (name) {
    case "list_subscriptions": {
      const subs = await callApp({ type: "list_subscriptions" });
      if (!subs.length) return "No subscriptions tracked yet.";
      return subs.map(fmtSub).join("\n");
    }
    case "get_analytics": {
      const data = await callApp({ type: "get_analytics" });
      const byTag = data.by_category;
      return [
        `**Monthly spend:** $${data.monthly_total_usd.toFixed(2)} USD`,
        `**Yearly projection:** $${data.yearly_total_usd.toFixed(2)} USD`,
        `**Active:** ${data.active_count} \xB7 **Canceled:** ${data.canceled_count} \xB7 **Zombies:** ${data.zombie_count}`,
        "",
        "**By category:**",
        ...Object.entries(byTag).sort(([, a], [, b]) => b - a).map(([tag, amt]) => `  \u2022 ${tag}: $${amt.toFixed(2)}/mo`)
      ].join("\n");
    }
    case "get_upcoming_renewals": {
      const days = args.days ?? 30;
      const subs = await callApp({ type: "get_upcoming", days });
      if (!subs.length) return `No renewals in the next ${days} days.`;
      return subs.map((s) => {
        const d = Math.ceil((new Date(s.nextBilling).getTime() - Date.now()) / 864e5);
        return `\u2022 **${s.name}** \u2014 due in ${d} day${d === 1 ? "" : "s"} \u2014 ${s.costCurrency === "INR" ? "\u20B9" : "$"}${s.cost}`;
      }).join("\n");
    }
    case "add_subscription": {
      const sub = await callApp({ type: "add_subscription", data: args });
      return `\u2705 Added **${sub.name}** (${sub.costCurrency === "INR" ? "\u20B9" : "$"}${sub.cost}/${sub.cycle}) \u2014 next billing: ${new Date(sub.nextBilling).toLocaleDateString()}`;
    }
    case "update_subscription": {
      const { id, ...updates } = args;
      const sub = await callApp({ type: "update_subscription", id, data: updates });
      return `\u2705 Updated **${sub.name}**`;
    }
    case "cancel_subscription": {
      const sub = await callApp({ type: "cancel_subscription", id: args.id });
      return `\u2705 Canceled **${sub.name}**`;
    }
    case "analyze_budget": {
      const [analytics, allSubs, upcoming] = await Promise.all([
        callApp({ type: "get_analytics" }),
        callApp({ type: "list_subscriptions" }),
        callApp({ type: "get_upcoming", days: 7 })
      ]);
      const active = allSubs.filter((s) => !s.isCanceled);
      const monthly = analytics.monthly_total_usd;
      const zombies = active.filter((s) => {
        if (!s.lastUsed) return false;
        return Math.ceil((new Date(s.lastUsed).getTime() - Date.now()) / 864e5) < -30;
      });
      const lines = [
        `## Budget Analysis`,
        `**Monthly burn:** $${monthly.toFixed(2)} \xB7 **Yearly:** $${(monthly * 12).toFixed(2)}`,
        `**${active.length}** active subscriptions`,
        ""
      ];
      const sorted = [...active].sort((a, b) => {
        const ac = a.cycle === "monthly" ? a.cost : a.cycle === "yearly" ? a.cost / 12 : a.cost / 30;
        const bc = b.cycle === "monthly" ? b.cost : b.cycle === "yearly" ? b.cost / 12 : b.cost / 30;
        return bc - ac;
      });
      lines.push("**Top spends:**");
      sorted.slice(0, 5).forEach((s) => {
        const mo = s.cycle === "monthly" ? s.cost : s.cycle === "yearly" ? s.cost / 12 : s.cost / 30;
        lines.push(`  \u2022 ${s.name}: $${mo.toFixed(2)}/mo`);
      });
      if (zombies.length) {
        const zombieCost = zombies.reduce((sum, s) => sum + (s.cycle === "monthly" ? s.cost : s.cycle === "yearly" ? s.cost / 12 : s.cost / 30), 0);
        lines.push("", `**\u{1F9DF} Zombies** (cancel to save $${zombieCost.toFixed(2)}/mo):`);
        zombies.forEach((s) => lines.push(`  \u2022 ${s.name} \u2014 last used: ${s.lastUsed ? new Date(s.lastUsed).toLocaleDateString() : "unknown"}`));
      }
      if (upcoming.length) {
        lines.push("", "**\u26A1 Renewing this week:**");
        upcoming.forEach((s) => {
          const d = Math.ceil((new Date(s.nextBilling).getTime() - Date.now()) / 864e5);
          lines.push(`  \u2022 ${s.name} \u2014 in ${d}d \u2014 $${s.cost}`);
        });
      }
      return lines.join("\n");
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
var server = new import_server.Server(
  { name: "myburn", version: "1.0.0" },
  { capabilities: { tools: {} } }
);
server.setRequestHandler(import_types.ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(import_types.CallToolRequestSchema, async (request) => {
  try {
    const text = await handleTool(
      request.params.name,
      request.params.arguments ?? {}
    );
    return { content: [{ type: "text", text }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true
    };
  }
});
void (async () => {
  const transport = new import_stdio.StdioServerTransport();
  await server.connect(transport);
})();
