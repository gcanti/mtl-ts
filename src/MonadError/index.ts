import { HKT, URIS, URIS2, Type, Type2 } from 'fp-ts/lib/HKT'
import { Option } from 'fp-ts/lib/Option'
import { Either, left, right } from 'fp-ts/lib/Either'
import { Applicative, Applicative1, Applicative2, Applicative2C } from 'fp-ts/lib/Applicative'
import { Monad, Monad1, Monad2, Monad2C } from 'fp-ts/lib/Monad'

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
  readonly URI: M
  throwError: <A>(e: E) => HKT<M, A>
}

export interface MonadThrow1<M extends URIS, E> {
  readonly URI: M
  throwError: <A>(e: E) => Type<M, A>
}

export interface MonadThrow2<M extends URIS2, E> {
  readonly URI: M
  throwError: <A>(e: E) => Type2<M, E, A>
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
  catchError: <A>(ma: HKT<M, A>, f: (e: E) => HKT<M, A>) => HKT<M, A>
}

export interface MonadError1<M extends URIS, E> extends MonadThrow1<M, E> {
  catchError: <A>(ma: Type<M, A>, f: (e: E) => Type<M, A>) => Type<M, A>
}

export interface MonadError2<M extends URIS2, E> extends MonadThrow2<M, E> {
  catchError: <A>(ma: Type2<M, E, A>, f: (e: E) => Type2<M, E, A>) => Type2<M, E, A>
}

/**
 * This function allows you to provide a predicate for selecting the
 * exceptions that you're interested in, and handle only those exceptons.
 * If the inner computation throws an exception, and the predicate returns
 * Nothing, then the whole computation will still fail with that exception.
 */
export function catchJust<M extends URIS2, E>(
  M: MonadError2<M, E>
): <B>(predicate: (e: E) => Option<B>) => <A>(ma: Type2<M, E, A>, handler: (b: B) => Type2<M, E, A>) => Type2<M, E, A>
export function catchJust<M extends URIS, E>(
  M: MonadError1<M, E>
): <B>(predicate: (e: E) => Option<B>) => <A>(ma: Type<M, A>, handler: (b: B) => Type<M, A>) => Type<M, A>
export function catchJust<M, E>(
  M: MonadError<M, E>
): <B>(predicate: (e: E) => Option<B>) => <A>(ma: HKT<M, A>, handler: (b: B) => HKT<M, A>) => HKT<M, A>
export function catchJust<M, E>(
  M: MonadError<M, E>
): <B>(predicate: (e: E) => Option<B>) => <A>(ma: HKT<M, A>, handler: (b: B) => HKT<M, A>) => HKT<M, A> {
  return predicate => (ma, handler) => M.catchError(ma, e => predicate(e).foldL(() => M.throwError(e), handler))
}

/** Return `Right` if the given action succeeds, `Left` if it throws */
export function tryCatch<M extends URIS2, E>(
  M: MonadError2<M, E> & Applicative2<M>
): <A>(ma: Type2<M, E, A>) => Type2<M, E, Either<E, A>>
export function tryCatch<M extends URIS2, E>(
  M: MonadError2<M, E> & Applicative2C<M, E>
): <A>(ma: Type2<M, E, A>) => Type2<M, E, Either<E, A>>
export function tryCatch<M extends URIS, E>(
  M: MonadError1<M, E> & Applicative1<M>
): <A>(ma: Type<M, A>) => Type<M, Either<E, A>>
export function tryCatch<M, E>(M: MonadError<M, E> & Applicative<M>): <A>(ma: HKT<M, A>) => HKT<M, Either<E, A>>
export function tryCatch<M, E>(M: MonadError<M, E> & Applicative<M>): <A>(ma: HKT<M, A>) => HKT<M, Either<E, A>> {
  return ma => M.catchError(M.map(ma, a => right(a)), e => M.of(left(e)))
}

/**
 * Make sure that a resource is cleaned up in the event of an exception. The
 * release action is called regardless of whether the body action throws or
 * returns.
 */
export function withResource<M extends URIS2, E>(
  M: MonadError2<M, E> & Monad2<M>
): <R, A>(
  acquire: Type2<M, E, R>,
  release: (r: R) => Type2<M, E, void>,
  program: (r: R) => Type2<M, E, A>
) => Type2<M, E, A>
export function withResource<M extends URIS2, E>(
  M: MonadError2<M, E> & Monad2C<M, E>
): <R, A>(
  acquire: Type2<M, E, R>,
  release: (r: R) => Type2<M, E, void>,
  program: (r: R) => Type2<M, E, A>
) => Type2<M, E, A>
export function withResource<M extends URIS, E>(
  M: MonadError1<M, E> & Monad1<M>
): <R, A>(acquire: Type<M, R>, release: (r: R) => Type<M, void>, program: (r: R) => Type<M, A>) => Type<M, A>
export function withResource<M, E>(
  M: MonadError<M, E> & Monad<M>
): <R, A>(acquire: HKT<M, R>, release: (r: R) => HKT<M, void>, program: (r: R) => HKT<M, A>) => HKT<M, A>
export function withResource<M, E>(
  M: MonadError<M, E> & Monad<M>
): <R, A>(acquire: HKT<M, R>, release: (r: R) => HKT<M, void>, program: (r: R) => HKT<M, A>) => HKT<M, A> {
  const tryCatchM = tryCatch(M)
  return (acquire, release, program) =>
    M.chain(acquire, r =>
      M.chain(tryCatchM(program(r)), result => M.chain(release(r), () => result.fold(e => M.throwError(e), M.of)))
    )
}
