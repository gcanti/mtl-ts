# Features

## MonadThrow

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

## MonadError

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

## MonadReader

```ts
export interface MonadReader<M, E> {
  ask(): HKT2<M, E, E>
}
```

## MonadState

```ts
export interface MonadState<M, S> {
  get(): HKT2<M, S, S>
  put(s: S): HKT2<M, S, void>
}
```

# Real world example

*Requirements*: given a user id, load its data from the localStorage. If there's no data, load its data from the server with `n` attempts
intervalled by `m` milliseconds and store a successful result locally

```ts
import { HKT2 } from 'fp-ts/lib/HKT'
import { MonadThrow, MonadError } from 'mtl-ts/lib/MonadError'
import { Monad2 } from 'fp-ts/lib/Monad'
import { Functor2 } from 'fp-ts/lib/Functor'

interface MonadStorage<M, E> extends MonadThrow<M, E> {
  getItem(name: string): HKT2<M, E, string>
  setItem(name: string, value: string): HKT2<M, E, void>
}

interface MonadDelay<M> {
  delay<L, A>(millis: number, ma: HKT2<M, L, A>): HKT2<M, L, A>
}

interface User {
  name: string
}

interface MonadUser<M, E> {
  fetchUser(id: string): HKT2<M, E, User>
}

interface MonadApp<M, E> extends Monad2<M, E>, MonadError<M, E>, MonadStorage<M, E>, MonadDelay<M>, MonadUser<M, E> {}

//
// two useful combinators based on MonadError
//

function alt<E, M>(M: MonadError<M, E>): <A>(x: HKT2<M, E, A>, y: HKT2<M, E, A>) => HKT2<M, E, A> {
  return (x, y) => M.catchError(x, () => y)
}

function attempt<E, M>(M: MonadError<M, E>): (times: number) => <A>(ma: HKT2<M, E, A>) => HKT2<M, E, A> {
  return times => ma => M.catchError(ma, e => (times <= 1 ? M.throwError(e) : attempt(M)(times - 1)(ma)))
}

//
// two useful combinators based on MonadStorage
//

const parse = <E, M>(M: MonadStorage<M, E> & Functor2<M, E>) => <A>(name: string): HKT2<M, E, A> =>
  M.map(JSON.parse, M.getItem(name))

const save = <E, M>(M: MonadStorage<M, E> & Functor2<M, E>) => (name: string) => <A>(a: A): HKT2<M, E, A> =>
  M.map(() => a, M.setItem(name, JSON.stringify(a)))

//
// a combinator based on MonadError and MonadDelay
//

const delayedAttempts = <E, M>(M: MonadError<M, E> & MonadDelay<M>) => <A>(
  times: number,
  delay: number,
  ma: HKT2<M, E, A>
) => alt(M)(ma, attempt(M)(times - 1)(M.delay(delay, ma)))

/** main program */
function program<E, M>(M: MonadApp<M, E>): (times: number, delay: number) => (id: string) => HKT2<M, E, User> {
  const namespace = 'user'
  const parseUser = parse(M)<User>(namespace)
  const saveUser = save(M)(namespace)
  return (times, delay) => id => {
    const attempts = delayedAttempts(M)(times, delay, M.fetchUser(id))
    return alt(M)(parseUser, M.chain(user => saveUser(user), attempts))
  }
}

//
// TaskEither instance
//

import * as te from 'fp-ts/lib/TaskEither'
import * as either from 'fp-ts/lib/Either'
import { Task } from 'fp-ts/lib/Task'
import { getTaskEitherMonadError } from 'mtl-ts/lib/MonadError/TaskEither'

// faked API
const fetchUserAPI = (id: string): Promise<User> => {
  console.log(`fetchUserAPI(${id})`)
  return id === '1' ? Promise.resolve({ name: 'Giulio' }) : Promise.reject(undefined)
}

// helper
const delayTask = (millis: number) => <A>(ma: Task<A>): Task<A> => {
  return new Task(
    () =>
      new Promise(resolve => {
        setTimeout(() => ma.run().then(resolve), millis)
      })
  )
}

// error type
type E = 'user not memoized' | 'user not found'

// instance (with quick and dirty debugging)
const monadAppTaskEither: MonadApp<te.URI, E> = {
  ...getTaskEitherMonadError(),
  fetchUser: id => te.tryCatch(() => fetchUserAPI(id), (): E => 'user not found'),
  getItem: name => {
    const e = either.fromNullable<E>('user not memoized')(localStorage.getItem(name))
    console.log(e.fold(e => `TaskEither: ${e}`, () => 'TaskEither: user memoized'))
    return te.fromEither(e)
  },
  setItem: (name, value) => {
    console.log(`TaskEither: memoizing ${name} ${value}`)
    return te.of(localStorage.setItem(name, value))
  },
  delay: <L, A>(millis: number, ma: te.TaskEither<L, A>) => {
    return new te.TaskEither(delayTask(millis)(ma.value))
  }
}

// execution
const nrOfAttempts = 3
const millis = 1000
const id = '2'
const load = program(monadAppTaskEither)(nrOfAttempts, millis)
const result = load(id) as te.TaskEither<E, User>
result.run().then(x => console.log(x))
/*
Output:
TaskEither: user not memoized
fetchUserAPI(2)
fetchUserAPI(2)
fetchUserAPI(2)
Left("user not found")
*/
```
