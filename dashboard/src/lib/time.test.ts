import { describe, expect, it } from 'vitest'
import { formatTime, parseTime } from './time'

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [59, '0:59'],
    [754, '12:34'],
    [3600, '1:00:00'],
    [5025, '1:23:45'],
  ])('%i -> %s', (input, expected) => {
    expect(formatTime(input)).toBe(expected)
  })
})

describe('parseTime', () => {
  it.each([
    ['45', 2700],
    ['0', 0],
    ['12:34', 754],
    ['90:00', 5400],
    ['1:23:45', 5025],
    [' 1:02:03 ', 3723],
  ])('%s -> %i', (input, expected) => {
    expect(parseTime(input)).toBe(expected)
  })

  it.each(['', 'abc', '1:60', '1:60:00', '1:2:3:4', '1:', ':30', '-5', '1.5'])(
    'rejects %j',
    (input) => {
      expect(parseTime(input)).toBeNull()
    },
  )
})
