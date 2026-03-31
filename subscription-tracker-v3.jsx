import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, Pencil, Trash2, ChevronDown, ChevronRight, Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'subscriptions-data-v9-clean-final';

//Mobile viewport
if (typeof document !== 'undefined' && !document.getElementById('mobile-meta')) {
  const meta = document.createElement('meta');
  meta.id = 'mobile-meta';
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
  document.head.appendChild(meta);
}

const SubscriptionTracker = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [designMode, setDesignMode] = useState('modern'); // 'modern' or 'brutalist'
  const [currency, setCurrency] = useState('USD');
  const [paymentMethods, setPaymentMethods] = useState([
    'Credit Card',
    'Debit Card',
    'UPI',
    'Net Banking',
    'PayPal',
    'Bank Transfer'
  ]);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await window.storage.get(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data.value);
          setSubscriptions(parsed.subscriptions || []);
          setDesignMode(parsed.designMode || 'modern');
          setCurrency(parsed.currency || 'USD');
          setPaymentMethods(parsed.paymentMethods || paymentMethods);
        } else {
          // Generate dummy data on first load
          setSubscriptions(generateDummyData());
        }
      } catch (error) {
        console.log('No saved data found, generating dummy data');
        setSubscriptions(generateDummyData());
      }
    };
    loadData();
  }, []);

  // Generate dummy data
  const generateDummyData = () => {
    const today = new Date();
    const tags = ['Work', 'Personal', 'Entertainment', 'Productivity', 'Design', 'Dev Tools', 'Music', 'Fitness', 'Learning', 'News'];
    const names = [
      'Netflix', 'Spotify', 'Adobe Creative Cloud', 'GitHub Pro', 'Figma Professional', 
      'ChatGPT Plus', 'Notion Team', 'Slack Pro', 'Zoom Business', 'Dropbox Plus',
      'Amazon Prime', 'Disney+ Hotstar', 'Apple Music', 'YouTube Premium', 'LinkedIn Premium',
      'Grammarly Premium', 'Canva Pro', 'Medium Membership', 'Audible', 'Skillshare',
      'The New York Times', 'The Economist', 'Calm Premium', 'Headspace Plus', 'Peloton Digital',
      'Microsoft 365', 'Atlassian Jira', 'Monday.com', 'Notion Personal'
    ];
    const paymentMethods = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'PayPal'];
    
    return names.map((name, idx) => {
      const isYearly = idx % 4 === 0;
      const currency = idx % 3 === 0 ? 'INR' : 'USD';
      const cycle = isYearly ? 'yearly' : (idx % 7 === 0 ? 'custom' : 'monthly');
      const baseCost = currency === 'USD' ? 
        (5 + Math.random() * 45).toFixed(2) : 
        (400 + Math.random() * 3000).toFixed(2);
      
      // Spread billing dates across the year, with concentration in current month
      let daysOffset;
      if (idx < 10) {
        // First 10 items due this month
        daysOffset = Math.floor(Math.random() * 28);
      } else {
        // Rest spread across the year
        daysOffset = Math.floor(Math.random() * 365);
      }
      
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 300));
      
      const nextBillingDate = new Date(today);
      nextBillingDate.setDate(nextBillingDate.getDate() + daysOffset);
      
      const randomTags = [];
      const numTags = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numTags; i++) {
        const tag = tags[Math.floor(Math.random() * tags.length)];
        if (!randomTags.includes(tag)) {
          randomTags.push(tag);
        }
      }
      
      const canceled = idx > 26 ? Math.random() > 0.7 : false;
      const paid = idx < 5 ? Math.random() > 0.5 : false;
      
      // Some subscriptions have limited cycles
      const hasCycleCount = idx % 5 === 0;
      const cycleCount = hasCycleCount ? Math.floor(Math.random() * 10) + 3 : null;
      
      // First 3 subscriptions have ACTIVE free trials (started recently)
      const hasFreeTrial = idx < 3;
      const trialDays = hasFreeTrial ? (14 + Math.floor(Math.random() * 17)) : null; // 14-30 days
      
      // Set trial start date to recent past so trials are currently active
      let trialStartDate = null;
      if (hasFreeTrial) {
        const trialStart = new Date(today);
        // Started 1-5 days ago, so there's plenty of time left
        trialStart.setDate(trialStart.getDate() - (1 + Math.floor(Math.random() * 5)));
        trialStartDate = trialStart.toISOString().split('T')[0];
      }

      // Last used dates (some zombies)
      const daysSinceUse = Math.floor(Math.random() * 60);
      const lastUsedDate = new Date(today);
      lastUsedDate.setDate(lastUsedDate.getDate() - daysSinceUse);
      
      // Annual pricing available for some
      const annualAvailable = idx % 3 === 0;
      const annualSavings = annualAvailable ? 0.15 + Math.random() * 0.15 : 0; // 15-30% savings
      const annualCost = annualAvailable ? (baseCost * 12 * (1 - annualSavings)).toFixed(2) : null;

      // Shared subscriptions
      const sharedWith = idx % 7 === 0 ? [
        { name: 'Family Member', amount: (baseCost / 2).toFixed(2), currency }
      ] : [];
      
      return {
        id: `sub-${Date.now()}-${idx}`,
        name,
        cost: baseCost,
        costCurrency: currency,
        cycle,
        customDays: cycle === 'custom' ? (Math.floor(Math.random() * 3) + 1) * 30 : '',
        startDate: startDate.toISOString().split('T')[0],
        nextBilling: nextBillingDate.toISOString(),
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        tags: randomTags,
        notes: '',
        canceled,
        paid,
        cycleCount,
        trialDays,
        trialStartDate,
        lastUsed: lastUsedDate.toISOString().split('T')[0],
        activelyUsing: daysSinceUse < 30,
        sharedWith,
        receiptUrl: null,
        previousCost: idx % 5 === 0 ? (baseCost * 0.9).toFixed(2) : null,
        annualAvailable,
        annualCost
      };
    });
  };

  const generateDummyTrials = () => {
    const today = new Date();
    const trialNames = [
      'Grammarly Business Trial',
      'Canva Teams Trial', 
      'Adobe Stock Trial',
      'Coursera Plus Trial',
      'Headspace Trial'
    ];

    return trialNames.map((name, idx) => {
      const daysRemaining = 7 + Math.floor(Math.random() * 23); // 7-30 days
      const endsOn = new Date(today);
      endsOn.setDate(endsOn.getDate() + daysRemaining);

      return {
        id: `trial-${Date.now()}-${idx}`,
        name,
        endsOn: endsOn.toISOString().split('T')[0],
        notes: ''
      };
    });
  };

  // Save data to storage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({
          subscriptions,
          designMode,
          currency,
          paymentMethods
        }));
      } catch (error) {
        console.log('Error saving data:', error);
      }
    };
    if (subscriptions.length > 0) {
      saveData();
    }
  }, [subscriptions, designMode, currency, paymentMethods]);

  const addSubscription = (sub) => {
    const newSub = {
      ...sub,
      id: Date.now().toString(),
      nextBilling: calculateNextBilling(sub.startDate, sub.cycle, sub.customDays)
    };
    setSubscriptions([...subscriptions, newSub]);
    setShowAddModal(false);
  };

  const updateSubscription = (updatedSub) => {
    setSubscriptions(subscriptions.map(s => 
      s.id === updatedSub.id ? {
        ...updatedSub,
        nextBilling: calculateNextBilling(updatedSub.startDate, updatedSub.cycle, updatedSub.customDays)
      } : s
    ));
    setEditingSub(null);
  };

  const deleteSubscription = (id) => {
    setSubscriptions(subscriptions.filter(s => s.id !== id));
  };

  const cancelSubscription = (id) => {
    setSubscriptions(subscriptions.map(s => 
      s.id === id ? { ...s, canceled: !s.canceled } : s
    ));
  };

  const markAsPaid = (id) => {
    setSubscriptions(subscriptions.map(s => 
      s.id === id ? { ...s, paid: !s.paid } : s
    ));
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Cost', 'Currency', 'Cycle', 'Next Billing', 'Payment Method', 'Tags', 'Status', 'Cycle Count', 'Trial Days'];
    const rows = subscriptions.map(sub => [
      sub.name,
      sub.cost,
      sub.costCurrency || 'USD',
      sub.cycle === 'custom' ? `every ${sub.customDays}d` : sub.cycle,
      new Date(sub.nextBilling).toLocaleDateString(),
      sub.paymentMethod || '',
      sub.tags ? sub.tags.join('; ') : '',
      sub.canceled ? 'Canceled' : (sub.paid ? 'Paid' : 'Active'),
      sub.cycleCount || '',
      sub.trialDays || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate cancelation impact

  const addPaymentMethod = (method) => {
    if (!paymentMethods.includes(method)) {
      setPaymentMethods([...paymentMethods, method]);
    }
  };

  const calculateNextBilling = (startDate, cycle, customDays) => {
    const start = new Date(startDate);
    const today = new Date();
    let nextBilling = new Date(start);

    if (cycle === 'monthly') {
      while (nextBilling <= today) {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }
    } else if (cycle === 'yearly') {
      while (nextBilling <= today) {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      }
    } else if (cycle === 'custom' && customDays) {
      const days = parseInt(customDays);
      while (nextBilling <= today) {
        nextBilling.setDate(nextBilling.getDate() + days);
      }
    }

    return nextBilling.toISOString();
  };

  const getDaysUntilRenewal = (nextBilling) => {
    const next = new Date(nextBilling);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);
    const diff = next - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const convertCurrency = (amount, from) => {
    const rate = 83.5;
    if (currency === 'USD' && from === 'INR') return amount / rate;
    if (currency === 'INR' && from === 'USD') return amount * rate;
    return amount;
  };

  const formatCurrency = (amount, from = 'USD') => {
    const converted = convertCurrency(parseFloat(amount) || 0, from);
    
    if (currency === 'USD') {
      // US format: comma every 3 digits from right (1,234,567.89)
      const parts = converted.toFixed(2).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `$${parts.join('.')}`;
    } else {
      // Indian format: first comma after 3 digits from right, then every 2 digits (12,34,567.89)
      const parts = converted.toFixed(2).split('.');
      let integerPart = parts[0];
      let lastThree = integerPart.slice(-3);
      let remaining = integerPart.slice(0, -3);
      if (remaining) {
        lastThree = ',' + lastThree;
        remaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      }
      return `₹${remaining}${lastThree}.${parts[1]}`;
    }
  };

  const groupByTag = () => {
    const grouped = {};
    subscriptions.forEach(sub => {
      if (sub.tags && sub.tags.length > 0) {
        sub.tags.forEach(tag => {
          const tagName = typeof tag === 'string' ? tag : tag;
          if (!grouped[tagName]) {
            grouped[tagName] = { subs: [] };
          }
          grouped[tagName].subs.push(sub);
        });
      } else {
        if (!grouped['Untagged']) {
          grouped['Untagged'] = { subs: [] };
        }
        grouped['Untagged'].subs.push(sub);
      }
    });
    return grouped;
  };

  const calculateAnalytics = () => {
    let monthlyTotal = 0;
    let yearlyTotal = 0;
    const byTag = {};

    subscriptions.filter(sub => !sub.canceled).forEach(sub => {
      const cost = parseFloat(sub.cost) || 0;
      const subCurrency = sub.costCurrency || 'USD';
      const convertedCost = convertCurrency(cost, subCurrency);
      
      let monthlyCost = 0;

      if (sub.cycle === 'monthly') {
        monthlyCost = convertedCost;
      } else if (sub.cycle === 'yearly') {
        monthlyCost = convertedCost / 12;
      } else if (sub.cycle === 'custom' && sub.customDays) {
        monthlyCost = (convertedCost / parseInt(sub.customDays)) * 30;
      }

      monthlyTotal += monthlyCost;
      yearlyTotal += monthlyCost * 12;

      if (sub.tags && sub.tags.length > 0) {
        sub.tags.forEach(tag => {
          const tagName = typeof tag === 'string' ? tag : tag;
          if (!byTag[tagName]) {
            byTag[tagName] = { amount: 0 };
          }
          byTag[tagName].amount += monthlyCost;
        });
      } else {
        if (!byTag['Untagged']) {
          byTag['Untagged'] = { amount: 0 };
        }
        byTag['Untagged'].amount += monthlyCost;
      }
    });

    return { monthlyTotal, yearlyTotal, byTag };
  };

  const getAllTags = () => {
    const tagSet = new Set();
    subscriptions.forEach(sub => {
      if (sub.tags && sub.tags.length > 0) {
        sub.tags.forEach(tag => {
          const tagName = typeof tag === 'string' ? tag : tag;
          tagSet.add(tagName);
        });
      }
    });
    return Array.from(tagSet).sort();
  };

  const theme = {
    modern: {
      bg: '#0a0a0a',
      cardBg: '#111',
      text: '#e8e8e8',
      textSecondary: '#666',
      border: '#222',
      borderHover: '#444',
      buttonBg: '#fff',
      buttonText: '#000',
      buttonSecondaryBg: 'transparent',
      buttonSecondaryText: '#999',
      inputBg: '#111',
      urgent: '#ff4444',
      // Design specific
      borderRadius: '8px',
      borderWidth: '1px',
      shadow: 'none',
      fontWeight: '600'
    },
    brutalist: {
      bg: '#0a0a0a',
      cardBg: '#111',
      text: '#e8e8e8',
      textSecondary: '#666',
      border: '#222',
      borderHover: '#444',
      buttonBg: '#fff',
      buttonText: '#000',
      buttonSecondaryBg: 'transparent',
      buttonSecondaryText: '#999',
      inputBg: '#111',
      urgent: '#ff4444',
      // Design specific - neo-brutalism
      borderRadius: '0px',
      borderWidth: '3px',
      shadow: '4px 4px 0px #222',
      fontWeight: '900'
    }
  };

  const colors = theme[designMode];
  const isBrutalist = designMode === 'brutalist';

  return (
    <div style={{ 
      fontFamily: isBrutalist ? '"Space Grotesk", "Arial Black", sans-serif' : '"Google Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '40px 20px',
      minHeight: '100vh',
      background: colors.bg,
      color: colors.text,
      transition: 'none'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          borderBottom: `${colors.borderWidth} solid ${colors.border}`,
          paddingBottom: '20px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              fontSize: '32px', 
              lineHeight: '1',
              transform: isBrutalist ? 'rotate(-5deg)' : 'none'
            }}>🔥</div>
            <h1 style={{ 
              fontSize: isBrutalist ? '28px' : '24px',
              fontWeight: colors.fontWeight,
              margin: 0,
              letterSpacing: isBrutalist ? '0.05em' : '-0.02em',
              transform: isBrutalist ? 'skew(-2deg)' : 'none',
              textTransform: isBrutalist ? 'uppercase' : 'none'
            }}>MY BURN</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrency(currency === 'USD' ? 'INR' : 'USD')}
              style={{
                background: colors.buttonSecondaryBg,
                color: colors.buttonSecondaryText,
                border: `${colors.borderWidth} solid ${colors.border}`,
                borderRadius: colors.borderRadius,
                padding: isBrutalist ? '10px 18px' : '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: colors.fontWeight,
                boxShadow: isBrutalist ? colors.shadow : 'none',
                transform: isBrutalist ? 'translate(0, 0)' : 'none',
                transition: isBrutalist ? 'none' : 'all 0.2s'
              }}
              onMouseDown={(e) => {
                if (isBrutalist) {
                  e.currentTarget.style.transform = 'translate(4px, 4px)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              onMouseUp={(e) => {
                if (isBrutalist) {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = colors.shadow;
                }
              }}
            >
              {currency === 'USD' ? '$ USD' : '₹ INR'}
            </button>
            <button
              onClick={() => setDesignMode(designMode === 'modern' ? 'brutalist' : 'modern')}
              style={{
                background: colors.buttonSecondaryBg,
                color: colors.buttonSecondaryText,
                border: `${colors.borderWidth} solid ${colors.border}`,
                borderRadius: colors.borderRadius,
                padding: isBrutalist ? '10px' : '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '20px',
                boxShadow: isBrutalist ? colors.shadow : 'none',
                transform: isBrutalist ? 'translate(0, 0)' : 'none',
                transition: isBrutalist ? 'none' : 'all 0.2s'
              }}
              onMouseDown={(e) => {
                if (isBrutalist) {
                  e.currentTarget.style.transform = 'translate(4px, 4px)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              onMouseUp={(e) => {
                if (isBrutalist) {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = colors.shadow;
                }
              }}
              title={designMode === 'modern' ? 'Switch to Brutalist' : 'Switch to Modern'}
            >
              {designMode === 'modern' ? '🎨' : '✨'}
            </button>
            <button
              onClick={exportToCSV}
              style={{
                background: colors.buttonSecondaryBg,
                color: colors.buttonSecondaryText,
                border: `${colors.borderWidth} solid ${colors.border}`,
                borderRadius: colors.borderRadius,
                padding: isBrutalist ? '10px 18px' : '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: colors.fontWeight,
                boxShadow: isBrutalist ? colors.shadow : 'none',
                transform: isBrutalist ? 'translate(0, 0)' : 'none',
                transition: isBrutalist ? 'none' : 'all 0.2s'
              }}
              onMouseDown={(e) => {
                if (isBrutalist) {
                  e.currentTarget.style.transform = 'translate(4px, 4px)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              onMouseUp={(e) => {
                if (isBrutalist) {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = colors.shadow;
                }
              }}
            >
              EXPORT CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: colors.buttonBg,
                color: colors.buttonText,
                border: isBrutalist ? `${colors.borderWidth} solid ${colors.border}` : 'none',
                borderRadius: colors.borderRadius,
                padding: isBrutalist ? '10px 18px' : '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: colors.fontWeight,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isBrutalist ? colors.shadow : 'none',
                transform: isBrutalist ? 'translate(0, 0)' : 'none',
                transition: isBrutalist ? 'none' : 'all 0.2s'
              }}
              onMouseDown={(e) => {
                if (isBrutalist) {
                  e.currentTarget.style.transform = 'translate(4px, 4px)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              onMouseUp={(e) => {
                if (isBrutalist) {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = colors.shadow;
                }
              }}
            >
              <Plus size={16} /> ADD
            </button>
          </div>
        </div>

        <AnalyticsView 
          calculateAnalytics={calculateAnalytics}
          subscriptions={subscriptions}
          colors={colors}
          formatCurrency={formatCurrency}
          isBrutalist={isBrutalist}
        />

        <ListView
          groupByTag={groupByTag}
          setEditingSub={setEditingSub}
          cancelSubscription={cancelSubscription}
          markAsPaid={markAsPaid}
          deleteSubscription={deleteSubscription}
          getDaysUntilRenewal={getDaysUntilRenewal}
          colors={colors}
          formatCurrency={formatCurrency}
          subscriptions={subscriptions}
          isBrutalist={isBrutalist}
        />

        {(showAddModal || editingSub) && (
          <SubscriptionModal
            sub={editingSub}
            paymentMethods={paymentMethods}
            allTags={getAllTags()}
            onSave={editingSub ? updateSubscription : addSubscription}
            onClose={() => {
              setShowAddModal(false);
              setEditingSub(null);
            }}
            addPaymentMethod={addPaymentMethod}
            colors={colors}
            isBrutalist={isBrutalist}
          />
        )}
      </div>
    </div>
  );
};

const AnalyticsView = ({ calculateAnalytics, subscriptions, colors, formatCurrency, isBrutalist }) => {
  const { monthlyTotal, yearlyTotal, byTag } = calculateAnalytics();
  const tagEntries = Object.entries(byTag).sort((a, b) => b[1].amount - a[1].amount);
  const [selectedTag, setSelectedTag] = useState(tagEntries.length > 0 ? tagEntries[0][0] : '');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currencySymbol = formatCurrency(0).charAt(0);

  const selectedTagData = byTag[selectedTag];
  const selectedTagYearly = selectedTagData ? selectedTagData.amount * 12 : 0;

  const cardStyle = {
    background: colors.cardBg,
    border: `${colors.borderWidth} solid ${colors.border}`,
    borderRadius: colors.borderRadius,
    padding: isBrutalist ? '16px' : '14px',
    boxShadow: isBrutalist ? colors.shadow : 'none',
    transform: isBrutalist ? 'rotate(-0.5deg)' : 'none'
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isBrutalist ? '16px' : '12px', marginBottom: '12px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: colors.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: isBrutalist ? '0.1em' : '0.05em', fontWeight: isBrutalist ? '900' : '400' }}>
            Monthly Recurring
          </div>
          <div style={{ fontSize: isBrutalist ? '26px' : '24px', fontWeight: isBrutalist ? '900' : '700', fontVariantNumeric: 'tabular-nums' }}>
            {currencySymbol}{monthlyTotal.toFixed(2)}
          </div>
        </div>
        <div style={{...cardStyle, transform: isBrutalist ? 'rotate(0.5deg)' : 'none'}}>
          <div style={{ fontSize: '10px', color: colors.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: isBrutalist ? '0.1em' : '0.05em', fontWeight: isBrutalist ? '900' : '400' }}>
            Yearly Total
          </div>
          <div style={{ fontSize: isBrutalist ? '26px' : '24px', fontWeight: isBrutalist ? '900' : '700', fontVariantNumeric: 'tabular-nums' }}>
            {currencySymbol}{yearlyTotal.toFixed(2)}
          </div>
        </div>
        <div style={{...cardStyle, transform: isBrutalist ? 'rotate(-0.3deg)' : 'none'}}>
          <div style={{ fontSize: '10px', color: colors.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: isBrutalist ? '0.1em' : '0.05em', fontWeight: isBrutalist ? '900' : '400' }}>
            Active Subscriptions
          </div>
          <div style={{ fontSize: isBrutalist ? '26px' : '24px', fontWeight: isBrutalist ? '900' : '700', fontVariantNumeric: 'tabular-nums' }}>
            {subscriptions.filter(s => !s.canceled).length}
          </div>
        </div>
        <div style={{...cardStyle, transform: isBrutalist ? 'rotate(0.7deg)' : 'none', position: 'relative' }}>
          <div style={{ fontSize: '10px', color: colors.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tag Spending
          </div>
          {tagEntries.length > 0 ? (
            <>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ flex: 1 }}>{selectedTag}</span>
                <ChevronDown size={12} />
              </button>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  marginTop: '4px',
                  zIndex: 100,
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {tagEntries.map(([tag, data]) => (
                    <div
                      key={tag}
                      onClick={() => {
                        setSelectedTag(tag);
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        background: tag === selectedTag ? colors.border : 'transparent',
                        fontSize: '11px'
                      }}
                      onMouseEnter={(e) => {
                        if (tag !== selectedTag) e.currentTarget.style.background = colors.border;
                      }}
                      onMouseLeave={(e) => {
                        if (tag !== selectedTag) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '14px', fontWeight: '600', fontVariantNumeric: 'tabular-nums', marginBottom: '2px' }}>
                {currencySymbol}{(selectedTagData?.amount || 0).toFixed(2)}/mo
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                {currencySymbol}{selectedTagYearly.toFixed(2)}/yr
              </div>
            </>
          ) : (
            <div style={{ fontSize: '14px', color: colors.textSecondary }}>—</div>
          )}
        </div>
      </div>
    </div>
  );
};

const ListView = ({ groupByTag, setEditingSub, cancelSubscription, markAsPaid, deleteSubscription, getDaysUntilRenewal, colors, formatCurrency, subscriptions, isBrutalist }) => {
  const [viewMode, setViewMode] = useState('dueThisMonth');
  const [collapsedTags, setCollapsedTags] = useState(new Set());
  const grouped = groupByTag();

  const toggleTag = (tag) => {
    const newCollapsed = new Set(collapsedTags);
    if (newCollapsed.has(tag)) {
      newCollapsed.delete(tag);
    } else {
      newCollapsed.add(tag);
    }
    setCollapsedTags(newCollapsed);
  };

  const sortedByBilling = [...subscriptions]
    .map(sub => ({
      ...sub,
      daysUntil: getDaysUntilRenewal(sub.nextBilling)
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Get active free trials
  const getActiveTrials = () => {
    const today = new Date();
    return subscriptions
      .filter(sub => {
        if (!sub.trialDays || !sub.trialStartDate) return false;
        const trialStart = new Date(sub.trialStartDate);
        const daysSinceStart = Math.floor((today - trialStart) / (1000 * 60 * 60 * 24));
        return daysSinceStart < sub.trialDays;
      })
      .map(sub => ({
        ...sub,
        daysUntil: getDaysUntilRenewal(sub.nextBilling),
        trialDaysRemaining: (() => {
          const trialStart = new Date(sub.trialStartDate);
          const daysSinceStart = Math.floor((today - trialStart) / (1000 * 60 * 60 * 24));
          return sub.trialDays - daysSinceStart;
        })()
      }))
      .sort((a, b) => a.trialDaysRemaining - b.trialDaysRemaining);
  };

  // Get subscriptions due this month
  const getDueThisMonth = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const yearly = [];
    const monthly = [];
    const custom = [];
    
    subscriptions.forEach(sub => {
      const billingDate = new Date(sub.nextBilling);
      if (billingDate.getMonth() === currentMonth && billingDate.getFullYear() === currentYear) {
        const withDays = { ...sub, daysUntil: getDaysUntilRenewal(sub.nextBilling) };
        if (sub.cycle === 'yearly') {
          yearly.push(withDays);
        } else if (sub.cycle === 'monthly') {
          monthly.push(withDays);
        } else {
          custom.push(withDays);
        }
      }
    });
    
    yearly.sort((a, b) => a.daysUntil - b.daysUntil);
    monthly.sort((a, b) => a.daysUntil - b.daysUntil);
    custom.sort((a, b) => a.daysUntil - b.daysUntil);
    
    return { yearly, monthly, custom };
  };

  const renderSubscriptionCard = (sub, showDate = false) => {
    const daysUntil = sub.daysUntil !== undefined ? sub.daysUntil : getDaysUntilRenewal(sub.nextBilling);
    const isUrgent = daysUntil <= 7;
    const isCanceled = sub.canceled;
    const isPaid = sub.paid;

    const borderColor = isCanceled ? colors.textSecondary : (isPaid ? '#10b981' : (isUrgent ? colors.urgent : colors.border));

    return (
      <div
        key={sub.id}
        style={{
          background: colors.cardBg,
          border: `${colors.borderWidth} solid ${borderColor}`,
          borderRadius: colors.borderRadius,
          padding: isBrutalist ? '14px' : '12px',
          display: 'grid',
          gridTemplateColumns: showDate ? '70px 1fr auto auto' : '1fr auto auto',
          gap: isBrutalist ? '14px' : '12px',
          alignItems: 'center',
          transition: isBrutalist ? 'none' : 'all 0.2s',
          opacity: isCanceled ? 0.5 : 1,
          boxShadow: isBrutalist ? colors.shadow : 'none',
          transform: isBrutalist ? `rotate(${Math.random() * 1 - 0.5}deg)` : 'none'
        }}
      >
        {showDate && (
          <div style={{ textAlign: 'center', paddingRight: '12px', borderRight: `${colors.borderWidth} solid ${colors.border}` }}>
            <div style={{ fontSize: isBrutalist ? '22px' : '20px', fontWeight: isBrutalist ? '900' : '700', lineHeight: '1' }}>
              {new Date(sub.nextBilling).getDate()}
            </div>
            <div style={{ fontSize: '10px', color: colors.textSecondary, textTransform: 'uppercase', marginTop: '2px', fontWeight: isBrutalist ? '900' : '400' }}>
              {new Date(sub.nextBilling).toLocaleString('default', { month: 'short' })}
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '3px', textDecoration: isCanceled ? 'line-through' : 'none' }}>
            {sub.name}
            {isPaid && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#10b981', fontWeight: '600' }}>✓ PAID</span>}
          </div>
          <div style={{ fontSize: '10px', color: colors.textSecondary, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {sub.paymentMethod && <span>{sub.paymentMethod}</span>}
            {(() => {
              // Calculate if trial is still active
              const isTrialActive = sub.trialDays && sub.trialStartDate ? (() => {
                const trialStart = new Date(sub.trialStartDate);
                const today = new Date();
                const daysSinceStart = Math.floor((today - trialStart) / (1000 * 60 * 60 * 24));
                return daysSinceStart < sub.trialDays;
              })() : false;

              const trialDaysRemaining = isTrialActive ? (() => {
                const trialStart = new Date(sub.trialStartDate);
                const today = new Date();
                const daysSinceStart = Math.floor((today - trialStart) / (1000 * 60 * 60 * 24));
                return sub.trialDays - daysSinceStart;
              })() : 0;

              return (
                <>
                  {isTrialActive && (
                    <span style={{ 
                      background: '#ffd700',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: '600'
                    }}>
                      FREE TRIAL ({trialDaysRemaining}d left)
                    </span>
                  )}
                  {/* Price Increase Indicator */}
                  {sub.previousCost && parseFloat(sub.previousCost) < parseFloat(sub.cost) && (
                    <span style={{ 
                      background: '#ffa500' + '30',
                      color: '#ffa500',
                      padding: '2px 6px',
                      borderRadius: isBrutalist ? '0px' : '4px',
                      fontSize: '9px',
                      fontWeight: '700'
                    }}>
                      ↗ +{(((parseFloat(sub.cost) - parseFloat(sub.previousCost)) / parseFloat(sub.previousCost)) * 100).toFixed(0)}%
                    </span>
                  )}
                  {/* Shared Subscription Indicator */}
                  {sub.sharedWith && sub.sharedWith.length > 0 && (
                    <span style={{ 
                      background: '#10b981' + '30',
                      color: '#10b981',
                      padding: '2px 6px',
                      borderRadius: isBrutalist ? '0px' : '4px',
                      fontSize: '9px',
                      fontWeight: '700'
                    }}>
                      👥 {sub.sharedWith.length}
                    </span>
                  )}
                  {sub.tags && sub.tags.length > 0 && sub.tags.map((tag, idx) => {
                    const tagName = typeof tag === 'string' ? tag : tag;
                    return (
                      <span key={idx} style={{ 
                        background: colors.border,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '9px'
                      }}>
                        {tagName}
                      </span>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>
            {formatCurrency(sub.cost, sub.costCurrency || 'USD')}
          </div>
          <div style={{ fontSize: '10px', color: colors.textSecondary }}>
            {sub.cycle === 'custom' ? `every ${sub.customDays}d` : sub.cycle}
            {sub.cycleCount && (
              <span style={{ marginLeft: '4px', color: '#ffa500' }}>
                ({sub.cycleCount} {sub.cycle === 'yearly' ? 'yrs' : sub.cycle === 'monthly' ? 'mos' : 'cycles'})
              </span>
            )}
          </div>
          <div style={{ fontSize: '10px', color: isUrgent ? colors.urgent : colors.textSecondary, marginTop: '2px' }}>
            {isCanceled ? 'Canceled' : (daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil}d`)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setEditingSub(sub)}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              color: colors.textSecondary,
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => markAsPaid(sub.id)}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              color: isPaid ? '#10b981' : colors.textSecondary,
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '10px',
              fontWeight: '600'
            }}
            title={isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
          >
            {isPaid ? '✓' : 'P'}
          </button>
          <button
            onClick={() => cancelSubscription(sub.id)}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              color: isCanceled ? colors.text : '#ffa500',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '10px',
              fontWeight: '600'
            }}
            title={isCanceled ? 'Reactivate' : 'Cancel'}
          >
            {isCanceled ? 'R' : 'C'}
          </button>
          <button
            onClick={() => deleteSubscription(sub.id)}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              color: colors.urgent,
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  const dueThisMonth = getDueThisMonth();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('dueThisMonth')}
            style={{
              background: viewMode === 'dueThisMonth' ? colors.buttonBg : colors.buttonSecondaryBg,
              color: viewMode === 'dueThisMonth' ? colors.buttonText : colors.buttonSecondaryText,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'inherit',
              fontWeight: '600'
            }}
          >
            DUE THIS MONTH
          </button>
          <button
            onClick={() => setViewMode('freeTrials')}
            style={{
              background: viewMode === 'freeTrials' ? '#ffd700' : 'transparent',
              color: viewMode === 'freeTrials' ? '#000' : colors.text,
              border: `1px solid #ffd700`,
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'inherit',
              fontWeight: '600'
            }}
          >
            FREE TRIALS
          </button>
          <button
            onClick={() => setViewMode('tags')}
            style={{
              background: viewMode === 'tags' ? colors.buttonBg : colors.buttonSecondaryBg,
              color: viewMode === 'tags' ? colors.buttonText : colors.buttonSecondaryText,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'inherit',
              fontWeight: '600'
            }}
          >
            BY TAGS
          </button>
          <button
            onClick={() => setViewMode('billing')}
            style={{
              background: viewMode === 'billing' ? colors.buttonBg : colors.buttonSecondaryBg,
              color: viewMode === 'billing' ? colors.buttonText : colors.buttonSecondaryText,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'inherit',
              fontWeight: '600'
            }}
          >
            BY BILLING DATE
          </button>
        </div>
      </div>

      {viewMode === 'dueThisMonth' ? (
        <div>
          {dueThisMonth.yearly.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textSecondary }}>
                Yearly ({dueThisMonth.yearly.length})
              </h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {dueThisMonth.yearly.map(sub => renderSubscriptionCard(sub, true))}
              </div>
            </div>
          )}
          {dueThisMonth.monthly.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textSecondary }}>
                Monthly ({dueThisMonth.monthly.length})
              </h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {dueThisMonth.monthly.map(sub => renderSubscriptionCard(sub, true))}
              </div>
            </div>
          )}
          {dueThisMonth.custom.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textSecondary }}>
                Custom ({dueThisMonth.custom.length})
              </h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {dueThisMonth.custom.map(sub => renderSubscriptionCard(sub, true))}
              </div>
            </div>
          )}
          {dueThisMonth.yearly.length === 0 && dueThisMonth.monthly.length === 0 && dueThisMonth.custom.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
              No subscriptions due this month
            </div>
          )}
        </div>
      ) : viewMode === 'freeTrials' ? (
        <div>
          {(() => {
            const activeTrials = getActiveTrials();
            if (activeTrials.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
                  No active free trials
                </div>
              );
            }
            return (
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textSecondary }}>
                  Active Free Trials ({activeTrials.length})
                </h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {activeTrials.map(sub => renderSubscriptionCard(sub, false))}
                </div>
              </div>
            );
          })()}
        </div>
      ) : viewMode === 'tags' ? (
        <div>
          {Object.entries(grouped).map(([tag, data]) => (
            <div key={tag} style={{ marginBottom: '24px' }}>
              <div
                onClick={() => toggleTag(tag)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 0',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${colors.border}`,
                  marginBottom: '12px'
                }}
              >
                {collapsedTags.has(tag) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textSecondary }}>
                  {tag}
                </span>
                <span style={{ fontSize: '12px', color: colors.textSecondary, opacity: 0.6 }}>({data.subs.length})</span>
              </div>
              {!collapsedTags.has(tag) && (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {data.subs.map(sub => renderSubscriptionCard(sub, false))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : viewMode === 'billing' ? (
        <div style={{ display: 'grid', gap: '8px' }}>
          {sortedByBilling.map(sub => renderSubscriptionCard(sub, true))}
        </div>
      ) : null}
    </div>
  );
};

const SubscriptionModal = ({ sub, paymentMethods, allTags, onSave, onClose, addPaymentMethod, colors, isBrutalist }) => {
  const [formData, setFormData] = useState(sub || {
    name: '',
    cost: '',
    costCurrency: 'USD',
    cycle: 'monthly',
    customDays: '',
    startDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    tags: [],
    notes: '',
    canceled: false,
    paid: false,
    cycleCount: null,
    trialDays: null,
    trialStartDate: null,
    lastUsed: null,
    activelyUsing: true,
    sharedWith: [],
    receiptUrl: null,
    previousCost: null,
    annualAvailable: false,
    annualCost: null
  });

  const [newTag, setNewTag] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [showNewPaymentInput, setShowNewPaymentInput] = useState(false);
  const [cycleDropdownOpen, setCycleDropdownOpen] = useState(false);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.cost) return;
    onSave(formData);
  };

  const addTag = (tagName) => {
    const tag = tagName.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleAddNewPaymentMethod = () => {
    if (newPaymentMethod.trim()) {
      addPaymentMethod(newPaymentMethod.trim());
      setFormData({ ...formData, paymentMethod: newPaymentMethod.trim() });
      setNewPaymentMethod('');
      setShowNewPaymentInput(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 1000
    }}>
      <div style={{
        background: colors.bg,
        border: `${colors.borderWidth} solid ${colors.border}`,
        borderRadius: colors.borderRadius,
        padding: isBrutalist ? '28px' : '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: isBrutalist ? '8px 8px 0px #222' : 'none',
        transform: isBrutalist ? 'rotate(-1deg)' : 'none'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            {sub ? 'Edit Subscription' : 'Add Subscription'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
                Cost *
              </label>
              <input
                type="text"
                value={formData.cost}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers and decimal point
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, cost: value });
                  }
                }}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
                Currency
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, costCurrency: formData.costCurrency === 'USD' ? 'INR' : 'USD' })}
                style={{
                  width: '70px',
                  padding: '8px',
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {formData.costCurrency === 'USD' ? '$' : '₹'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
                Billing Cycle
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setCycleDropdownOpen(!cycleDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{formData.cycle === 'monthly' ? 'Monthly' : formData.cycle === 'yearly' ? 'Yearly' : 'Custom'}</span>
                  <ChevronDown size={14} />
                </button>
                {cycleDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    marginTop: '2px',
                    zIndex: 100
                  }}>
                    {['monthly', 'yearly', 'custom'].map(cycle => (
                      <div
                        key={cycle}
                        onClick={() => {
                          setFormData({ ...formData, cycle });
                          setCycleDropdownOpen(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          background: formData.cycle === cycle ? colors.border : 'transparent',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.cycle !== cycle) e.currentTarget.style.background = colors.border;
                        }}
                        onMouseLeave={(e) => {
                          if (formData.cycle !== cycle) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {cycle === 'monthly' ? 'Monthly' : cycle === 'yearly' ? 'Yearly' : 'Custom'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
                Count
              </label>
              <input
                type="number"
                min="1"
                value={formData.cycleCount || ''}
                onChange={(e) => setFormData({ ...formData, cycleCount: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="∞"
                style={{
                  width: '70px',
                  padding: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  textAlign: 'center'
                }}
              />
            </div>
          </div>

          {formData.cycle === 'custom' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
                Days
              </label>
              <input
                type="number"
                value={formData.customDays}
                onChange={(e) => setFormData({ ...formData, customDays: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
              Free Trial (Optional)
            </label>
            <div style={{ fontSize: '11px', color: colors.textSecondary, marginBottom: '6px', opacity: 0.8 }}>
              Number of days for free trial. Auto-adds "Free Trial" tag (yellow). Tag auto-removes when trial ends.
            </div>
            <input
              type="number"
              min="1"
              value={formData.trialDays || ''}
              onChange={(e) => {
                const days = e.target.value ? parseInt(e.target.value) : null;
                setFormData({ 
                  ...formData, 
                  trialDays: days,
                  trialStartDate: days ? formData.startDate : null
                });
              }}
              placeholder="Leave empty for no trial"
              style={{
                width: '100%',
                padding: '8px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
              Payment Method
            </label>
            {!showNewPaymentInput ? (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: formData.paymentMethod ? colors.text : colors.textSecondary,
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{formData.paymentMethod || 'Select...'}</span>
                  <ChevronDown size={14} />
                </button>
                {paymentDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    marginTop: '2px',
                    zIndex: 100,
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {paymentMethods.map(method => (
                      <div
                        key={method}
                        onClick={() => {
                          setFormData({ ...formData, paymentMethod: method });
                          setPaymentDropdownOpen(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          background: formData.paymentMethod === method ? colors.border : 'transparent',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.paymentMethod !== method) e.currentTarget.style.background = colors.border;
                        }}
                        onMouseLeave={(e) => {
                          if (formData.paymentMethod !== method) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {method}
                      </div>
                    ))}
                    <div
                      style={{
                        borderTop: `1px solid ${colors.border}`,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        background: 'transparent',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: colors.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => {
                        setShowNewPaymentInput(true);
                        setPaymentDropdownOpen(false);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = colors.border}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Plus size={14} /> Add New
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  placeholder="New payment method"
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNewPaymentMethod}
                  style={{
                    padding: '8px 12px',
                    background: colors.buttonBg,
                    color: colors.buttonText,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewPaymentInput(false);
                    setNewPaymentMethod('');
                  }}
                  style={{
                    padding: '8px',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.textSecondary,
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
              Tags
            </label>
            <div style={{ marginBottom: '8px', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.textSecondary,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Select or type new tag</span>
                <ChevronDown size={14} />
              </button>
              {tagDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  marginTop: '2px',
                  zIndex: 100,
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  <div style={{ padding: '8px' }}>
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(newTag);
                          setTagDropdownOpen(false);
                        }
                      }}
                      placeholder="Type new tag name"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        background: colors.inputBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        color: colors.text,
                        fontSize: '12px',
                        fontFamily: 'inherit'
                      }}
                      autoFocus
                    />
                  </div>
                  {allTags.length > 0 && (
                    <>
                      <div style={{ borderTop: `1px solid ${colors.border}`, padding: '4px 8px', fontSize: '10px', color: colors.textSecondary, textTransform: 'uppercase' }}>
                        Existing Tags
                      </div>
                      {allTags.map(tag => (
                        <div
                          key={tag}
                          onClick={() => {
                            addTag(tag);
                            setTagDropdownOpen(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            background: formData.tags.includes(tag) ? colors.border : 'transparent',
                            fontSize: '13px',
                            opacity: formData.tags.includes(tag) ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!formData.tags.includes(tag)) e.currentTarget.style.background = colors.border;
                          }}
                          onMouseLeave={(e) => {
                            if (!formData.tags.includes(tag)) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {tag} {formData.tags.includes(tag) && '✓'}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {formData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    background: colors.border,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: colors.text,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      opacity: 0.7
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Previous Cost */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
              Previous Price (Optional)
            </label>
            <input
              type="text"
              value={formData.previousCost || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setFormData({ ...formData, previousCost: val });
              }}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '8px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Shared With */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
              Shared Subscription (Optional)
            </label>
            {formData.sharedWith && formData.sharedWith.map((share, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={share.name}
                  onChange={(e) => {
                    const newShared = [...formData.sharedWith];
                    newShared[idx].name = e.target.value;
                    setFormData({ ...formData, sharedWith: newShared });
                  }}
                  style={{
                    flex: 2,
                    padding: '8px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
                <input
                  type="text"
                  placeholder="Amount"
                  value={share.amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    const newShared = [...formData.sharedWith];
                    newShared[idx].amount = val;
                    setFormData({ ...formData, sharedWith: newShared });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  onClick={() => {
                    const newShared = formData.sharedWith.filter((_, i) => i !== idx);
                    setFormData({ ...formData, sharedWith: newShared });
                  }}
                  style={{
                    background: colors.urgent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newShared = [...(formData.sharedWith || []), { name: '', amount: '', currency: formData.costCurrency || 'USD' }];
                setFormData({ ...formData, sharedWith: newShared });
              }}
              style={{
                background: colors.buttonSecondaryBg,
                color: colors.buttonSecondaryText,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              + Add Person
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.textSecondary,
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                background: colors.buttonBg,
                color: colors.buttonText,
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: '600'
              }}
            >
              {sub ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Insights Navigation Component
export default SubscriptionTracker;
