'use client';

import { useEffect, useState } from 'react';

const SCROLL_CONTAINER_SELECTOR = '[data-header-scroll-container="true"]';

export function useFloatingActionBarVisibility(targetId: string) {
   const [isPastTarget, setIsPastTarget] = useState(false);
   const [isScrollingDown, setIsScrollingDown] = useState(false);

   useEffect(() => {
      const target = document.getElementById(targetId);
      if (!target) return;

      const observer = new IntersectionObserver(
         ([entry]) => {
            setIsPastTarget(!entry.isIntersecting);
         },
         { threshold: 0 },
      );

      observer.observe(target);
      return () => observer.disconnect();
   }, [targetId]);

   useEffect(() => {
      const scrollElement = document.querySelector<HTMLElement>(
         SCROLL_CONTAINER_SELECTOR,
      );
      let lastScrollY = scrollElement
         ? scrollElement.scrollTop
         : window.scrollY;

      const handleScroll = () => {
         const currentScrollY = scrollElement
            ? scrollElement.scrollTop
            : window.scrollY;

         if (currentScrollY > lastScrollY + 10) {
            setIsScrollingDown(true);
         } else if (currentScrollY < lastScrollY - 10) {
            setIsScrollingDown(false);
         }

         lastScrollY = currentScrollY;
      };

      if (scrollElement) {
         scrollElement.addEventListener('scroll', handleScroll, {
            passive: true,
         });
         return () => scrollElement.removeEventListener('scroll', handleScroll);
      }

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   return isPastTarget && !isScrollingDown;
}
