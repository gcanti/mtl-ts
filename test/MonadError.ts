import * as assert from 'assert'
import { MonadError, MonadError1, MonadError2, catchJust, tryCatch, withResource } from '../src/MonadError'
import { getMonadError as getOptionMonadError } from '../src/MonadError/Option'
import { getMonadError as getEitherMonadError } from '../src/MonadError/Either'
import { getMonadError as getTaskEitherMonadError } from '../src/MonadError/TaskEither'
import { right, left } from 'fp-ts/lib/Either'
import { some, none, fromPredicate } from 'fp-ts/lib/Option'
import { HKT, URIS, URIS2, Type, Type2 } from 'fp-ts/lib/HKT'
import { Applicative, Applicative1, Applicative2C } from 'fp-ts/lib/Applicative'

describe('MonadError', () => {
  describe('instances', () => {
    function inverse<M extends URIS2>(
      M: MonadError2<M, string> & Applicative2C<M, string>
    ): (x: number) => Type2<M, string, number>
    function inverse<M extends URIS>(M: MonadError1<M, string> & Applicative1<M>): (x: number) => Type<M, number>
    function inverse<M>(M: MonadError<M, string> & Applicative<M>): (x: number) => HKT<M, number>
    function inverse<M>(M: MonadError<M, string> & Applicative<M>): (x: number) => HKT<M, number> {
      return x => (x === 0 ? M.throwError('cannot divide by zero') : M.of(1 / x))
    }

    it('Option', () => {
      const inverseM = inverse(getOptionMonadError(''))
      assert.deepEqual(inverseM(2), some(0.5))
      assert.deepEqual(inverseM(0), none)
    })

    it('Either', () => {
      const M = getEitherMonadError<string>()
      const inverseM = inverse(M)
      assert.deepEqual(inverseM(2), right(0.5))
      assert.deepEqual(inverseM(0), left('cannot divide by zero'))
    })

    it('TaskEither', () => {
      const M = getTaskEitherMonadError<string>()
      const inverseM = inverse(M)
      return Promise.all([inverseM(2).run(), inverseM(0).run()]).then(([a, b]) => {
        assert.deepEqual(a, right(0.5))
        assert.deepEqual(b, left('cannot divide by zero'))
      })
    })
  })

  it('catchJust', () => {
    type Error = 'a' | 'b'
    const M = getEitherMonadError<Error>()
    const catchJustM = catchJust(M)(fromPredicate(e => e === 'a'))
    assert.deepEqual(catchJustM(left<Error, number>('a'), e => right(2)), right(2))
    assert.deepEqual(catchJustM(left<Error, number>('b'), e => right(2)), left('b'))
  })

  it('tryCatch', () => {
    const tryCatchM = tryCatch(getOptionMonadError(undefined))
    assert.deepEqual(tryCatchM(none), some(left(undefined)))
    assert.deepEqual(tryCatchM(some(1)), some(right(1)))
  })

  it('withResource', () => {
    const withResourceM = withResource(getOptionMonadError(undefined))
    let called1 = false
    assert.deepEqual(
      withResourceM(
        some(1),
        n => {
          called1 = true
          return some(undefined)
        },
        n => some(n)
      ),
      some(1)
    )
    assert.strictEqual(called1, true)

    let called2 = false
    assert.deepEqual(
      withResourceM(
        some(1),
        n => {
          called2 = true
          return some(undefined)
        },
        n => none
      ),
      none
    )
    assert.strictEqual(called2, true)
  })
})
