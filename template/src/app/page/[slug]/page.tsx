import {draftMode} from 'next/headers'
import {gql} from '@/__generated__/gql'
import {useApolloClient} from '@apollo/client'
import {DynamicPage} from "@/types/collections"
import {getClient} from "@/app/ApolloClient"

const GET_PAGE = gql(`
query Page($slug: String!) {
    pages(filter: { slug: { _eq: $slug } }) {
        id
        slug
        headline
        intro
        status
        date_updated
    }
}`)

const GET_PAGE_VERSION = gql(`
query PagesVersion($id: ID!, $version: String!) {
    pages_by_version(version: $version, id: $id) {
        id
        status
        slug
        headline
        intro
        date_updated
    }
}`)

const GET_PAGES = gql(`
query Pages {
    pages {
        id
        slug
        status
        headline
    }
}`)

export const generateStaticParams = async () => {
    const r = await getClient().query({query: GET_PAGES})
    return r.data.pages
}

const Page: React.FC<DynamicPage> = async ({searchParams, params}) => {
    const client = getClient()
    const {isEnabled} = draftMode()
    console.log({searchParams, params})

    let pageResult, page
    const version = searchParams.version
    pageResult = await client.query({query: GET_PAGE, variables: {slug: params.slug}})
    page = pageResult.data.pages[0]
    if(version) {
        pageResult = await client.query({query: GET_PAGE_VERSION, variables: {id: page.id, version: version}})
        page = pageResult.data.pages_by_version
    }

    return (
        <div>
            {<h1>{page?.headline}</h1>}

            {isEnabled ? (
                <p style={{color: 'green'}}>DRAFT MODE</p>
            ) : (
                <p style={{color: 'red'}}>NOT DRAFT MODE</p>
            )}
        </div>
    )
}

export default Page
