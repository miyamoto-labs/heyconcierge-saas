'use client'
import ReactMarkdown from 'react-markdown'

interface LegalPageProps {
  content: string
}

export default function LegalPage({ content }: LegalPageProps) {
  return (
    <article style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif" }}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#1A1A1A', fontSize: '2.5rem', fontWeight: 400, marginBottom: '0.5rem', lineHeight: 1.15 }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontFamily: "Inter, sans-serif", color: '#1A1A1A', fontSize: '1.1rem', fontWeight: 600, marginTop: '3rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E5E5E0' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontFamily: "Inter, sans-serif", color: '#2C2C2C', fontSize: '0.95rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ color: '#6B6B6B', lineHeight: 1.8, marginBottom: '1rem', fontSize: '0.95rem' }}>
              {children}
            </p>
          ),
          li: ({ children }) => (
            <li style={{ color: '#6B6B6B', lineHeight: 1.8, marginBottom: '0.3rem', fontSize: '0.95rem' }}>
              {children}
            </li>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }}>
              {children}
            </ol>
          ),
          a: ({ href, children }) => (
            <a href={href} style={{ color: '#4A5D23', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong style={{ color: '#2C2C2C', fontWeight: 600 }}>{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: '3px solid #4A5D23', paddingLeft: '1.25rem', margin: '1.5rem 0', color: '#6B6B6B', fontStyle: 'italic', background: '#F4F5EF', borderRadius: '0 8px 8px 0', padding: '1rem 1.25rem' }}>
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr style={{ border: 'none', borderTop: '1px solid #E5E5E0', margin: '2.5rem 0' }} />
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ textAlign: 'left', padding: '0.6rem 1rem', background: '#F4F5EF', color: '#2C2C2C', fontWeight: 600, borderBottom: '2px solid #E5E5E0' }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ padding: '0.6rem 1rem', color: '#6B6B6B', borderBottom: '1px solid #E5E5E0', verticalAlign: 'top' }}>
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code style={{ background: '#F4F5EF', color: '#4A5D23', padding: '0.15em 0.4em', borderRadius: '4px', fontSize: '0.875em', fontFamily: 'monospace' }}>
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
