import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://localhost:3019/api/graphql',
  documents: 'src/graphql/operations/**/*.graphql',
  generates: {
    'src/graphql/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        useTypeImports: true,
        withHooks: true,
        withHOC: false,
        withComponent: false,
      },
    },
  },
}

export default config
