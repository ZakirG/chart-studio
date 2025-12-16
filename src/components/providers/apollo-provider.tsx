'use client'

import { ApolloProvider } from '@apollo/client'
import { useMemo } from 'react'
import { getApolloClient } from '@/lib/apollo-client'

interface ApolloProviderWrapperProps {
  children: React.ReactNode
}

export function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  const client = useMemo(() => getApolloClient(), [])
  
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  )
}
