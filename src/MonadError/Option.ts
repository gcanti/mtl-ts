import { URI, option, none } from 'fp-ts/lib/Option'
import { MonadError1 } from './index'
import { Monad1 } from 'fp-ts/lib/Monad'

export const getMonadError = <E>(e: E): MonadError1<URI, E> & Monad1<URI> => {
  return {
    URI,
    map: option.map,
    of: option.of,
    ap: option.ap,
    chain: option.chain,
    throwError: () => none,
    catchError: (ma, f) => ma.foldL(() => f(e), () => ma)
  }
}
