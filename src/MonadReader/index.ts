import { HKT, URIS, URIS2, Type, Type2 } from 'fp-ts/lib/HKT'
import { Functor, Functor1, Functor2, Functor2C } from 'fp-ts/lib/Functor'

export interface MonadReader<M, E> {
  readonly URI: M
  ask: () => HKT<M, E>
}

export interface MonadReader1<M extends URIS, E> {
  readonly URI: M
  ask: () => Type<M, E>
}

export interface MonadReader2<M extends URIS2, E> {
  readonly URI: M
  ask: () => Type2<M, E, E>
}

export function asks<M extends URIS2, E>(M: MonadReader2<M, E> & Functor2<M>): <A>(f: (e: E) => A) => Type2<M, E, A>
export function asks<M extends URIS2, E>(M: MonadReader2<M, E> & Functor2C<M, E>): <A>(f: (e: E) => A) => Type2<M, E, A>
export function asks<M extends URIS, E>(M: MonadReader1<M, E> & Functor1<M>): <A>(f: (e: E) => A) => Type<M, A>
export function asks<M, E>(M: MonadReader<M, E> & Functor<M>): <A>(f: (e: E) => A) => HKT<M, A>
export function asks<M, E>(M: MonadReader<M, E> & Functor<M>): <A>(f: (e: E) => A) => HKT<M, A> {
  return f => M.map(M.ask(), f)
}

export function local<M extends URIS2, E>(M: MonadReader2<M, E> & Functor2<M>): (f: (e: E) => E) => Type2<M, E, E>
export function local<M extends URIS2, E>(M: MonadReader2<M, E> & Functor2C<M, E>): (f: (e: E) => E) => Type2<M, E, E>
export function local<M extends URIS, E>(M: MonadReader1<M, E> & Functor1<M>): (f: (e: E) => E) => Type<M, E>
export function local<M, E>(M: MonadReader<M, E> & Functor<M>): (f: (e: E) => E) => HKT<M, E>
export function local<M, E>(M: MonadReader<M, E> & Functor<M>): (f: (e: E) => E) => HKT<M, E> {
  return asks(M)
}
