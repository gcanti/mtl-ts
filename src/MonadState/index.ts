import { HKT, URIS, URIS2, Type, Type2 } from 'fp-ts/lib/HKT'
import { Chain, Chain1, Chain2, Chain2C } from 'fp-ts/lib/Chain'
import { Functor, Functor1, Functor2, Functor2C } from 'fp-ts/lib/Functor'

export interface MonadState<M, S> {
  readonly URI: M
  get: () => HKT<M, S>
  put: (s: S) => HKT<M, void>
}

export interface MonadState1<M extends URIS, S> {
  readonly URI: M
  get: () => Type<M, S>
  put: (s: S) => Type<M, void>
}

export interface MonadState2<M extends URIS2, S> {
  readonly URI: M
  get: () => Type2<M, S, S>
  put: (s: S) => Type2<M, S, void>
}

export function modify<M extends URIS2, S>(M: MonadState2<M, S> & Chain2<M>): (f: (s: S) => S) => Type2<M, S, void>
export function modify<M extends URIS2, S>(M: MonadState2<M, S> & Chain2C<M, S>): (f: (s: S) => S) => Type2<M, S, void>
export function modify<M extends URIS, S>(M: MonadState1<M, S> & Chain1<M>): (f: (s: S) => S) => Type<M, void>
export function modify<M, S>(M: MonadState<M, S> & Chain<M>): (f: (s: S) => S) => HKT<M, void>
export function modify<M, S>(M: MonadState<M, S> & Chain<M>): (f: (s: S) => S) => HKT<M, void> {
  return f => M.chain(M.get(), s => M.put(f(s)))
}

export function gets<M extends URIS2, S>(M: MonadState2<M, S> & Functor2<M>): <A>(f: (s: S) => A) => Type2<M, S, A>
export function gets<M extends URIS2, S>(M: MonadState2<M, S> & Functor2C<M, S>): <A>(f: (s: S) => A) => Type2<M, S, A>
export function gets<M extends URIS, S>(M: MonadState1<M, S> & Functor1<M>): <A>(f: (s: S) => A) => Type<M, A>
export function gets<M, S>(M: MonadState<M, S> & Functor<M>): <A>(f: (s: S) => A) => HKT<M, A>
export function gets<M, S>(M: MonadState<M, S> & Functor<M>): <A>(f: (s: S) => A) => HKT<M, A> {
  return f => M.map(M.get(), f)
}
