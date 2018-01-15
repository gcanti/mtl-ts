import * as state from 'fp-ts/lib/State'
import { MonadState } from './index'
import { Monad2 } from 'fp-ts/lib/Monad'

export const getStateMonadState = <E>(): MonadState<state.URI, E> & Monad2<state.URI, E> => {
  return state
}
