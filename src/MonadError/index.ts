import { HKT, HKTS, HKTAs, HKT2S, HKT2As, HKT3S, HKT3As } from 'fp-ts/lib/HKT'
import { Monad } from 'fp-ts/lib/Monad'
import { Option } from 'fp-ts/lib/Option'
import { Either, left, right } from 'fp-ts/lib/Either'

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
export interface MonadThrow<E, M> extends Monad<M> {
  throwError<A>(e: E): HKT<M, A>
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
export interface MonadError<E, M> extends MonadThrow<E, M> {
  catchError<A>(ma: HKT<M, A>, f: (e: E) => HKT<M, A>): HKT<M, A>
}

/**
 * This function allows you to provide a predicate for selecting the
 * exceptions that you're interested in, and handle only those exceptons.
 * If the inner computation throws an exception, and the predicate returns
 * Nothing, then the whole computation will still fail with that exception.
 */
export function catchJust<E, M extends HKT3S>(
  M: MonadError<E, M>
): <B>(
  predicate: (e: E) => Option<B>
) => <U, A>(ma: HKT3As<M, U, E, A>, handler: (b: B) => HKT3As<M, U, E, A>) => HKT3As<M, U, E, A>
export function catchJust<E, M extends HKT2S>(
  M: MonadError<E, M>
): <B>(
  predicate: (e: E) => Option<B>
) => <A>(ma: HKT2As<M, E, A>, handler: (b: B) => HKT2As<M, E, A>) => HKT2As<M, E, A>
export function catchJust<E, M extends HKTS>(
  M: MonadError<E, M>
): <B>(predicate: (e: E) => Option<B>) => <A>(ma: HKTAs<M, A>, handler: (b: B) => HKTAs<M, A>) => HKTAs<M, A>
export function catchJust<E, M>(
  M: MonadError<E, M>
): <B>(predicate: (e: E) => Option<B>) => <A>(ma: HKT<M, A>, handler: (b: B) => HKT<M, A>) => HKT<M, A> {
  return predicate => (ma, handler) => M.catchError(ma, e => predicate(e).fold(() => M.throwError(e), b => handler(b)))
}

/**
 * Return `Right` if the given action succeeds, `Left` if it throws
 */
export function tryCatch<E, M extends HKT3S>(
  M: MonadError<E, M>
): <U, A>(ma: HKT3As<M, U, E, A>) => HKT3As<M, U, E, Either<E, A>>
export function tryCatch<E, M extends HKT2S>(
  M: MonadError<E, M>
): <A>(ma: HKT2As<M, E, A>) => HKT2As<M, E, Either<E, A>>
export function tryCatch<E, M extends HKTS>(M: MonadError<E, M>): <A>(ma: HKTAs<M, A>) => HKTAs<M, Either<E, A>>
export function tryCatch<E, M>(M: MonadError<E, M>): <A>(ma: HKT<M, A>) => HKT<M, Either<E, A>>
export function tryCatch<E, M>(M: MonadError<E, M>): <A>(ma: HKT<M, A>) => HKT<M, Either<E, A>> {
  return ma => M.catchError(M.map(a => right(a), ma), e => M.of(left(e)))
}

/**
 * Make sure that a resource is cleaned up in the event of an exception. The
 * release action is called regardless of whether the body action throws or
 * returns.
 */
export function withResource<E, M extends HKT3S>(
  M: MonadError<E, M>
): <U, R, A>(
  acquire: HKT3As<M, U, E, R>,
  release: (r: R) => HKT3As<M, U, E, void>,
  program: (r: R) => HKT3As<M, U, E, A>
) => HKT3As<M, U, E, A>
export function withResource<E, M extends HKT2S>(
  M: MonadError<E, M>
): <R, A>(
  acquire: HKT2As<M, E, R>,
  release: (r: R) => HKT2As<M, E, void>,
  program: (r: R) => HKT2As<M, E, A>
) => HKT2As<M, E, A>
export function withResource<E, M extends HKTS>(
  M: MonadError<E, M>
): <R, A>(acquire: HKTAs<M, R>, release: (r: R) => HKTAs<M, void>, program: (r: R) => HKTAs<M, A>) => HKTAs<M, A>
export function withResource<E, M>(
  M: MonadError<E, M>
): <R, A>(acquire: HKT<M, R>, release: (r: R) => HKT<M, void>, program: (r: R) => HKT<M, A>) => HKT<M, A>
export function withResource<E, M>(
  M: MonadError<E, M>
): <R, A>(acquire: HKT<M, R>, release: (r: R) => HKT<M, void>, program: (r: R) => HKT<M, A>) => HKT<M, A> {
  const tryCatchM = tryCatch(M)
  return (acquire, release, program) =>
    M.chain(
      r =>
        M.chain(
          result => M.chain(() => result.fold(e => M.throwError(e), a => M.of(a)), release(r)),
          tryCatchM(program(r))
        ),
      acquire
    )
}
