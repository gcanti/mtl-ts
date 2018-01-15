import { TaskEither } from 'fp-ts/lib/TaskEither'
import * as taskEither from 'fp-ts/lib/TaskEither'
import { MonadError } from './index'
import { Monad2 } from 'fp-ts/lib/Monad'
import { left } from 'fp-ts/lib/Either'

export const getTaskEitherMonadError = <E>(): MonadError<taskEither.URI, E> & Monad2<taskEither.URI, E> => {
  return {
    URI: taskEither.URI,
    map: taskEither.map,
    of: taskEither.of,
    ap: taskEither.ap,
    chain: taskEither.chain,
    throwError: e => taskEither.fromEither(left(e)),
    catchError: <A>(ma: TaskEither<E, A>, f: (e: E) => TaskEither<E, A>) => {
      return ma.orElse(f)
    }
  }
}
