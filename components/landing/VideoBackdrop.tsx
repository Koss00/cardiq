'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Ambient AI-footage layer for a section. Lazy: the <video> only mounts
 * once the section is within ~1.5 viewports, so below-fold clips don't
 * weigh down first paint. Renders nothing if the clip (and its fallback)
 * are missing or fail, so sections degrade to their CSS glow backgrounds.
 * Always sits behind content and never captures input.
 */
export default function VideoBackdrop({
  src,
  fallbackSrc,
  opacity = 0.45,
  soft = false, // soft scrim for use inside panels; default fades to page bg for full sections
}: {
  src: string;
  fallbackSrc?: string; // tried once if src is missing, before giving up
  opacity?: number;
  soft?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [activeSrc, setActiveSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (fallbackSrc && activeSrc !== fallbackSrc) setActiveSrc(fallbackSrc);
    else setFailed(true);
  };

  // Mount the video only when the section approaches the viewport
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '150% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Belt & braces: catch errors that raced ahead of the onError handler
  useEffect(() => {
    const v = videoRef.current;
    if (v && (v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)) handleError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSrc, inView]);

  if (failed) return null;

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {inView && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity }}
          src={activeSrc}
          autoPlay
          muted
          loop
          playsInline
          onError={handleError}
        />
      )}
      {/* Readability scrim — keeps copy crisp over any footage */}
      <div
        className="absolute inset-0"
        style={{
          background: soft
            ? 'rgba(6,14,28,0.45)'
            : 'linear-gradient(180deg, rgba(6,14,28,0.82) 0%, rgba(6,14,28,0.35) 40%, rgba(6,14,28,0.55) 75%, #060E1C 100%)',
        }}
      />
    </div>
  );
}
