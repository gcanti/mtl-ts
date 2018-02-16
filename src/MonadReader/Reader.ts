import { URI, reader, ask } from 'fp-ts/lib/Reader'
import { MonadReader } from './index'
import { Monad2C } from 'fp-ts/lib/Monad'
import { phantom } from 'fp-ts/lib/function'

export const getMonadReader = <E = never>(): MonadReader<URI, E> & Monad2C<URI, E> => {
  return {
    URI: reader.URI,
    _L: phantom,
    map: reader.map,
    of: reader.of,
    ap: reader.ap,
    chain: reader.chain,
    ask
  }
}
