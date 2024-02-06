import {gql} from '@/__generated__/gql'
import {cookies, draftMode} from 'next/headers'
import {getClient} from "@/app/ApolloClient"

const GET_PAGE = gql(`
query PageMeta($version: String!, $id: ID!) {
    pages_by_version(version: $version, id: $id) {
        slug status
    }
}`)

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url)
    const secret = searchParams.get('secret')
    const id = searchParams.get('id')
    const version = searchParams.get('version') ?? ''

    if (secret !== process.env.DIRECTUS_PREVIEW_TOKEN) {
        return new Response('Invalid token', {status: 401})
    }

    if (!id) {
        return new Response('Missing id', {status: 401})
    }

    const r = await getClient(secret).query({query: GET_PAGE, variables: {version, id}})
    const page = r.data.pages_by_version

    if (!page) {
        return new Response('Invalid id', {status: 401})
    }

    draftMode().enable()

    const draft = cookies().get('__prerender_bypass')
    cookies().set('__prerender_bypass', draft?.value ?? '', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
    })
    cookies().set('__prerender_token', secret, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
    })

    const verStr = (version === 'main') ? '' : '?version=' + version

    return new Response(null, {
        status: 307,
        headers: {
            Location: `/page/${page.slug}${verStr}`,
        },
    })
}
