import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Quote } from '../types'

export function QuoteCard() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [spinning, setSpinning] = useState(false)

  function fetchQuote() {
    return api.get<Quote | null>('/quotes/random').then(setQuote).catch(() => setQuote(null))
  }

  useEffect(() => {
    fetchQuote()
  }, [])

  async function shuffle() {
    setSpinning(true)
    await fetchQuote()
    setSpinning(false)
  }

  if (!quote) return null

  return (
    <div className="quote-card">
      <button
        className="quote-shuffle"
        onClick={shuffle}
        aria-label="Get another quote"
        disabled={spinning}
      >
↻
      </button>
      <p className="quote-text">“{quote.text}”</p>
      {quote.author && <p className="quote-author">— {quote.author}</p>}
    </div>
  )
}
