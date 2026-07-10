# 팀 업무 보드 — Supabase 연결 가이드

팀원이 같은 데이터를 함께 쓰도록 Supabase(공용 DB)에 연결하는 순서입니다.
**직접 하셔야 하는 부분**과 **제가(개발) 처리하는 부분**을 나눠 적었습니다.

---

## 1단계. Supabase 프로젝트 만들기 (직접)

1. https://supabase.com 접속 → **Sign in**(GitHub 계정으로 가입 추천)
2. **New project** 클릭
3. 입력:
   - Name: `larose-team` (아무거나)
   - Database Password: 아무 강한 비밀번호 (메모해두기 — 나중에 거의 안 씀)
   - Region: `Northeast Asia (Seoul)` 선택
4. **Create new project** → 1~2분 대기

---

## 2단계. 테이블 만들기 (직접 — 복붙만 하면 됨)

1. 왼쪽 메뉴 → **SQL Editor** → **New query**
2. 아래 SQL 전체를 붙여넣고 **Run** (▶)

```sql
-- 업무
create table if not exists tasks (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 팀원
create table if not exists members (
  idx int primary key,
  data jsonb not null
);

-- 담당 매장
create table if not exists stores (
  name text primary key,
  data jsonb not null
);

-- 매장 이슈
create table if not exists issues (
  id text primary key,
  data jsonb not null
);

-- 팀원 백업(조직이동·퇴사)
create table if not exists member_archive (
  id text primary key,
  data jsonb not null
);

-- 내부 팀 도구라 우선 전체 접근 허용 (로그인은 나중에 추가 가능)
alter table tasks          enable row level security;
alter table members        enable row level security;
alter table stores         enable row level security;
alter table issues         enable row level security;
alter table member_archive enable row level security;

create policy "allow all" on tasks          for all using (true) with check (true);
create policy "allow all" on members        for all using (true) with check (true);
create policy "allow all" on stores         for all using (true) with check (true);
create policy "allow all" on issues         for all using (true) with check (true);
create policy "allow all" on member_archive for all using (true) with check (true);
```

> 참고: 지금은 "누구나 접근 가능"으로 열어둡니다. 회사 내부용이고 주소를 아는 사람만 씀.
> 나중에 팀원 로그인/권한이 필요하면 이 정책을 바꾸면 됩니다.

---

## 3단계. 접속 키 2개 복사 (직접)

1. 왼쪽 메뉴 맨 아래 **Project Settings**(톱니) → **API**
2. 아래 두 값을 복사해서 저에게 주시거나, 4단계 파일에 직접 붙여넣으세요:
   - **Project URL** — `https://xxxxx.supabase.co`
   - **anon public** 키 — `eyJhbGci...` (긴 문자열, `anon` `public` 라벨이 붙은 것)

> ⚠️ `service_role` 키는 절대 공유하지 마세요. 우리가 쓰는 건 **anon public** 키입니다.
> (anon 키는 브라우저에 노출돼도 되는 공개용 키예요.)

---

## 4단계. 키 넣기 (직접 or 함께)

프로젝트 폴더에 `.env.local` 파일을 만들고 아래처럼 넣습니다 (`.gitignore`에 이미 제외돼 있어 안전):

```
NEXT_PUBLIC_SUPABASE_URL=여기에_Project_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_public_키
```

Vercel 배포 시엔 Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables**에도
같은 이름 2개를 등록합니다. (이 부분은 배포 단계에서 함께 진행)

---

## 5단계. 변경 기록 + 실시간 동기화 활성화 (직접 — 복붙 1회)

React 전환 후 추가된 기능(누가 뭘 수정했는지 기록 + 새로고침 없는 실시간 반영)을 켜려면
**SQL Editor**에서 아래를 한 번 실행하세요:

```sql
-- 변경 기록 테이블
create table if not exists activity_log (
  id bigint generated always as identity primary key,
  actor text not null,
  action text not null,
  target text,
  detail jsonb,
  created_at timestamptz default now()
);
alter table activity_log enable row level security;
create policy "allow all" on activity_log for all using (true) with check (true);

-- 실시간 동기화 (테이블 변경을 접속자 전원에게 푸시)
do $$ declare t text;
begin
  foreach t in array array['tasks','members','stores','issues','member_archive','activity_log'] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
```

> 실행 전에도 앱은 정상 동작합니다(저장·불러오기 OK).
> 이 SQL은 "실시간 푸시"와 "변경 기록"만 추가로 켜는 것입니다.

---

## 6단계. 주간회의 점검표 탭 활성화 (직접 — 복붙 1회)

"주간점검" 탭(롯데 주간회의 점검표 대시보드)을 공용 저장하려면 **SQL Editor**에서 아래를 실행하세요:

```sql
create table if not exists weekly_reports (
  id text primary key,
  data jsonb not null
);
alter table weekly_reports enable row level security;
create policy "allow all" on weekly_reports for all using (true) with check (true);

alter publication supabase_realtime add table weekly_reports;
```

> 실행 전에도 탭은 동작하지만(로컬 저장 불가, 새로고침 시 사라짐) 팀원 간 공유가 안 됩니다.

---

## 완료된 것 (개발)

- 보드가 Next.js 앱 `/team` 경로로 전환됨 (React)
- 팀원별 PIN 로그인 (기본 1234, 팀원 설정에서 변경)
- 모든 수정에 이름 기록 (헤더 🕘 변경 기록)
- Supabase 실시간 구독 — 팀원 변경사항 즉시 반영
- 모바일: 하단 탭 바 + 반응형
