// GENERATOR: INTEGRATIONS
// Integrations management page
// HOW TO RUN: npm run dev, visit http://localhost:3001/integrations

'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Sync orders, customers, and products from your Shopify store',
      status: 'disconnected',
      icon: '🛍️',
      configFields: [
        { key: 'store_url', label: 'Store URL', type: 'text', placeholder: 'your-store.myshopify.com' },
        { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter API key' },
        { key: 'api_secret', label: 'API Secret', type: 'password', placeholder: 'Enter API secret' },
      ],
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      description: 'Connect your WooCommerce store to sync e-commerce data',
      status: 'disconnected',
      icon: '🛒',
      configFields: [
        { key: 'store_url', label: 'Store URL', type: 'text', placeholder: 'https://yourstore.com' },
        { key: 'consumer_key', label: 'Consumer Key', type: 'text', placeholder: 'Enter consumer key' },
        { key: 'consumer_secret', label: 'Consumer Secret', type: 'password', placeholder: 'Enter consumer secret' },
      ],
    },
    {
      id: 'twilio',
      name: 'Twilio WhatsApp',
      description: 'Send and receive WhatsApp messages, track customer interactions',
      status: 'disconnected',
      icon: '💬',
      configFields: [
        { key: 'account_sid', label: 'Account SID', type: 'text', placeholder: 'Enter Account SID' },
        { key: 'auth_token', label: 'Auth Token', type: 'password', placeholder: 'Enter Auth Token' },
        { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text', placeholder: '+1234567890' },
      ],
    },
    {
      id: 'pos',
      name: 'POS System',
      description: 'Import offline sales data from your point-of-sale system',
      status: 'disconnected',
      icon: '🏪',
      configFields: [
        { key: 'api_endpoint', label: 'API Endpoint', type: 'text', placeholder: 'https://api.pos-system.com' },
        { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter API key' },
      ],
    },
  ])

  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [config, setConfig] = useState<Record<string, string>>({})

  const handleConnect = async (integrationId: string) => {
    // TODO: Implement actual API call to connect integration
    setIntegrations(prev => 
      prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'connected' as const }
          : int
      )
    )
    setSelectedIntegration(null)
    setConfig({})
  }

  const handleDisconnect = async (integrationId: string) => {
    // TODO: Implement actual API call to disconnect integration
    setIntegrations(prev => 
      prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'disconnected' as const }
          : int
      )
    )
  }

  const selected = integrations.find(i => i.id === selectedIntegration)

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Integrations</h1>
          <p>Connect and manage your platform integrations</p>
        </div>
        <Link href="/" className="btn btn-secondary">
          ← Back to Home
        </Link>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        marginBottom: '24px'
      }}>
        {integrations.map((integration) => (
          <div key={integration.id} className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{integration.icon}</span>
                <div>
                  <h3 style={{ margin: 0, marginBottom: '4px' }}>{integration.name}</h3>
                  <span className={`badge ${integration.status === 'connected' ? 'badge-success' : 'badge-info'}`}>
                    {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>
            </div>
            
            <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
              {integration.description}
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              {integration.status === 'connected' ? (
                <>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setSelectedIntegration(integration.id)}
                  >
                    Configure
                  </button>
                  <button
                    className="btn"
                    style={{ 
                      flex: 1, 
                      background: '#dc2626',
                      color: 'white'
                    }}
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  className="btn"
                  style={{ width: '100%' }}
                  onClick={() => setSelectedIntegration(integration.id)}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      {selectedIntegration && selected && (
        <div className="card" style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <h2 style={{ margin: 0 }}>
              Configure {selected.name}
            </h2>
            <button
              onClick={() => {
                setSelectedIntegration(null)
                setConfig({})
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              {selected.description}
            </p>

            {selected.configFields.map((field) => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px'
                }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={config[field.key] || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                setSelectedIntegration(null)
                setConfig({})
              }}
            >
              Cancel
            </button>
            <button
              className="btn"
              style={{ flex: 1 }}
              onClick={() => handleConnect(selected.id)}
            >
              {selected.status === 'connected' ? 'Update' : 'Connect'}
            </button>
          </div>
        </div>
      )}

      {/* Overlay */}
      {selectedIntegration && (
        <div
          onClick={() => {
            setSelectedIntegration(null)
            setConfig({})
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}

      <div className="card">
        <h2>Integration Status</h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Connect your e-commerce platforms, messaging services, and POS systems to create a unified view of your customers.
        </p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          <div className="stat-card">
            <div className="stat-value">
              {integrations.filter(i => i.status === 'connected').length}
            </div>
            <div className="stat-label">Connected</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {integrations.filter(i => i.status === 'disconnected').length}
            </div>
            <div className="stat-label">Available</div>
          </div>
        </div>
      </div>
    </div>
  )
}

