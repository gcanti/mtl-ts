import * as assert from 'assert'
import { MonadError, catchJust, tryCatch, withResource } from '../src/MonadError'
import { monadErrorOption } from '../src/MonadError/Option'
import { getEitherMonadError } from '../src/MonadError/Either'
import { getTaskEitherMonadError } from '../src/MonadError/TaskEither'
import { HKT } from 'fp-ts/lib/HKT'
import { right, left } from 'fp-ts/lib/Either'
import { some, none, fromPredicate } from 'fp-ts/lib/Option'
import { HKTS, HKTAs, HKT2S, HKT2As } from 'fp-ts/lib/HKT'
import { Applicative2 } from 'fp-ts/lib/Applicative'

describe('MonadError', () => {
  describe('instances', () => {
    function inverseGeneric<M extends HKT2S>(
      M: MonadError<M, void> & Applicative2<M, void>
    ): (x: number) => HKT2As<M, void, number>
    function inverseGeneric<M extends HKTS>(
      M: MonadError<M, void> & Applicative2<M, void>
    ): (x: number) => HKTAs<M, number>
    function inverseGeneric<M>(M: MonadError<M, void> & Applicative2<M, void>): (x: number) => HKT<M, number> {
      return x => (x === 0 ? M.throwError(undefined) : M.of(1 / x))
    }

    it('Option', () => {
      const inverse = inverseGeneric(monadErrorOption)
      assert.deepEqual(inverse(2), some(0.5))
      assert.deepEqual(inverse(0), none)
    })

    it('Either', () => {
      const inverseEither = inverseGeneric(getEitherMonadError())
      assert.deepEqual(inverseEither(2), right(0.5))
      assert.deepEqual(inverseEither(0), left(undefined))
    })

    it('TaskEither', () => {
      const inverseTaskEither = inverseGeneric(getTaskEitherMonadError())
      return Promise.all([inverseTaskEither(2).run(), inverseTaskEither(0).run()]).then(([a, b]) => {
        assert.deepEqual(a, right(0.5))
        assert.deepEqual(b, left(undefined))
      })
    })
  })

  it('catchJust', () => {
    type Error = 'a' | 'b'
    const catchJustM = catchJust(getEitherMonadError<Error>())(fromPredicate(e => e === 'a'))
    assert.deepEqual(catchJustM(left<Error, number>('a'), e => right(2)), right(2))
    assert.deepEqual(catchJustM(left<Error, number>('b'), e => right(2)), left('b'))
  })

  it('tryCatch', () => {
    const tryCatchM = tryCatch(monadErrorOption)
    assert.deepEqual(tryCatchM(none), some(left(undefined)))
    assert.deepEqual(tryCatchM(some(1)), some(right(1)))
  })

  it('withResource', () => {
    const withResourceM = withResource(monadErrorOption)
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
