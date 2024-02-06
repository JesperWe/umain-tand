import type {Metadata} from "next"
import {ApolloWrapper} from "./ApolloWrapper"
import {Inter} from "next/font/google"
import "./globals.css"

const inter = Inter({subsets: ["latin"]})

export const metadata: Metadata = {
    title: "Umain Directus Starter App",
    description: "From Feb 2024",
}

export default function RootLayout({children}: 
    Readonly<{ children: React.ReactNode; }>) 
{
    return (
        <html lang="en">
        <body className={inter.className}>
        <ApolloWrapper>{children}</ApolloWrapper>
        </body>
        </html>
    )
}
