// GENERATOR: INTEGRATIONS
// CSV Upload page with drag-and-drop interface
// HOW TO RUN: npm run dev, visit http://localhost:3001/csv-upload

'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

export default function CSVUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [delimiter, setDelimiter] = useState(',')
  const [defaultEventType, setDefaultEventType] = useState('csv_import')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile)
      setError(null)
      setResult(null)
    } else {
      setError('Please select a valid CSV file')
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile)
      setError(null)
      setResult(null)
    } else {
      setError('Please drop a valid CSV file')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const formData = new FormData()
      formData.append('file', file)
      formData.append('delimiter', delimiter)
      formData.append('default_event_type', defaultEventType)

      const response = await fetch(`${apiUrl}/api/integrations/csv/upload`, {
        method: 'POST',
        headers: {
          'x-brand-id': 'rhino-9918',
        },
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>CSV Import</h1>
          <p>Upload customer data from CSV files</p>
        </div>
        <Link href="/" className="btn btn-secondary">← Back to Home</Link>
      </div>

      <div className="card">
        <h2>Upload CSV File</h2>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: '2px dashed #667eea',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            background: file ? '#f0f4ff' : '#fafafa',
            cursor: 'pointer',
            transition: 'all 0.3s',
            marginBottom: '20px',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {file ? (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                {file.name}
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: '#fee',
                  color: '#c33',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📤</div>
              <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Drag & Drop CSV File
              </p>
              <p style={{ color: '#666' }}>or click to browse</p>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Delimiter
            </label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px',
              }}
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Default Event Type
            </label>
            <input
              type="text"
              value={defaultEventType}
              onChange={(e) => setDefaultEventType(e.target.value)}
              placeholder="csv_import"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn"
          style={{
            width: '100%',
            opacity: (!file || uploading) ? 0.6 : 1,
            cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </div>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="card" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
          <h2 style={{ color: '#166534' }}>✅ Upload Successful</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#10b981' }}>{result.processed}</div>
              <div className="stat-label">Rows Processed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#10b981' }}>{result.total}</div>
              <div className="stat-label">Total Rows</div>
            </div>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ marginBottom: '8px', color: '#dc2626' }}>Errors ({result.errors.length}):</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {result.errors.map((err: any, i: number) => (
                  <div key={i} style={{ padding: '8px', background: '#fee', borderRadius: '4px', marginBottom: '4px', fontSize: '14px' }}>
                    Row {err.row}: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2>CSV Format Guide</h2>
        <p style={{ marginBottom: '12px' }}>Your CSV file should include the following columns:</p>
        <div className="code-block" style={{ marginBottom: '12px' }}>
          phone,email,loyalty_id,event_type,total,timestamp,product_id,product_name,category
        </div>
        <p style={{ fontSize: '14px', color: '#666' }}>
          <strong>Required columns:</strong> phone or email (at least one)<br />
          <strong>Optional columns:</strong> loyalty_id, event_type, total, timestamp, product_id, product_name, category
        </p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '12px' }}>
          If your CSV has different column names, you can map them in the advanced options.
        </p>
      </div>
    </div>
  )
}

