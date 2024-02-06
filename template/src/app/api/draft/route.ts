import {gql} from '@/__generated__/gql';
import {useApolloClient} from '@apollo/client';
import {cookies, draftMode} from 'next/headers';

const GET_PAGE = gql(`
query PageMeta($version: String!, $id: ID!) {
    pages_by_version(version: $version, id: $id) {
        slug status
    }
}`);

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url);
    const secret = searchParams.get('secret');
    const id = searchParams.get('id');
    const version = searchParams.get('version');
    const client = useApolloClient()

    if (secret !== process.env.DIRECTUS_PREVIEW_TOKEN) {
        return new Response('Invalid token', {status: 401});
    }

    if (!id) {
        return new Response('Missing id', {status: 401});
    }

    const r = await client.query({query: GET_PAGE, variables: {version: "12", id: "1"}})
    const page = r.data.pages_by_version

    if (!page) {
        return new Response('Invalid slug', {status: 401});
    }

    draftMode().enable();

    const draft = cookies().get('__prerender_bypass');
    cookies().set('__prerender_bypass', draft?.value ?? '', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
    });

    return new Response(null, {
        status: 307,
        headers: {
            Location: `/${page.slug}?version=${version}`,
        },
    });
}