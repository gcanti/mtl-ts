import * as reader from 'fp-ts/lib/Reader'
import { MonadReader } from './index'
import { Monad2 } from 'fp-ts/lib/Monad'

export const getReaderMonadReader = <E>(): MonadReader<reader.URI, E> & Monad2<reader.URI, E> => {
  return reader
}
