import { Option } from 'fp-ts/lib/Option'
import * as option from 'fp-ts/lib/Option'
import { MonadError } from './index'
import { Monad2 } from 'fp-ts/lib/Monad'

export const monadErrorOption: MonadError<option.URI, void> & Monad2<option.URI, void> = {
  URI: option.URI,
  map: option.map,
  of: option.of,
  ap: option.ap,
  chain: option.chain,
  throwError: (e: void) => option.none,
  catchError: <A>(ma: Option<A>, f: (e: void) => Option<A>) => {
    return ma.fold(() => f(undefined), () => ma)
  }
} as any
