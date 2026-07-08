import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { MEDIA_ORIGIN } from '../lib/media';
import Audio from './Audio.astro';

describe('Audio', () => {
  it('renders a native, controllable audio element pointed at the R2 origin', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Audio, {
      props: { src: '2026/my-post/clip.mp3' },
    });

    expect(html).toContain('<audio');
    expect(html).toContain('controls');
    expect(html).toContain('preload="metadata"');
    expect(html).toContain(`src="${MEDIA_ORIGIN}/2026/my-post/clip.mp3"`);
  });

  it('passes an already-absolute src through mediaUrl unchanged', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Audio, {
      props: { src: 'https://example.com/clip.mp3' },
    });

    expect(html).toContain('src="https://example.com/clip.mp3"');
  });

  it('defaults the source type to audio/mpeg', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Audio, {
      props: { src: '2026/my-post/clip.mp3' },
    });

    expect(html).toContain('type="audio/mpeg"');
  });

  it('accepts an explicit type override', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Audio, {
      props: { src: '2026/my-post/clip.ogg', type: 'audio/ogg' },
    });

    expect(html).toContain('type="audio/ogg"');
  });

  it('passes slotted caption/transcript tracks through to the audio element', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Audio, {
      props: { src: '2026/my-post/clip.mp3' },
      slots: {
        default:
          '<track kind="captions" src="/captions/clip.en.vtt" srclang="en" label="English" />',
      },
    });

    expect(html).toContain('<track');
    expect(html).toContain('kind="captions"');
  });
});
