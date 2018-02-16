import { URI, taskEither, fromEither } from 'fp-ts/lib/TaskEither'
import { MonadError2 } from './index'
import { Monad2C } from 'fp-ts/lib/Monad'
import { left } from 'fp-ts/lib/Either'
import { phantom } from 'fp-ts/lib/function'

export const getMonadError = <E = never>(): MonadError2<URI, E> & Monad2C<URI, E> => {
  return {
    URI: URI,
    _L: phantom,
    map: taskEither.map,
    of: taskEither.of,
    ap: taskEither.ap,
    chain: taskEither.chain,
    throwError: e => fromEither(left(e)),
    catchError: (ma, f) => ma.orElse(f)
  }
}
