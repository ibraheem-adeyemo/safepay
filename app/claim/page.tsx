import ClaimForm from "./ClaimForm";

export default async function ClaimAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ClaimForm token={token} />;
}
