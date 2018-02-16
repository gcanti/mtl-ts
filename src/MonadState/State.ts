import { URI, state, get, put } from 'fp-ts/lib/State'
import { MonadState } from './index'
import { Monad2C } from 'fp-ts/lib/Monad'
import { phantom } from 'fp-ts/lib/function'

export const getMonadState = <S = never>(): MonadState<URI, S> & Monad2C<URI, S> => {
  return {
    URI: state.URI,
    _L: phantom,
    map: state.map,
    of: state.of,
    ap: state.ap,
    chain: state.chain,
    get,
    put
  }
}
