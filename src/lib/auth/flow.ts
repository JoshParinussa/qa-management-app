export function getPostLoginRedirect(user: { mustChangePassword: boolean }) {
  return user.mustChangePassword ? "/change-password" : "/dashboard";
}

export function validateNewPassword(password: string, confirmPassword: string): { ok: true } | { ok: false; error: string } {
  if (password.length < 8) {
    return { ok: false, error: "Password minimal 8 karakter." };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Konfirmasi password tidak sama." };
  }

  return { ok: true };
}
