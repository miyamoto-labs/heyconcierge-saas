'use client'
import ReactMarkdown from 'react-markdown'

interface LegalPageProps {
  content: string
}

export default function LegalPage({ content }: LegalPageProps) {
  return (
    <article style={{ fontFamily: "'Quicksand', sans-serif" }}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontFamily: "'Nunito', sans-serif", color: '#2D2B55', fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1.2 }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontFamily: "'Nunito', sans-serif", color: '#2D2B55', fontSize: '1.25rem', fontWeight: 800, marginTop: '3rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(108,92,231,0.12)' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontFamily: "'Nunito', sans-serif", color: '#2D2B55', fontSize: '1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ color: 'rgba(45,43,85,0.75)', lineHeight: 1.8, marginBottom: '1rem', fontSize: '0.95rem' }}>
              {children}
            </p>
          ),
          li: ({ children }) => (
            <li style={{ color: 'rgba(45,43,85,0.75)', lineHeight: 1.8, marginBottom: '0.3rem', fontSize: '0.95rem' }}>
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
            <a href={href} style={{ color: '#6C5CE7', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong style={{ color: '#2D2B55', fontWeight: 700 }}>{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: '3px solid #6C5CE7', paddingLeft: '1.25rem', margin: '1.5rem 0', color: 'rgba(45,43,85,0.6)', fontStyle: 'italic', background: 'rgba(108,92,231,0.04)', borderRadius: '0 8px 8px 0', padding: '1rem 1.25rem' }}>
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr style={{ border: 'none', borderTop: '1px solid rgba(108,92,231,0.12)', margin: '2.5rem 0' }} />
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ textAlign: 'left', padding: '0.6rem 1rem', background: 'rgba(108,92,231,0.08)', color: '#2D2B55', fontWeight: 700, borderBottom: '2px solid rgba(108,92,231,0.15)' }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ padding: '0.6rem 1rem', color: 'rgba(45,43,85,0.75)', borderBottom: '1px solid rgba(108,92,231,0.08)', verticalAlign: 'top' }}>
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code style={{ background: 'rgba(108,92,231,0.08)', color: '#6C5CE7', padding: '0.15em 0.4em', borderRadius: '4px', fontSize: '0.875em', fontFamily: 'monospace' }}>
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
