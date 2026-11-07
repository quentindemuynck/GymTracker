import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Quote } from '../types'

export function QuoteCard() {
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    api.get<Quote | null>('/quotes/today').then(setQuote).catch(() => setQuote(null))
  }, [])

  if (!quote) return null

  return (
    <div className="quote-card">
      <p className="quote-text">“{quote.text}”</p>
      {quote.author && <p className="quote-author">— {quote.author}</p>}
    </div>
  )
}
