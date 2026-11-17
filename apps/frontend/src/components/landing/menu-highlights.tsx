'use client';
import { motion, useReducedMotion } from 'motion/react';
import { AmberRule } from '@/components/shared/amber-rule';
import { ImageFrame } from '@/components/shared/image-frame';
import { Reveal } from '@/components/shared/reveal';
import { menuHighlights } from '@/content/landing';

export function MenuHighlights() {
  const reduce = useReducedMotion();
  return (
    <section id="menu" className="section bg-surface pb-16 md:pb-20">
      <div className="container-page">
        <Reveal>
          <h2 className="text-4xl font-bold md:text-5xl">What&rsquo;s On</h2>
          <AmberRule />
        </Reveal>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {menuHighlights.map((m, i) => (
            <motion.article
              key={m.name}
              className="group border border-border bg-background transition-colors duration-200 hover:border-primary"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: reduce ? 0 : (i % 2) * 0.1, ease: 'easeOut' }}
            >
              <div className="overflow-hidden">
                <ImageFrame
                  src={m.src}
                  alt={m.name}
                  brief={m.brief}
                  className="aspect-[4/3] w-full transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold">{m.name}</h3>
                <p className="mt-2 text-muted-foreground">{m.desc}</p>
                <p className="mt-4 text-sm font-medium text-accent-text">{m.price}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
