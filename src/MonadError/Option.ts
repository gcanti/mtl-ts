import { HKT } from 'fp-ts/lib/HKT'
import { Monad } from 'fp-ts/lib/Monad'
import { URI, Option, none, option } from 'fp-ts/lib/Option'
import { MonadError } from './index'

export const monadErrorOption: MonadError<void, URI> = {
  ...(option as Monad<URI>),
  throwError: () => none,
  catchError: <A>(ma: HKT<URI, A>, f: (e: void) => HKT<URI, A>) => {
    return (ma as Option<A>).fold(() => f(undefined), () => ma)
  }
}
