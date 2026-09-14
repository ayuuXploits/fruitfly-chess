import type { ReactNode } from 'react'

interface Props {
  header: ReactNode
  left: ReactNode
  center: ReactNode
  right: ReactNode
}

export default function Layout({ header, left, center, right }: Props) {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0e17] overflow-hidden">
      {header}
      <div className="flex-1 flex min-h-0">
        {left}
        <div className="flex-1 min-w-0">{center}</div>
        {right}
      </div>
    </div>
  )
}
