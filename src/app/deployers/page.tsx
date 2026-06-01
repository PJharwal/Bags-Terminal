import { redirect } from 'next/navigation';

// Deployer analytics are not backed by real data yet; page hidden from nav.
export default function DeployersRedirect() {
  redirect('/pulse');
}
