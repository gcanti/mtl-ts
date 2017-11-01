import { HKT } from 'fp-ts/lib/HKT'
import { Monad } from 'fp-ts/lib/Monad'
import { URI, Either, left, either } from 'fp-ts/lib/Either'
import { MonadError } from './index'

export const getEitherMonadError = <E>(): MonadError<E, URI> => {
  return {
    ...(either as Monad<URI>),
    throwError: e => left(e),
    catchError: <A>(ma: HKT<URI, A>, f: (e: E) => HKT<URI, A>) => {
      return (ma as Either<E, A>).fold(f, () => ma)
    }
  }
}
