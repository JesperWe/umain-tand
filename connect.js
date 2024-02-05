import tryConnect from 'try-net-connect'

const defaults = {
    retry: 1000,
    retries: 100
}

function connect( host, port ) {
    return new Promise( ( resolve, reject ) => {
        tryConnect( { host, port } )
            .on( 'connected', resolve() )
            .on( 'timeout', reject() )
    } )
}

export default connect