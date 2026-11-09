import { customAlphabet } from "nanoid";

// 헷갈리는 글자(0/O, 1/l/I)를 뺀 알파벳. 링크를 소리 내어 불러 줄 때도 덜 틀린다.
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

/** 참여 링크 코드: /w/{code} */
export const newJoinCode = customAlphabet(ALPHABET, 7);

/** 선물 링크 코드: /g/{code}. 참여 코드와 구분되고 추측하기 더 어렵게 길게 만든다. */
export const newGiftCode = customAlphabet(ALPHABET, 10);
