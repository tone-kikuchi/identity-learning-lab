import { webcrypto } from 'node:crypto';
import { TextDecoder, TextEncoder } from 'node:util';

if (!globalThis.crypto?.subtle) {
  globalThis.crypto = webcrypto;
}

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder;
}

if (!globalThis.btoa) {
  globalThis.btoa = (value) => Buffer.from(value, 'binary').toString('base64');
}

if (!globalThis.atob) {
  globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');
}
