'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  Handshake,
  CalendarDays,
  CheckSquare,
  Package,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Target,
  Briefcase,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    title: 'Operativo',
    items: [
      {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Acquisizione',
    items: [
      {
        title: 'Lead',
        href: '/lead',
        icon: Target,
      },
    ],
  },
  {
    title: 'Gestione',
    items: [
      {
        title: 'Clienti',
        href: '/clienti',
        icon: Users,
      },
      {
        title: 'Proprietà',
        href: '/proprieta',
        icon: Home,
      },
      {
        title: 'Contatti',
        href: '/contatti',
        icon: Handshake,
      },
    ],
  },
  {
    title: 'Property Manager',
    items: [
      {
        title: 'I Miei Dati',
        href: '/property-manager',
        icon: UserCircle,
      },
      {
        title: 'Catalogo Servizi',
        href: '/servizi',
        icon: Package,
      },
      {
        title: 'Documenti',
        href: '/documenti',
        icon: FileText,
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        'relative flex flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              H
            </div>
            <span className="font-semibold">HUB PM</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            H
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-1 px-2">
          {navigation.map((section, sectionIndex) => (
            <div key={section.title}>
              {/* Section Title */}
              {!collapsed && (
                <div className="px-3 py-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h4>
                </div>
              )}
              {collapsed && sectionIndex > 0 && (
                <Separator className="my-2" />
              )}

              {/* Section Items */}
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  )
                })}
              </div>

              {/* Section Separator */}
              {!collapsed && sectionIndex < navigation.length - 1 && (
                <Separator className="my-3" />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse Button */}
      <Separator />
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Comprimi</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
