export function resetPassword({
  email,
  resetLink,
}: {
  email: string;
  resetLink: string;
}) {
  console.log("Sending reset email", {
    email,
    resetLink,
  });
  return true;
}
