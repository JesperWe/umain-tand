This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Assumptions

- We use NextJS
- We always use Typescript and want all code typed
- We can use any UI component framework, TailwindCSS can be opted in to.
- We prefer standard GraphQL before REST or proprietary SDKs.


## Directus

- create editor role
- Preview user and token
- Save token in .env.local
- create page collection
- enable public read to published page and versions


curl -sSL https://rover.apollo.dev/nix/latest | sh
rover graph introspect http://localhost:4000 --output schema.graphql
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers

Contains experimental
https://github.com/apollographql/apollo-client-nextjs

Use ESLint! & --fix on save
