'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  ChartBar, 
  Database, 
  SquaresFour,
} from 'phosphor-react'

const navigation = [
  { name: 'Dashboards', href: '/dashboards', icon: ChartBar },
  { name: 'Data Explorer', href: '/explorer', icon: Database },
  { name: 'Templates', href: '/templates', icon: SquaresFour },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
                          className={cn(
              isActive
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
            )}
            >
              <item.icon
                className={cn(
                  isActive ? 'mr-3 h-5 w-5 flex-shrink-0' : 'text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5 flex-shrink-0'
                )}
                style={isActive ? { color: 'var(--brand-primary)' } : {}}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
