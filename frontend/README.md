# React UI Template

> A modern, reusable React UI template with Header + Sidebar + Content layout, extracted from a production application for seamless integration into new projects.

## 🎯 Project Overview

이 프로젝트는 `/home/optrader/dev/receipt-manager/frontend`에서 구현된 검증된 UI 구조를 추출하여, 다른 프로젝트에서 쉽게 재사용할 수 있는 템플릿으로 만드는 것을 목표로 합니다.

### 핵심 목표

1. **Phase 1**: Receipt Manager의 Layout 시스템을 이 프로젝트로 이식
   - Header, Sidebar, Content 구조
   - 반응형 디자인 및 모바일 최적화
   - 라이브러리 설정 및 의존성 관리

2. **Phase 2**: 다른 프로젝트에서 템플릿처럼 쉽게 활용할 수 있는 구조 개발
   - 플러그인/템플릿 시스템
   - 설정 기반 커스터마이징
   - 문서화 및 사용 가이드

## 🛠 기술 스택

### 핵심 프레임워크

- **React 18.3.1** - 현대적인 React 기능 활용
- **TypeScript 5.8.3** - 타입 안전성과 개발자 경험 향상
- **Vite** - 고성능 번들러 (ESBuild 기반)

### UI & 스타일링

- **Tailwind CSS 4.1.11** - 유틸리티 우선 CSS 프레임워크
- **SCSS Modules** - 컴포넌트 스코프 스타일링
- **Radix UI** - 접근성과 사용성이 검증된 UI 프리미티브
  - Dialog, Navigation, Select, Tooltip 등
- **Lucide React** - 일관된 아이콘 시스템
- **Class Variance Authority (CVA)** - 타입 안전한 변형 관리

### 상태 관리 & 라우팅

- **TanStack Router** - 타입 안전한 파일 기반 라우팅
- **TanStack Query** - 서버 상태 관리
- **Zustand** - 클라이언트 상태 관리

### 개발 도구

- **ESLint 9** - 코드 품질 관리
- **Prettier 3.5** - 코드 포맷팅
- **PostCSS** - CSS 후처리
- **Hot Module Replacement** - 개발 경험 최적화

## 📁 프로젝트 구조

### 현재 Receipt Manager 구조 분석

```
src/
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx          # 메인 레이아웃 컨테이너
│   │   ├── Header.tsx          # 상단 헤더 (로고, 네비게이션, 사용자 메뉴)
│   │   ├── Sidebar.tsx         # 사이드 네비게이션
│   │   ├── Content.tsx         # 콘텐츠 영역 래퍼
│   │   └── *.module.scss       # 각 컴포넌트별 스타일
│   ├── ui2/                    # 재사용 가능한 UI 컴포넌트
│   │   ├── Button.tsx          # CVA 기반 버튼 컴포넌트
│   │   ├── Input.tsx           # 입력 컴포넌트
│   │   └── *.module.scss
│   └── ui/                     # Radix UI 래퍼 컴포넌트
├── app/                        # 파일 기반 라우팅 (Next.js 스타일)
│   ├── __root.tsx             # 루트 레이아웃
│   ├── index.tsx              # 홈 페이지 (/)
│   ├── dashboard/             # /dashboard 라우트
│   └── ...
├── constants/
│   └── navigation.tsx         # 네비게이션 아이템 정의
├── types/
│   └── index.ts              # 타입 정의
├── hooks/
│   └── useAuth.tsx           # 인증 로직
├── utils/
│   └── cn.ts                 # 클래스 네임 유틸리티
└── styles/
    └── globals.css           # 전역 스타일
```

### 계획된 Template 구조

```
react-ui-template/
├── src/
│   ├── components/
│   │   ├── Layout/           # 핵심 레이아웃 시스템
│   │   ├── ui/               # 기본 UI 컴포넌트
│   │   └── templates/        # 다양한 레이아웃 템플릿
│   ├── config/              # 설정 파일들
│   ├── types/               # 타입 정의
│   ├── utils/               # 유틸리티 함수들
│   └── examples/            # 사용 예제들
├── templates/               # 완성된 템플릿들
├── scripts/                 # 템플릿 생성/설정 스크립트
└── docs/                    # 상세 문서
```

## 🏗 핵심 컴포넌트 분석

### Layout System

#### 1. **Layout.tsx** - 메인 레이아웃 컨테이너

- **반응형 디자인**: 데스크톱과 모바일에서 다른 사이드바 동작
- **상태 관리**: 사이드바 가시성, 인증 상태
- **라우팅 연동**: TanStack Router와 완전 통합
- **미디어 쿼리**: `useMediaQuery` 훅으로 반응형 처리

```typescript
// 핵심 기능
- 사이드바 토글 (데스크톱: 숨김/표시, 모바일: 오버레이)
- 인증 상태에 따른 조건부 렌더링
- 동적 네비게이션 아이템 활성 상태 관리
- 모바일 최적화된 UX (오버레이, 터치 친화적)
```

#### 2. **Header.tsx** - 상단 헤더

- **브랜드 영역**: 로고 + 애플리케이션 이름
- **네비게이션**: 미인증 사용자용 메뉴 (Features, Pricing, Support)
- **사용자 액션**: 로그인/로그아웃 버튼
- **모바일 메뉴**: 햄버거 메뉴로 사이드바 토글

#### 3. **Sidebar.tsx** - 사이드 네비게이션

- **동적 네비게이션**: `navigationItems` 배열 기반
- **활성 상태**: 현재 라우트에 따른 하이라이트
- **아이콘 + 라벨**: Lucide React 아이콘 시스템
- **접근성**: 키보드 네비게이션 지원

## 🎨 디자인 시스템

### Color Scheme

- Primary: 브랜드 컬러 기반
- Secondary: 보조 액션용
- Ghost: 미니멀한 호버 효과
- Destructive: 위험한 액션용

### Typography

- 일관된 폰트 크기 및 두께
- 계층적 정보 구조
- 가독성 최적화

### Spacing & Layout

- CSS Grid 및 Flexbox 활용
- 일관된 여백 시스템
- 반응형 그리드

## 🚀 설치 및 실행

### Prerequisites

- Node.js 18.x 이상
- npm 또는 yarn

### Phase 1 개발 환경 구성

```bash
# 1. 의존성 복사 (Receipt Manager에서)
cp /home/optrader/dev/receipt-manager/frontend/package.json .
cp /home/optrader/dev/receipt-manager/frontend/tsconfig.json .
cp /home/optrader/dev/receipt-manager/frontend/rsbuild.config.ts .

# 2. 필요한 파일들 복사
cp -r /home/optrader/dev/receipt-manager/frontend/src/components/Layout ./src/components/
cp -r /home/optrader/dev/receipt-manager/frontend/src/components/ui2 ./src/components/
cp -r /home/optrader/dev/receipt-manager/frontend/src/types ./src/
cp -r /home/optrader/dev/receipt-manager/frontend/src/utils ./src/

# 3. 의존성 설치
npm install

# 4. 개발 서버 실행
npm run dev
```

## 🔧 개발 가이드

### 컴포넌트 개발 원칙

1. **TypeScript First**: 모든 컴포넌트는 타입 안전성 보장
2. **SCSS Modules**: 스타일 캡슐화 및 CSS 클래스 충돌 방지
3. **Composition Pattern**: 재사용성과 확장성을 위한 합성 패턴
4. **Accessibility**: WCAG 2.1 AA 준수

### 커스터마이징 가이드

#### Navigation Items 수정

```typescript
// src/constants/navigation.tsx
export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home />,
    href: '/dashboard',
  },
  // 새로운 아이템 추가...
];
```

#### 테마 커스터마이징

```scss
// src/styles/theme.scss
:root {
  --primary-color: #your-brand-color;
  --secondary-color: #your-secondary-color;
  // 추가 CSS 변수들...
}
```

### 성능 최적화

- **Code Splitting**: TanStack Router의 자동 코드 분할
- **Tree Shaking**: 사용되지 않는 코드 제거
- **CSS Optimization**: 미사용 CSS 제거
- **Image Optimization**: 이미지 지연 로딩

## 🗺 로드맵

### Phase 1: UI 이식 (현재 단계)

- [ ] Layout 컴포넌트 이식
- [ ] UI 컴포넌트 라이브러리 구축
- [ ] 기본 라우팅 구조 설정
- [ ] 반응형 디자인 완성
- [ ] 타입 정의 완성

### Phase 2: 템플릿화

- [ ] 설정 기반 커스터마이징 시스템
- [ ] CLI 도구 개발
- [ ] 템플릿 생성 스크립트
- [ ] 테마 시스템 구축
- [ ] 플러그인 아키텍처

### Phase 3: 에코시스템

- [ ] 추가 레이아웃 템플릿들
- [ ] 컴포넌트 라이브러리 확장
- [ ] Storybook 통합
- [ ] 단위/통합 테스트 구축
- [ ] 문서 사이트 구축

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 감사의 말

이 프로젝트는 Receipt Manager 애플리케이션에서 검증된 UI/UX 패턴을 바탕으로 구축되었습니다. 실제 프로덕션 환경에서 사용되던 코드를 기반으로 하여 안정성과 사용성이 보장됩니다.

---

**Made with ❤️ for the React community**
