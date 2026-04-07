'use client'

import { useEffect, useState } from 'react'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  contentId: string // ID of the element containing the blog content
}

export default function TableOfContents({ contentId }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const content = document.getElementById(contentId)
    if (!content) return

    const elements = content.querySelectorAll('h1, h2, h3')
    const items: Heading[] = []

    elements.forEach((el, index) => {
      const id = el.id || `heading-${index}`
      if (!el.id) el.id = id
      items.push({
        id,
        text: el.textContent || '',
        level: parseInt(el.tagName[1]),
      })
    })

    setHeadings(items)
  }, [contentId])

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
        </svg>
        Contents
      </h4>
      <nav className="space-y-1">
        {headings.map(heading => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={e => {
              e.preventDefault()
              const el = document.getElementById(heading.id)
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
            className={`block text-sm transition-colors duration-200 rounded-lg px-3 py-1.5 leading-snug
              ${heading.level === 1 ? 'font-semibold' : ''}
              ${heading.level === 2 ? 'pl-3' : ''}
              ${heading.level === 3 ? 'pl-6 text-xs' : ''}
              ${activeId === heading.id
                ? 'text-blue-600 bg-blue-50 font-medium'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }
            `}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  )
}
