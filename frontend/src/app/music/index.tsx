import { createFileRoute } from '@tanstack/react-router';
import { MusicPage } from '@/components/Music/MusicPage';

export const Route = createFileRoute('/music/')({
  component: MusicPage,
});
