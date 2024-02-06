export type Global = Record<string, any>

export type DynamicPage = {
  searchParams: { [key: string]: string | undefined };
  params: { slug: string };
}
