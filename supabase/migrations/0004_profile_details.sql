-- =========================================================================
-- 0004: Extra personal details for the "Thông tin tài khoản" page
-- =========================================================================

alter table profiles
  add column if not exists date_of_birth date,
  add column if not exists gender text check (gender in ('MALE', 'FEMALE', 'OTHER'));

alter table profiles
  add constraint check_dob_past check (date_of_birth is null or date_of_birth <= current_date);
