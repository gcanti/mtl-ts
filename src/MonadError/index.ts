import { HKT2S, HKT2As, HKT3S, HKT3As, HKT2, HKT3, HKTS, HKTAs } from 'fp-ts/lib/HKT'
import { Option } from 'fp-ts/lib/Option'
import { Either, left, right } from 'fp-ts/lib/Either'
import { Applicative2 } from 'fp-ts/lib/Applicative'
import { Monad2 } from 'fp-ts/lib/Monad'

/**
 * The `MonadThrow` type class represents those monads which support errors via
 * `throwError`, where `throwError e` halts, yielding the error `e`.
 *
 * An implementation is provided for `Option` and `Either`
 *
 * Laws:
 *
 * - Left zero: `throwError e >>= f = throwError e`
 * @typeclass
 */
export interface MonadThrow<M, E> {
  throwError<A>(e: E): HKT2<M, E, A>
}

export interface MonadThrow3<M, U, E> {
  throwError<A>(e: E): HKT3<M, U, E, A>
}

/**
 * The `MonadError` type class represents those monads which support catching
 * errors.
 *
 * - `catchError x f` calls the error handler `f` if an error is thrown during the
 *   evaluation of `x`.
 *
 * An implementation is provided for for `Option` and `Either`
 *
 * Laws:
 *
 * - Catch: `catchError (throwError e) f = f e`
 * - Pure: `catchError (pure a) f = pure a`
 * @typeclass
 */
export interface MonadError<M, E> extends MonadThrow<M, E> {
  catchError<A>(ma: HKT2<M, E, A>, f: (e: E) => HKT2<M, E, A>): HKT2<M, E, A>
}

export interface MonadError3<M, U, E> extends MonadThrow3<M, U, E> {
  catchError<A>(ma: HKT3<M, U, E, A>, f: (e: E) => HKT3<M, U, E, A>): HKT3<M, U, E, A>
}

/**
 * This function allows you to provide a predicate for selecting the
 * exceptions that you're interested in, and handle only those exceptons.
 * If the inner computation throws an exception, and the predicate returns
 * Nothing, then the whole computation will still fail with that exception.
 */
export function catchJust<M extends HKT3S, E>(
  M: MonadError<M, E>
): <B>(
  predicate: (e: E) => Option<B>
) => <U, A>(ma: HKT3As<M, U, E, A>, handler: (b: B) => HKT3As<M, U, E, A>) => HKT3As<M, U, E, A>
export function catchJust<M extends HKT2S, E>(
  M: MonadError<M, E>
): <B>(
  predicate: (e: E) => Option<B>
) => <A>(ma: HKT2As<M, E, A>, handler: (b: B) => HKT2As<M, E, A>) => HKT2As<M, E, A>
export function catchJust<M extends HKTS, E>(
  M: MonadError<M, E>
): <B>(predicate: (e: E) => Option<B>) => <A>(ma: HKTAs<M, A>, handler: (b: B) => HKTAs<M, A>) => HKTAs<M, A>
export function catchJust<M, E>(
  M: MonadError<M, E>
): <B>(predicate: (e: E) => Option<B>) => <A>(ma: HKT2<M, E, A>, handler: (b: B) => HKT2<M, E, A>) => HKT2<M, E, A>
export function catchJust<M, E>(
  M: MonadError<M, E>
): <B>(predicate: (e: E) => Option<B>) => <A>(ma: HKT2<M, E, A>, handler: (b: B) => HKT2<M, E, A>) => HKT2<M, E, A> {
  return predicate => (ma, handler) => M.catchError(ma, e => predicate(e).fold(() => M.throwError(e), b => handler(b)))
}

/** Return `Right` if the given action succeeds, `Left` if it throws */
export function tryCatch<M extends HKT3S, E>(
  M: MonadError<M, E> & Applicative2<M, E>
): <U, A>(ma: HKT3As<M, U, E, A>) => HKT3As<M, U, E, Either<E, A>>
export function tryCatch<M extends HKT2S, E>(
  M: MonadError<M, E> & Applicative2<M, E>
): <A>(ma: HKT2As<M, E, A>) => HKT2As<M, E, Either<E, A>>
export function tryCatch<M extends HKTS, E>(
  M: MonadError<M, E> & Applicative2<M, E>
): <A>(ma: HKTAs<M, A>) => HKTAs<M, Either<E, A>>
export function tryCatch<M, E>(
  M: MonadError<M, E> & Applicative2<M, E>
): <A>(ma: HKT2<M, E, A>) => HKT2<M, E, Either<E, A>>
export function tryCatch<M, E>(
  M: MonadError<M, E> & Applicative2<M, E>
): <A>(ma: HKT2<M, E, A>) => HKT2<M, E, Either<E, A>> {
  return ma => M.catchError(M.map(a => right(a), ma), e => M.of(left(e)))
}

/**
 * Make sure that a resource is cleaned up in the event of an exception. The
 * release action is called regardless of whether the body action throws or
 * returns.
 */
export function withResource<M extends HKT3S, E>(
  M: MonadError<M, E> & Monad2<M, E>
): <U, R, A>(
  acquire: HKT3As<M, U, E, R>,
  release: (r: R) => HKT3As<M, U, E, void>,
  program: (r: R) => HKT3As<M, U, E, A>
) => HKT3As<M, U, E, A>
export function withResource<M extends HKT2S, E>(
  M: MonadError<M, E> & Monad2<M, E>
): <R, A>(
  acquire: HKT2As<M, E, R>,
  release: (r: R) => HKT2As<M, E, void>,
  program: (r: R) => HKT2As<M, E, A>
) => HKT2As<M, E, A>
export function withResource<M extends HKTS, E>(
  M: MonadError<M, E> & Monad2<M, E>
): <R, A>(acquire: HKTAs<M, R>, release: (r: R) => HKTAs<M, void>, program: (r: R) => HKTAs<M, A>) => HKTAs<M, A>
export function withResource<M, E>(
  M: MonadError<M, E> & Monad2<M, E>
): <R, A>(
  acquire: HKT2<M, E, R>,
  release: (r: R) => HKT2<M, E, void>,
  program: (r: R) => HKT2<M, E, A>
) => HKT2<M, E, A>
export function withResource<M, E>(
  M: MonadError<M, E> & Monad2<M, E>
): <R, A>(
  acquire: HKT2<M, E, R>,
  release: (r: R) => HKT2<M, E, void>,
  program: (r: R) => HKT2<M, E, A>
) => HKT2<M, E, A> {
  const tryCatchM = tryCatch(M)
  return (acquire, release, program) =>
    M.chain(
      r => M.chain(result => M.chain(() => result.fold(e => M.throwError(e), M.of), release(r)), tryCatchM(program(r))),
      acquire
    )
}
