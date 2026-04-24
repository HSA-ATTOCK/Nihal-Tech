import UnverifiedClient from "./UnverifiedClient";

export default function UnverifiedPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  return <UnverifiedClient initialEmail={searchParams?.email || ""} />;
}
