import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

const httpLink = createHttpLink({
  uri: '/api/graphql',
})

let apolloClientInstance: ApolloClient<any> | null = null

function createApolloClient() {
  return new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
    ssrMode: typeof window === 'undefined',
  })
}

export function getApolloClient() {
  if (typeof window === 'undefined') {
    return createApolloClient()
  }
  
  if (!apolloClientInstance) {
    apolloClientInstance = createApolloClient()
  }
  
  return apolloClientInstance
}

export const apolloClient = getApolloClient()
