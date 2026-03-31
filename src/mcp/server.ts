/**
 * My Burn MCP Server
 *
 * Runs as a stdio MCP server. Communicates with the Electron app
 * via a Unix socket at ~/Library/Application Support/MyBurn/myburn.sock
 *
 * Register in Claude Desktop config:
 * {
 *   "mcpServers": {
 *     "myburn": {
 *       "command": "node",
 *       "args": ["/path/to/resources/mcp-server.js"]
 *     }
 *   }
 * }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import net from 'net'
import os from 'os'
import path from 'path'

const SOCKET_PATH = path.join(os.homedir(), 'Library', 'Application Support', 'MyBurn', 'myburn.sock')

// ── Socket bridge ─────────────────────────────────────────────────────────────

function sendToApp(command: object): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(SOCKET_PATH)
    let buffer = ''

    socket.on('connect', () => {
      socket.write(JSON.stringify(command) + '\n')
    })

    socket.on('data', (chunk) => {
      buffer += chunk.toString()
      if (buffer.includes('\n')) {
        const line = buffer.split('\n')[0]
        try {
          resolve(JSON.parse(line))
        } catch {
          reject(new Error('Parse error'))
        }
        socket.destroy()
      }
    })

    socket.on('error', () => {
      reject(new Error('My Burn app is not running. Please open the app first.'))
    })

    socket.setTimeout(5000, () => {
      socket.destroy()
      reject(new Error('Connection timeout — is My Burn app running?'))
    })
  })
}

async function callApp<T>(command: object): Promise<T> {
  const res = await sendToApp(command)
  if (!res.ok) throw new Error(res.error ?? 'Unknown error')
  return res.data as T
}

// ── Tools ──────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'list_subscriptions',
    description: 'List all subscriptions in My Burn with cost, billing cycle, next renewal date, tags, and status.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_analytics',
    description: 'Get spending analytics: monthly/yearly totals, breakdown by category, zombie count, savings opportunities.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_upcoming_renewals',
    description: 'Get subscriptions renewing soon, sorted by soonest first.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'How many days ahead to look (default: 30)' }
      }
    }
  },
  {
    name: 'add_subscription',
    description: 'Add a new subscription to My Burn. Use when user says they signed up for something.',
    inputSchema: {
      type: 'object',
      required: ['name', 'cost', 'cycle'],
      properties: {
        name: { type: 'string', description: 'Service name, e.g. "Notion", "Linear", "Figma"' },
        cost: { type: 'number', description: 'Cost amount' },
        costCurrency: { type: 'string', enum: ['USD', 'INR'], description: 'Currency (default: USD)' },
        cycle: { type: 'string', enum: ['monthly', 'yearly', 'custom'], description: 'Billing cycle' },
        customDays: { type: 'number', description: 'Days per cycle (only for custom)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags e.g. ["Work", "Productivity"]' },
        notes: { type: 'string' }
      }
    }
  },
  {
    name: 'update_subscription',
    description: 'Update an existing subscription (cost, name, cycle, tags, notes).',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Subscription ID from list_subscriptions' },
        name: { type: 'string' },
        cost: { type: 'number' },
        cycle: { type: 'string', enum: ['monthly', 'yearly', 'custom'] },
        tags: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' }
      }
    }
  },
  {
    name: 'cancel_subscription',
    description: 'Mark a subscription as canceled in My Burn.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Subscription ID from list_subscriptions' }
      }
    }
  },
  {
    name: 'analyze_budget',
    description: 'Analyze spending patterns and return actionable insights: top spends, zombies to cut, annual upgrade savings.',
    inputSchema: {
      type: 'object',
      properties: {
        focus: { type: 'string', description: 'Optional: "savings", "zombies", "work-tools", or omit for full analysis' }
      }
    }
  }
]

// ── Tool handlers ──────────────────────────────────────────────────────────────

type Sub = {
  id: string; name: string; cost: number; costCurrency: string; cycle: string
  nextBilling: string; tags: string[]; isCanceled: boolean; lastUsed?: string
  monthlyCostUsd?: number
}

function fmtSub(s: Sub): string {
  const days = Math.ceil((new Date(s.nextBilling).getTime() - Date.now()) / 86400000)
  return `• **${s.name}** — ${s.costCurrency === 'INR' ? '₹' : '$'}${s.cost}/${s.cycle}` +
    ` — renews in ${days}d (${new Date(s.nextBilling).toLocaleDateString()})` +
    (s.isCanceled ? ' [CANCELED]' : '') +
    (s.tags?.length ? ` [${s.tags.join(', ')}]` : '')
}

async function handleTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'list_subscriptions': {
      const subs = await callApp<Sub[]>({ type: 'list_subscriptions' })
      if (!subs.length) return 'No subscriptions tracked yet.'
      return subs.map(fmtSub).join('\n')
    }

    case 'get_analytics': {
      const data = await callApp<Record<string, unknown>>({ type: 'get_analytics' })
      const byTag = data.by_category as Record<string, number>
      return [
        `**Monthly spend:** $${(data.monthly_total_usd as number).toFixed(2)} USD`,
        `**Yearly projection:** $${(data.yearly_total_usd as number).toFixed(2)} USD`,
        `**Active:** ${data.active_count} · **Canceled:** ${data.canceled_count} · **Zombies:** ${data.zombie_count}`,
        '',
        '**By category:**',
        ...Object.entries(byTag)
          .sort(([, a], [, b]) => b - a)
          .map(([tag, amt]) => `  • ${tag}: $${amt.toFixed(2)}/mo`)
      ].join('\n')
    }

    case 'get_upcoming_renewals': {
      const days = (args.days as number) ?? 30
      const subs = await callApp<Sub[]>({ type: 'get_upcoming', days })
      if (!subs.length) return `No renewals in the next ${days} days.`
      return subs.map((s) => {
        const d = Math.ceil((new Date(s.nextBilling).getTime() - Date.now()) / 86400000)
        return `• **${s.name}** — due in ${d} day${d === 1 ? '' : 's'} — ${s.costCurrency === 'INR' ? '₹' : '$'}${s.cost}`
      }).join('\n')
    }

    case 'add_subscription': {
      const sub = await callApp<Sub>({ type: 'add_subscription', data: args })
      return `✅ Added **${sub.name}** (${sub.costCurrency === 'INR' ? '₹' : '$'}${sub.cost}/${sub.cycle}) — next billing: ${new Date(sub.nextBilling).toLocaleDateString()}`
    }

    case 'update_subscription': {
      const { id, ...updates } = args
      const sub = await callApp<Sub>({ type: 'update_subscription', id, data: updates })
      return `✅ Updated **${sub.name}**`
    }

    case 'cancel_subscription': {
      const sub = await callApp<Sub>({ type: 'cancel_subscription', id: args.id })
      return `✅ Canceled **${sub.name}**`
    }

    case 'analyze_budget': {
      const [analytics, allSubs, upcoming] = await Promise.all([
        callApp<Record<string, unknown>>({ type: 'get_analytics' }),
        callApp<Sub[]>({ type: 'list_subscriptions' }),
        callApp<Sub[]>({ type: 'get_upcoming', days: 7 })
      ])

      const active = allSubs.filter((s) => !s.isCanceled)
      const monthly = analytics.monthly_total_usd as number
      const zombies = active.filter((s) => {
        if (!s.lastUsed) return false
        return Math.ceil((new Date(s.lastUsed).getTime() - Date.now()) / 86400000) < -30
      })

      const lines = [
        `## Budget Analysis`,
        `**Monthly burn:** $${monthly.toFixed(2)} · **Yearly:** $${(monthly * 12).toFixed(2)}`,
        `**${active.length}** active subscriptions`,
        ''
      ]

      const sorted = [...active].sort((a, b) => {
        const ac = a.cycle === 'monthly' ? a.cost : a.cycle === 'yearly' ? a.cost / 12 : a.cost / 30
        const bc = b.cycle === 'monthly' ? b.cost : b.cycle === 'yearly' ? b.cost / 12 : b.cost / 30
        return bc - ac
      })
      lines.push('**Top spends:**')
      sorted.slice(0, 5).forEach((s) => {
        const mo = s.cycle === 'monthly' ? s.cost : s.cycle === 'yearly' ? s.cost / 12 : s.cost / 30
        lines.push(`  • ${s.name}: $${mo.toFixed(2)}/mo`)
      })

      if (zombies.length) {
        const zombieCost = zombies.reduce((sum, s) => sum + (s.cycle === 'monthly' ? s.cost : s.cycle === 'yearly' ? s.cost / 12 : s.cost / 30), 0)
        lines.push('', `**🧟 Zombies** (cancel to save $${zombieCost.toFixed(2)}/mo):`)
        zombies.forEach((s) => lines.push(`  • ${s.name} — last used: ${s.lastUsed ? new Date(s.lastUsed).toLocaleDateString() : 'unknown'}`))
      }

      if (upcoming.length) {
        lines.push('', '**⚡ Renewing this week:**')
        upcoming.forEach((s) => {
          const d = Math.ceil((new Date(s.nextBilling).getTime() - Date.now()) / 86400000)
          lines.push(`  • ${s.name} — in ${d}d — $${s.cost}`)
        })
      }

      return lines.join('\n')
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// ── Server setup ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'myburn', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const text = await handleTool(
      request.params.name,
      (request.params.arguments ?? {}) as Record<string, unknown>
    )
    return { content: [{ type: 'text', text }] }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
      isError: true
    }
  }
})

void (async () => {
  const transport = new StdioServerTransport()
  await server.connect(transport)
})()
