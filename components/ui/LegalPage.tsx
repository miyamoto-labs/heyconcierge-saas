'use client'
import ReactMarkdown from 'react-markdown'

interface LegalPageProps {
  content: string
}

export default function LegalPage({ content }: LegalPageProps) {
  return (
    <div className="prose prose-gray max-w-none
      prose-h1:text-3xl prose-h1:font-bold prose-h1:text-gray-900 prose-h1:mb-2
      prose-h2:text-xl prose-h2:font-semibold prose-h2:text-gray-800 prose-h2:mt-10 prose-h2:mb-4
      prose-h3:text-base prose-h3:font-semibold prose-h3:text-gray-700 prose-h3:mt-6 prose-h3:mb-2
      prose-p:text-gray-600 prose-p:leading-relaxed
      prose-li:text-gray-600
      prose-strong:text-gray-800
      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
      prose-blockquote:border-l-4 prose-blockquote:border-gray-200 prose-blockquote:text-gray-500
      prose-table:text-sm prose-th:text-left prose-th:font-semibold prose-th:text-gray-700
      prose-td:text-gray-600 prose-td:align-top
      prose-hr:border-gray-100">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
