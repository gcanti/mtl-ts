import { Either } from 'fp-ts/lib/Either'
import * as either from 'fp-ts/lib/Either'
import { MonadError } from './index'
import { Monad2 } from 'fp-ts/lib/Monad'

export const getEitherMonadError = <E>(): MonadError<either.URI, E> & Monad2<either.URI, E> => {
  return {
    URI: either.URI,
    map: either.map,
    of: either.of,
    ap: either.ap,
    chain: either.chain,
    throwError: e => either.left(e),
    catchError: <A>(ma: Either<E, A>, f: (e: E) => Either<E, A>) => {
      return ma.fold(f, () => ma)
    }
  }
}
