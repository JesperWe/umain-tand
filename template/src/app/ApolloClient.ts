import * as React from "react"
import {ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache} from "@apollo/client"

function registerApolloClient(makeClient: (token: string) => ApolloClient<any>) {
    const getClient = React.cache(makeClient)
    return {
        getClient,
    }
}

export const {getClient} = registerApolloClient((token) => {

    const auth = new ApolloLink((operation, forward) => {
        operation.setContext(({ headers = {} }) => ({
            headers: {
                ...headers,
                authorization: `Bearer ${token}`,
            }
        }))
        return forward(operation)
    })

    const http = new HttpLink({
        uri: process.env.DIRECTUS_BASE_URL + "/graphql",
        // you can disable result caching here if you want to
        // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
        // fetchOptions: { cache: "no-store" },
    })

    return new ApolloClient({
        cache: new InMemoryCache(),
        link: concat(auth, http)
    })
})