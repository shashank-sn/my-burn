import { useState, useRef } from 'react'
import type { Subscription } from '../types'

interface ParsedReceipt {
  name: string
  cost: number
  costCurrency: 'USD' | 'INR'
  cycle: 'monthly' | 'yearly' | 'custom'
}

interface Props {
  onParsed: (data: Partial<Pick<Subscription, 'name' | 'cost' | 'costCurrency' | 'cycle'>>) => void
  onClose: () => void
}

// Known service domains → friendly names
const KNOWN_SERVICES: Record<string, string> = {
  'netflix.com': 'Netflix',
  'spotify.com': 'Spotify',
  'apple.com': 'Apple',
  'icloud.com': 'iCloud',
  'google.com': 'Google',
  'notion.so': 'Notion',
  'notion.com': 'Notion',
  'figma.com': 'Figma',
  'linear.app': 'Linear',
  'github.com': 'GitHub',
  'dropbox.com': 'Dropbox',
  'slack.com': 'Slack',
  'zoom.us': 'Zoom',
  'adobe.com': 'Adobe',
  'canva.com': 'Canva',
  'loom.com': 'Loom',
  'vercel.com': 'Vercel',
  'heroku.com': 'Heroku',
  'digitalocean.com': 'DigitalOcean',
  'aws.amazon.com': 'AWS',
  'openai.com': 'OpenAI',
  'anthropic.com': 'Anthropic',
  'midjourney.com': 'Midjourney',
  'grammarly.com': 'Grammarly',
  'hubspot.com': 'HubSpot',
  'mailchimp.com': 'Mailchimp',
  'airtable.com': 'Airtable',
  'asana.com': 'Asana',
  'trello.com': 'Trello',
  'clickup.com': 'ClickUp',
  'intercom.com': 'Intercom',
  'zendesk.com': 'Zendesk',
  'cloudflare.com': 'Cloudflare',
  '1password.com': '1Password',
  'lastpass.com': 'LastPass',
  'nordvpn.com': 'NordVPN',
  'expressvpn.com': 'ExpressVPN',
  'twitch.tv': 'Twitch',
  'youtube.com': 'YouTube Premium',
  'hulu.com': 'Hulu',
  'disneyplus.com': 'Disney+',
  'hbomax.com': 'Max',
  'max.com': 'Max',
  'primevideo.com': 'Prime Video',
}

function parseEml(content: string): ParsedReceipt | null {
  // Extract From header to identify service
  const fromMatch = content.match(/^From:\s*.+?<?([\w.-]+@[\w.-]+)>?/im)
  const fromDomain = fromMatch ? fromMatch[1].split('@')[1]?.toLowerCase() : null

  // Detect service name from known domains
  let name = ''
  if (fromDomain) {
    for (const [domain, svcName] of Object.entries(KNOWN_SERVICES)) {
      if (fromDomain.includes(domain)) {
        name = svcName
        break
      }
    }
    // Fallback: capitalize domain root
    if (!name) {
      const parts = fromDomain.split('.')
      const root = parts.length >= 2 ? parts[parts.length - 2] : parts[0]
      name = root.charAt(0).toUpperCase() + root.slice(1)
    }
  }

  // Also scan Subject for service name clues
  const subjectMatch = content.match(/^Subject:\s*(.+)/im)
  const subject = subjectMatch ? subjectMatch[1] : ''

  // Try to extract a better name from subject like "Your Notion subscription"
  const subjectServiceMatch = subject.match(/(?:your|receipt for|invoice for|payment for|subscription to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
  if (subjectServiceMatch && !name) {
    name = subjectServiceMatch[1]
  }

  // Extract USD amount: $X.XX or $X /month|/mo|/year|/yr
  const usdMatch = content.match(/\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/\s*(?:month|mo|year|yr|annually))?/i)
  // Extract INR amount: ₹X or Rs.X
  const inrMatch = content.match(/(?:₹|Rs\.?)\s*(\d+(?:\.\d{1,2})?)/i)

  let cost = 0
  let costCurrency: 'USD' | 'INR' = 'USD'

  if (inrMatch) {
    cost = parseFloat(inrMatch[1])
    costCurrency = 'INR'
  } else if (usdMatch) {
    cost = parseFloat(usdMatch[1])
    costCurrency = 'USD'
  }

  if (!cost) return null

  // Detect billing cycle
  const lc = content.toLowerCase()
  let cycle: 'monthly' | 'yearly' | 'custom' = 'monthly'
  if (/annual|yearly|per year|\/year|\/yr|billed annually/.test(lc)) {
    cycle = 'yearly'
  }

  return { name: name || 'Unknown Service', cost, costCurrency, cycle }
}

export default function ReceiptImport({ onParsed, onClose }: Props) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.name.endsWith('.eml')) {
      setError('Please drop a .eml email file')
      return
    }
    setParsing(true)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = parseEml(content)
      setParsing(false)
      if (!result) {
        setError('Could not extract subscription details. Try adding manually.')
        return
      }
      onParsed(result)
    }
    reader.onerror = () => {
      setParsing(false)
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card w-[440px] p-6 fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Import from Receipt</h2>
          <button onClick={onClose} className="no-drag text-text-muted hover:text-text-primary text-xl leading-none">×</button>
        </div>

        <div
          className={`relative flex flex-col items-center justify-center gap-3 p-8 transition-all cursor-pointer`}
          style={{
            border: `2px dashed ${dragging ? '#FF4D00' : 'var(--panel-border)'}`,
            borderRadius: 'var(--card-radius)',
            background: dragging ? 'rgba(255,77,0,0.05)' : 'var(--card-bg)',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".eml" className="hidden" onChange={onFileInput} />

          {parsing ? (
            <div className="text-text-muted text-sm">Parsing receipt...</div>
          ) : (
            <>
              <div className="text-4xl opacity-60">📧</div>
              <div className="text-sm text-text-primary font-medium">Drop your .eml receipt here</div>
              <div className="text-xs text-text-muted">or click to browse</div>
              <div className="text-xs text-text-muted opacity-60 mt-1">Supports Gmail / Outlook exports</div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-soft text-center px-2">{error}</div>
        )}

        <p className="text-xs text-text-muted text-center mt-4">
          Extracts service name, cost, and billing cycle — you confirm before saving
        </p>
      </div>
    </div>
  )
}
