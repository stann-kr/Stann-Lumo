'use client';

import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';

const tokens = [
  ['본문', '--color-primary', '#ffffff'],
  ['보조 본문', '--color-secondary', '#b8b8b8'],
  ['선택·포커스', '--color-accent', '#ff0033'],
  ['구획선', '--color-muted', '#333333'],
  ['보조 정보', '--color-text-muted', '#a0a0a0'],
  ['배경', '--color-bg', '#000000'],
];

export default function ThemePage() {
  return (
    <div className="space-y-8">
      <AdminSectionHeader title="Design system" description="현재 디자인을 확인하는 참조 화면입니다. 색상과 글꼴은 코드에서 관리하며 이 화면에서는 변경하거나 저장하지 않습니다." showSaveButton={false} />
      <AdminCard>
        <h2 className="text-xl font-semibold mb-6">색상</h2>
        <dl className="divide-y divide-[var(--color-muted)]">
          {tokens.map(([label, variable, value]) => <div key={variable} className="flex flex-wrap items-center gap-4 py-4">
            <span aria-hidden="true" className="h-10 w-10 border border-[var(--color-muted)]" style={{ background: `var(${variable})` }} />
            <dt className="flex-1 min-w-32">{label}</dt>
            <dd className="text-sm text-[var(--color-secondary)] break-all">{variable} / {value}</dd>
          </div>)}
        </dl>
      </AdminCard>
      <AdminCard>
        <h2 className="text-xl font-semibold mb-6">글꼴과 구성</h2>
        <div className="space-y-4 max-w-3xl text-[var(--color-secondary)]">
          <p>Inter를 영문 제목·본문에 사용하고, 한글은 Apple SD Gothic Neo와 Malgun Gothic을 우선 사용합니다. 날짜와 보조 정보에는 JetBrains Mono를 사용합니다.</p>
          <p>공개 화면은 큰 제목과 펼침 패널·콘텐츠 목록을 사용합니다. 관리자는 같은 글꼴과 구획선을 쓰며 입력·저장 작업에 맞는 크기를 유지합니다.</p>
          <p>홈은 저장 순서대로 앞 4개 항목을 패널로, 이후 항목을 보조 링크로 표시합니다. 미리보기는 음악 3개·공연 2개·이미지 3개까지 실제 공개 콘텐츠를 사용합니다.</p>
        </div>
      </AdminCard>
      <AdminCard>
        <h2 className="text-xl font-semibold mb-6">코드 관리 위치</h2>
        <dl className="space-y-5 text-sm">
          <div><dt className="font-mono break-all">src/styles/stann-os.css</dt><dd className="mt-2 text-[var(--color-secondary)]">STANN OS 공통 토큰의 사본입니다. 공유 정본과의 동기화 검사를 통과해야 하며 이 저장소에서 임의로 고치지 않습니다.</dd></div>
          <div><dt className="font-mono break-all">src/app/globals.css</dt><dd className="mt-2 text-[var(--color-secondary)]">공통 토큰을 Lumo 색상 변수로 연결합니다. 구획선과 보조 본문 등 Lumo 고유 값도 이곳에 있습니다.</dd></div>
          <div><dt className="font-mono break-all">src/styles/designV2.module.css</dt><dd className="mt-2 text-[var(--color-secondary)]">공개 화면과 관리자의 글꼴·기본 표면입니다. 각 화면의 배치와 반응형 규칙은 해당 컴포넌트의 CSS Module에서 관리합니다.</dd></div>
          <div><dt className="font-mono break-all">src/styles/colors.ts</dt><dd className="mt-2 text-[var(--color-secondary)]">JavaScript에서 참조하는 색상 값입니다. CSS 변수와 실제 사용 범위를 함께 확인합니다.</dd></div>
        </dl>
      </AdminCard>
    </div>
  );
}
