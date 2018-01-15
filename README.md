# MonadThrow

The `MonadThrow` type class represents those monads which support errors via
`throwError`, where `throwError e` halts, yielding the error `e`.

An implementation is provided for `Option` and `Either`

Laws:

- Left zero: `throwError e >>= f = throwError e`

```ts
export interface MonadThrow<M, E> {
  throwError<A>(e: E): HKT2<M, E, A>
}
```

# MonadError

The `MonadError` type class represents those monads which support catching
errors.

- `catchError x f` calls the error handler `f` if an error is thrown during the
  evaluation of `x`.

An implementation is provided for for `Option` and `Either`

Laws:

- Catch: `catchError (throwError e) f = f e`
- Pure: `catchError (pure a) f = pure a`

```ts
export interface MonadError<M, E> extends MonadThrow<M, E> {
  catchError<A>(ma: HKT2<M, E, A>, f: (e: E) => HKT2<M, E, A>): HKT2<M, E, A>
}
```

Example

```ts
import { Applicative2 } from 'fp-ts/lib/Applicative'
import { MonadError } from 'mtl-ts/lib/MonadError'
import { HKT2, HKT2S, HKT2As } from 'fp-ts/lib/HKT'
import { getEitherMonadError } from 'mtl-ts/lib/MonadError/Either'

function inverseM<M extends HKT2S>(
  M: MonadError<M, string> & Applicative2<M, string>
): (x: number) => HKT2As<M, string, number>
function inverseM<M>(M: MonadError<M, string> & Applicative2<M, string>): (x: number) => HKT2<M, string, number> {
  return x => (x === 0 ? M.throwError('cannot divide by zero') : M.of(1 / x))
}

const inverse = inverseM(getEitherMonadError())

console.log(inverse(2)) // right(0.5)
console.log(inverse(0)) // left('cannot divide by zero')
```

# MonadReader

```ts
export interface MonadReader<M, E> {
  ask(): HKT2<M, E, E>
}
```

# MonadState

```ts
export interface MonadState<M, S> {
  get(): HKT2<M, S, S>
  put(s: S): HKT2<M, S, void>
}
```
