import { HKT2, HKT3, HKTS, HKTAs, HKT2S, HKT2As, HKT3S, HKT3As } from 'fp-ts/lib/HKT'
import { Chain2 } from 'fp-ts/lib/Chain'
import { Functor2 } from 'fp-ts/lib/Functor'

export interface MonadState<M, S> {
  get(): HKT2<M, S, S>
  put(s: S): HKT2<M, S, void>
}

export interface MonadState2<M, U, S> {
  get(): HKT3<M, U, S, S>
  put(s: S): HKT3<M, U, S, void>
}

export function modify<M extends HKT3S, S>(
  M: MonadState<M, S> & Chain2<M, S>
): <U>(f: (s: S) => S) => HKT3As<M, U, S, void>
export function modify<M extends HKT2S, S>(M: MonadState<M, S> & Chain2<M, S>): (f: (s: S) => S) => HKT2As<M, S, void>
export function modify<M extends HKTS, S>(M: MonadState<M, S> & Chain2<M, S>): (f: (s: S) => S) => HKTAs<M, void>
export function modify<M, S>(M: MonadState<M, S> & Chain2<M, S>): (f: (s: S) => S) => HKT2<M, S, void>
export function modify<M, S>(M: MonadState<M, S> & Chain2<M, S>): (f: (s: S) => S) => HKT2<M, S, void> {
  return f => M.chain(s => M.put(f(s)), M.get())
}

export function gets<M extends HKT3S, S>(
  M: MonadState<M, S> & Functor2<M, S>
): <U, A>(f: (s: S) => A) => HKT3As<M, U, S, A>
export function gets<M extends HKT2S, S>(M: MonadState<M, S> & Functor2<M, S>): <A>(f: (s: S) => A) => HKT2As<M, S, A>
export function gets<M extends HKTS, S>(M: MonadState<M, S> & Functor2<M, S>): <A>(f: (s: S) => A) => HKTAs<M, A>
export function gets<M, S>(M: MonadState<M, S> & Functor2<M, S>): <A>(f: (s: S) => A) => HKT2<M, S, A>
export function gets<M, S>(M: MonadState<M, S> & Functor2<M, S>): <A>(f: (s: S) => A) => HKT2<M, S, A> {
  return f => M.map(f, M.get())
}
