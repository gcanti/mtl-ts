# Features

## MonadThrow

The `MonadThrow` type class represents those monads which support errors via
`throwError`, where `throwError e` halts, yielding the error `e`.

An implementation is provided for `Option`, `Either` and `TaskEither`

Laws:

- Left zero: `throwError e >>= f = throwError e`

```ts
interface MonadThrow<M, E> {
  readonly URI: M
  throwError: <A>(e: E) => HKT<M, A>
}
```

## MonadError

The `MonadError` type class represents those monads which support catching
errors.

- `catchError x f` calls the error handler `f` if an error is thrown during the
  evaluation of `x`.

An implementation is provided for for `Option`, `Either` and `TaskEither`

Laws:

- Catch: `catchError (throwError e) f = f e`
- Pure: `catchError (pure a) f = pure a`

```ts
interface MonadError<M, E> extends MonadThrow<M, E> {
  catchError: <A>(ma: HKT<M, A>, f: (e: E) => HKT<M, A>) => HKT<M, A>
}
```

Example

```ts
import { Applicative, Applicative2C } from 'fp-ts/lib/Applicative'
import { MonadError, MonadError2 } from 'mtl-ts/lib/MonadError'
import { HKT, URIS2, Type2 } from 'fp-ts/lib/HKT'
import { getMonadError } from 'mtl-ts/lib/MonadError/Either'

function inverse<M extends URIS2>(
  M: MonadError2<M, string> & Applicative2C<M, string>
): (x: number) => Type2<M, string, number>
function inverse<M>(M: MonadError<M, string> & Applicative<M>): (x: number) => HKT<M, number> {
  return x => (x === 0 ? M.throwError('cannot divide by zero') : M.of(1 / x))
}

const inverseM = inverse(getMonadError())

console.log(inverseM(2)) // right(0.5)
console.log(inverseM(0)) // left('cannot divide by zero')
```

## MonadReader

An implementation is provided for `Reader`

```ts
interface MonadReader<M, E> {
  readonly URI: M
  ask: () => HKT<M, E>
}
```

## MonadState

An implementation is provided for `State`

```ts
interface MonadState<M, S> {
  readonly URI: M
  get: () => HKT<M, S>
  put: (s: S) => HKT<M, void>
}
```

# Real world example

*Requirements*: given a user id, load its data from the localStorage. If there's no data, load its data from the server with `n` attempts intervalled by `m` milliseconds and store a successful result locally

```ts
import { HKT, URIS2, Type2 } from 'fp-ts/lib/HKT'
import { MonadError, MonadError2 } from 'mtl-ts/lib/MonadError'
import { Monad, Monad2C } from 'fp-ts/lib/Monad'
import { Functor } from 'fp-ts/lib/Functor'

interface MonadStorage<M> {
  readonly URI: M
  getItem: (name: string) => HKT<M, string>
  setItem: (name: string, value: string) => HKT<M, void>
}

interface MonadStorage2<M extends URIS2, E> {
  readonly URI: M
  getItem: (name: string) => Type2<M, E, string>
  setItem: (name: string, value: string) => Type2<M, E, void>
}

interface MonadDelay<M> {
  delay: <A>(millis: number, ma: HKT<M, A>) => HKT<M, A>
}

interface MonadDelay2<M extends URIS2> {
  delay: <A>(millis: number, ma: Type2<M, E, A>) => Type2<M, E, A>
}

interface User {
  name: string
}

interface MonadUser<M> {
  fetchUser: (id: string) => HKT<M, User>
}

interface MonadUser2<M extends URIS2, E> {
  fetchUser: (id: string) => Type2<M, E, User>
}

interface MonadApp<M, E> extends Monad<M>, MonadError<M, E>, MonadStorage<M>, MonadDelay<M>, MonadUser<M> {}

interface MonadApp2<M extends URIS2, E>
  extends Monad2C<M, E>,
    MonadError2<M, E>,
    MonadStorage2<M, E>,
    MonadDelay2<M>,
    MonadUser2<M, E> {}

//
// two useful combinators based on MonadError
//

function alt<E, M>(M: MonadError<M, E>): <A>(x: HKT<M, A>, y: HKT<M, A>) => HKT<M, A> {
  return (x, y) => M.catchError(x, () => y)
}

function attempt<E, M>(M: MonadError<M, E>): (times: number) => <A>(ma: HKT<M, A>) => HKT<M, A> {
  return times => ma => M.catchError(ma, e => (times <= 1 ? M.throwError(e) : attempt(M)(times - 1)(ma)))
}

//
// two useful combinators based on MonadStorage
//

const parse = <M>(M: MonadStorage<M> & Functor<M>) => <A>(name: string): HKT<M, A> => M.map(M.getItem(name), JSON.parse)

const save = <M>(M: MonadStorage<M> & Functor<M>) => (name: string) => <A>(a: A): HKT<M, A> =>
  M.map(M.setItem(name, JSON.stringify(a)), () => a)

//
// a combinator based on MonadError and MonadDelay
//

const delayedAttempts = <E, M>(M: MonadError<M, E> & MonadDelay<M>) => <A>(
  times: number,
  delay: number,
  ma: HKT<M, A>
) => alt(M)(ma, attempt(M)(times - 1)(M.delay(delay, ma)))

/** main program */
function program<M extends URIS2, E>(
  M: MonadApp2<M, E>
): (times: number, delay: number) => (id: string) => Type2<M, E, User>
function program<M, E>(M: MonadApp<M, E>): (times: number, delay: number) => (id: string) => HKT<M, User> {
  const namespace = 'user'
  const parseUser = parse(M)<User>(namespace)
  const saveUser = save(M)(namespace)
  return (times, delay) => id => {
    const attempts = delayedAttempts(M)(times, delay, M.fetchUser(id))
    return alt(M)(parseUser, M.chain(attempts, saveUser))
  }
}

//
// TaskEither instance
//

import { URI, TaskEither, tryCatch, fromEither, taskEither } from 'fp-ts/lib/TaskEither'
import { fromNullable } from 'fp-ts/lib/Either'
import { Task } from 'fp-ts/lib/Task'
import { getMonadError } from 'mtl-ts/lib/MonadError/TaskEither'

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

class Storage<A> {
  private storage: { [key: string]: A } = {}
  getItem(name: string): A | undefined {
    return this.storage[name]
  }
  setItem(name: string, value: A): void {
    this.storage[name] = value
  }
}

const storage = new Storage<string>()

// instance (with quick and dirty debugging)
const monadAppTaskEither: MonadApp2<URI, E> = {
  ...getMonadError(),
  fetchUser: id => tryCatch(() => fetchUserAPI(id), (): E => 'user not found'),
  getItem: name => {
    const e = fromNullable<E>('user not memoized')(storage.getItem(name))
    console.log(e.fold(e => `TaskEither: ${e}`, () => 'TaskEither: user memoized'))
    return fromEither(e)
  },
  setItem: (name, value) => {
    console.log(`TaskEither: memoizing ${name} ${value}`)
    return taskEither.of(storage.setItem(name, value))
  },
  delay: <L, A>(millis: number, ma: TaskEither<L, A>) => {
    return new TaskEither(delayTask(millis)(ma.value))
  }
}

// execution
const nrOfAttempts = 3
const millis = 1000
const id = '2'
const load = program(monadAppTaskEither)(nrOfAttempts, millis)
const result = load(id)
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
