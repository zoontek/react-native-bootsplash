package com.zoontek.rnbootsplash

/** Represents a first-in-first-out (FIFO) thread safe queue of objects. */
class RNBootSplashQueue<E> {
  private val queue = ArrayDeque<E>()

  @Synchronized fun shift(): E? = queue.removeFirstOrNull()

  @Synchronized
  fun push(item: E) {
    queue.addLast(item)
  }
}
