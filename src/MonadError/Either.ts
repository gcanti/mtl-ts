import { URI, either, left, right } from 'fp-ts/lib/Either'
import { MonadError2 } from './index'
import { Monad2C } from 'fp-ts/lib/Monad'
import { phantom } from 'fp-ts/lib/function'

export const getMonadError = <E = never>(): MonadError2<URI, E> & Monad2C<URI, E> => {
  return {
    URI,
    _L: phantom,
    map: either.map,
    of: either.of,
    ap: either.ap,
    chain: either.chain,
    throwError: left,
    catchError: (ma, f) => ma.fold(f, a => right(a))
  }
}
