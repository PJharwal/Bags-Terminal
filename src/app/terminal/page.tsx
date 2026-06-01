import { redirect } from 'next/navigation';

// The standalone terminal index is merged into Pulse; per-token terminals
// live at /terminal/[tokenId] (reached from Pulse, Trending, and search).
export default function TerminalIndexRedirect() {
  redirect('/pulse');
}
