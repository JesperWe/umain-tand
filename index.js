#!/usr/bin/env node
import inquirer from 'inquirer'
import spawn from 'cross-spawn'
import randomstring from 'randomstring'
import fs from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { authentication, createCollection, createDirectus, createPermission, rest, updateMe } from '@directus/sdk'
import retryFetch from 'node-fetch-retry'
import { jwtDecode } from "jwt-decode"

const questions = [
    {
        type: 'input',
        name: 'projectName',
        message: "What is your projects name",
    },
    {
        type: 'input',
        name: 'directusAdmin',
        message: "Directus admin account email",
        default() {
            return 'admin@umain.com'
        },
    },
    {
        type: 'input',
        name: 'directusPasswd',
        message: "Directus admin account password",
        default() {
            return randomstring.generate( 8 )
        },
    },
    {
        type: 'confirm',
        message: 'Do you want to spawn a local Directus instance',
        name: 'spawnDirectus',
    },
    {
        type: 'input',
        name: 'directusHost',
        message: "Directus URL",
        default() {
            return 'http://localhost:8055'
        },
        when( answers ) {
            return !answers.spawnDirectus
        },
    },
]
const answers = await inquirer.prompt( questions )
if( !answers.directusHost ) answers.directusHost = 'http://localhost:8055'

// Create a project directory with the project name.
const currentDir = process.cwd()
const projectDir = path.resolve( currentDir, answers.projectName )
const __dirname = path.dirname( fileURLToPath( import.meta.url ) )

fs.mkdirSync( projectDir, { recursive: true } )

const templateDir = path.resolve( __dirname, 'template' )
fs.cpSync( templateDir, projectDir, { recursive: true } )

fs.renameSync( path.join( projectDir, 'gitignore' ), path.join( projectDir, '.gitignore' ) )
fs.renameSync( path.join( projectDir, 'eslintrc.json' ), path.join( projectDir, '.eslintrc.json' ) )

const projectPackageJson = JSON.parse( await readFile( path.join( projectDir, 'package.json' ) ) )
projectPackageJson.name = answers.projectName
fs.writeFileSync(
    path.join( projectDir, 'package.json' ),
    JSON.stringify( projectPackageJson, null, 2 )
)

// Create the admin user API token. TODO Should be a more restricted uer really for the preview...

const token = randomstring.generate( 32 )

fs.writeFileSync(
    path.join( projectDir, '.env.local' ),
    `DIRECTUS_PREVIEW_TOKEN=${token}
DIRECTUS_BASE_URL=${answers.directusHost}
NEXT_PUBLIC_ASSET_URL=${answers.directusHost}/assets/
`
)

console.log( `\nInstalling front end.` )

spawn.sync( 'npm', [ 'install' ], { stdio: [ 'inherit', 'ignore', 'inherit' ], cwd: projectDir } ) // Show errors but not output

const directusDir = path.resolve( projectDir, 'directus' )

if( answers.spawnDirectus ) {
    const config =
        `version: "3"
services:
  directus:
    image: directus/directus:latest
    ports:
      - 8055:8055
    volumes:
      - ./config:/directus/config
      - ./database:/directus/database
      - ./uploads:/directus/uploads
      - ./extensions:/directus/extensions
    environment:
      KEY: "${ randomstring.generate( 8 ) }"
      SECRET: "${ randomstring.generate( 8 ) }"
      ADMIN_EMAIL: "${ answers.directusAdmin }"
      ADMIN_PASSWORD: "${ answers.directusPasswd }"
      DB_CLIENT: "sqlite3"
      DB_FILENAME: "/directus/database/data.db"
      WEBSOCKETS_ENABLED: true
      CONFIG_PATH: "/directus/config/config.json"
      MAX_PAYLOAD_SIZE: 100MB
      FILES_MAX_UPLOAD_SIZE: 100MB
      CORS_ENABLED: true
      CORS_ORIGIN: "*"
`
    fs.writeFileSync( path.join( directusDir, 'compose.yaml' ), config )

    console.log( `\nStarting Directus container from ${ directusDir } ...` )
    spawn.sync( 'docker', [ 'compose', 'up', '-d' ], { cwd: directusDir } )
}

console.log( `Waiting for Directus at ${ answers.directusHost } ` )
let res = await retryFetch( answers.directusHost,
    {
        method: 'GET', retry: 60, pause: 1000, silent: true, callback: retry => {
            process.stdout.write( '.' )
        }
    }
)

console.log( `\nSeeding Directus.` )
const client = createDirectus( answers.directusHost ).with( rest() ).with( authentication() )
await client.login( answers.directusAdmin, answers.directusPasswd )

await client.request( updateMe( { token } ) )

// Create the pages collection and make it readable by public.

const pages = JSON.parse( await readFile( path.join( directusDir, 'pages.json' ) ) )
pages.meta.preview_url = `http://localhost:3000/api/draft?secret=${ token }&id={{id}}&version={{$version}}`

await client.request( createCollection( pages ) )
await client.request( createPermission( {
    id: 1,
    role: null,
    collection: "pages",
    action: "read",
    permissions: {},
    validation: {},
    presets: null,
    fields: [ "*" ]
} ) )

console.log( `Generate GraphQL API Types.` )
spawn.sync( 'npm', [ 'run', 'generate' ], { stdio: [ 'inherit', 'ignore', 'inherit' ], cwd: projectDir } )

console.log( `\nSuccess! Your new project is ready. 

You can log in to Directus at ${answers.directusHost}/admin
Your GraphQL API is at ${answers.directusHost}/graphql

To start NextJS front end server:
cd ${ projectDir }
npm run dev` )

process.exit( 0 )