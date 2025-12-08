// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Next.js app directory, API_URL in env
// HOW TO RUN: npm run dev, visit http://localhost:3001

'use client'

import Link from 'next/link'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <div className="container">
        {/* Professional Header */}
        <div className="relative" style={{ 
          marginBottom: '48px', 
          textAlign: 'center',
          borderBottom: '1px solid hsl(var(--border))',
          paddingBottom: '32px'
        }}>
          <div className="absolute top-0 right-0">
            <ThemeToggleButton variant="button" />
          </div>
          <h1 className="text-foreground" style={{ 
            fontSize: '42px', 
            fontWeight: '700', 
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>
            ConstIntel
          </h1>
          <p className="text-muted-foreground" style={{ 
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Unified Commerce Platform - Customer Intelligence & Omnichannel Analytics
          </p>
        </div>

        {/* Main Feature Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '28px', 
          marginBottom: '48px'
        }}>
          <Link href="/profiles" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ 
              cursor: 'pointer', 
              height: '100%',
              border: '1px solid hsl(var(--border))',
              transition: 'all 0.3s ease'
            }}>
              <div className="bg-muted" style={{ 
                fontSize: '40px', 
                marginBottom: '20px',
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                👥
              </div>
              <h2 className="text-foreground" style={{ 
                marginBottom: '12px',
                fontSize: '22px',
                fontWeight: '600'
              }}>
                Customer Profiles
              </h2>
              <p className="text-muted-foreground" style={{ 
                lineHeight: '1.7',
                fontSize: '15px',
                marginBottom: '20px'
              }}>
                View and manage comprehensive customer profiles with unified data from all channels. 
                Access 360-degree customer views, segmentation insights, and predictive analytics.
              </p>
              <div className="text-primary" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                fontWeight: '500',
                fontSize: '14px'
              }}>
                View Profiles →
              </div>
            </div>
          </Link>

          <Link href="/csv-upload" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ 
              cursor: 'pointer', 
              height: '100%',
              border: '1px solid hsl(var(--border))',
              transition: 'all 0.3s ease'
            }}>
              <div className="bg-muted" style={{ 
                fontSize: '40px', 
                marginBottom: '20px',
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                📄
              </div>
              <h2 className="text-foreground" style={{ 
                marginBottom: '12px',
                fontSize: '22px',
                fontWeight: '600'
              }}>
                CSV Upload
              </h2>
              <p className="text-muted-foreground" style={{ 
                lineHeight: '1.7',
                fontSize: '15px',
                marginBottom: '20px'
              }}>
                Import customer data from CSV files. Upload transaction history, customer attributes, 
                and behavioral data to enrich your customer intelligence platform.
              </p>
              <div className="text-primary" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                fontWeight: '500',
                fontSize: '14px'
              }}>
                Upload Data →
              </div>
            </div>
          </Link>

          <Link href="/integrations" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ 
              cursor: 'pointer', 
              height: '100%',
              border: '1px solid hsl(var(--border))',
              transition: 'all 0.3s ease'
            }}>
              <div className="bg-muted" style={{ 
                fontSize: '40px', 
                marginBottom: '20px',
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🔗
              </div>
              <h2 className="text-foreground" style={{ 
                marginBottom: '12px',
                fontSize: '22px',
                fontWeight: '600'
              }}>
                Integrations
              </h2>
              <p className="text-muted-foreground" style={{ 
                lineHeight: '1.7',
                fontSize: '15px',
                marginBottom: '20px'
              }}>
                Connect and manage integrations with external platforms. Sync data from e-commerce, 
                CRM, marketing tools, and other systems to create a unified customer view.
              </p>
              <div className="text-primary" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                fontWeight: '500',
                fontSize: '14px'
              }}>
                Manage Integrations →
              </div>
            </div>
          </Link>
        </div>

        {/* Department Dashboards Section */}
        <div className="card" style={{ 
          marginTop: '24px',
          border: '1px solid hsl(var(--border))'
        }}>
          <h2 className="text-foreground" style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid hsl(var(--border))'
          }}>
            Department Dashboards
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px'
          }}>
            <Link href="/crm/dashboard" className="btn btn-secondary" style={{ 
              textAlign: 'center', 
              display: 'block',
              padding: '16px 24px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}>
              👥 CRM Dashboard
            </Link>
            <Link href="/marketing/dashboard" className="btn btn-secondary" style={{ 
              textAlign: 'center', 
              display: 'block',
              padding: '16px 24px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}>
              📢 Marketing Dashboard
            </Link>
            <Link href="/analytics/dashboard" className="btn btn-secondary" style={{ 
              textAlign: 'center', 
              display: 'block',
              padding: '16px 24px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}>
              📊 Analytics Dashboard
            </Link>
            <Link href="/store/dashboard" className="btn btn-secondary" style={{ 
              textAlign: 'center', 
              display: 'block',
              padding: '16px 24px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}>
              🏪 Store Ops Dashboard
            </Link>
            <Link href="/inventory/dashboard" className="btn btn-secondary" style={{ 
              textAlign: 'center', 
              display: 'block',
              padding: '16px 24px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}>
              📦 Inventory Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
