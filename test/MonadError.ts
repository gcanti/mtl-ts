import * as assert from 'assert'
import { MonadError, catchJust } from '../src/MonadError'
import { monadErrorOption } from '../src/MonadError/Option'
import { getEitherMonadError } from '../src/MonadError/Either'
import { HKT } from 'fp-ts/lib/HKT'
import { right, left } from 'fp-ts/lib/Either'
import { some, none, fromPredicate } from 'fp-ts/lib/Option'
import { HKTS, HKTAs, HKT2S, HKT2As } from 'fp-ts/lib/HKT'

describe('MonadError', () => {
  it('instances', () => {
    function inverseGeneric<M extends HKT2S>(M: MonadError<void, M>): (x: number) => HKT2As<M, void, number>
    function inverseGeneric<M extends HKTS>(M: MonadError<void, M>): (x: number) => HKTAs<M, number>
    function inverseGeneric<M>(M: MonadError<void, M>): (x: number) => HKT<M, number> {
      return x => (x === 0 ? M.throwError(undefined) : M.of(1 / x))
    }
    const inverse = inverseGeneric(monadErrorOption)

    assert.deepEqual(inverse(2), some(0.5))
    assert.deepEqual(inverse(0), none)

    const inverseEither = inverseGeneric(getEitherMonadError())
    assert.deepEqual(inverseEither(2), right(0.5))
    assert.deepEqual(inverseEither(0), left(undefined))
  })

  it('catchJust', () => {
    type Error = 'a' | 'b'
    const me = getEitherMonadError<Error>()
    const catchJustA = catchJust(me)(fromPredicate(e => e === 'a'))
    assert.deepEqual(catchJustA(left<Error, number>('a'), e => right(2)), right(2))
    assert.deepEqual(catchJustA(left<Error, number>('b'), e => right(2)), left('b'))
  })
})
