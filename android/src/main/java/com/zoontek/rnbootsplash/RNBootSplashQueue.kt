package com.zoontek.rnbootsplash

import java.util.Vector

/**
 * Represents a first-in-first-out (FIFO) thread safe queue of objects.
 * Its source code is based on Java internal `Stack`.
 */
class RNBootSplashQueue<E> : Vector<E>() {

  @Synchronized
  fun shift(): E? {
    if (isEmpty()) {
      return null
    }

    val item = elementAt(0)
    removeElementAt(0)

    return item
  }

  fun push(item: E) {
    addElement(item)
  }
}
