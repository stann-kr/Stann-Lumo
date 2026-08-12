import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

/**
 * STANN OS 토큰 드리프트 가드 (prebuild 훅).
 * src/styles/stann-os.css는 정본(stann-web/src/styles/stann-os.css)의 복사본.
 * 사본 무단 편집 차단 — 빌드 전 해시 검증.
 *
 * 정본이 바뀌면(동기화 의식):
 *   1. 정본 파일을 이 경로로 복사
 *   2. 아래 EXPECTED_MD5를 새 해시로 갱신 (3레포 동일 값)
 */
const EXPECTED_MD5 = "d9921656347ebc0c38c07f9016816811";

const cssPath = fileURLToPath(new URL("../src/styles/stann-os.css", import.meta.url));
const actual = createHash("md5").update(readFileSync(cssPath)).digest("hex");

if (actual !== EXPECTED_MD5) {
  console.error(
    `\n✖ [stann-os] 토큰 드리프트 감지\n` +
      `  파일: ${cssPath}\n` +
      `  기대: ${EXPECTED_MD5}\n` +
      `  실제: ${actual}\n` +
      `  → 정본(stann-web/src/styles/stann-os.css)에서 복사하거나,\n` +
      `    정본 변경이 의도된 경우 이 스크립트의 EXPECTED_MD5를 갱신하세요.\n`,
  );
  process.exit(1);
}
console.log("✓ [stann-os] 토큰 동기화 확인");
