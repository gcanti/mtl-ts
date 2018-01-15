import { HKT2, HKT3, HKT2S, HKT2As, HKT3S, HKT3As } from 'fp-ts/lib/HKT'
import { Functor2 } from 'fp-ts/lib/Functor'

export interface MonadReader<M, E> {
  ask(): HKT2<M, E, E>
}

export interface MonadReader3<M, E> {
  ask<U, L>(): HKT3<M, U, L, E>
}

export function asks<M extends HKT3S, E>(
  M: MonadReader<M, E> & Functor2<M, E>
): <U, A>(f: (e: E) => A) => HKT3As<M, U, E, A>
export function asks<M extends HKT2S, E>(M: MonadReader<M, E> & Functor2<M, E>): <A>(f: (e: E) => A) => HKT2As<M, E, A>
export function asks<M, E>(M: MonadReader<M, E> & Functor2<M, E>): <U, A>(f: (e: E) => A) => HKT3<M, U, E, A>
export function asks<M, E>(M: MonadReader<M, E> & Functor2<M, E>): <A>(f: (e: E) => A) => HKT2<M, E, A>
export function asks<M, E>(M: MonadReader<M, E> & Functor2<M, E>): <A>(f: (e: E) => A) => HKT2<M, E, A> {
  return f => M.map(f, M.ask())
}

export function local<M extends HKT3S, E>(
  M: MonadReader<M, E> & Functor2<M, E>
): <U>(f: (e: E) => E) => HKT3As<M, U, E, E>
export function local<M extends HKT2S, E>(M: MonadReader<M, E> & Functor2<M, E>): (f: (e: E) => E) => HKT2As<M, E, E>
export function local<M, E>(M: MonadReader<M, E> & Functor2<M, E>): <U>(f: (e: E) => E) => HKT3<M, U, E, E>
export function local<M, E>(M: MonadReader<M, E> & Functor2<M, E>): (f: (e: E) => E) => HKT2<M, E, E>
export function local<M, E>(M: MonadReader<M, E> & Functor2<M, E>): (f: (e: E) => E) => HKT2<M, E, E> {
  return asks(M)
}
