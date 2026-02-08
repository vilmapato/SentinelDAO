"use client";

import { useEffect, useRef, useState } from "react";

type SectionProps = {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export const Section = ({ id, number, title, children, className = "" }: SectionProps) => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`min-h-screen flex items-center justify-center px-4 sm:px-8 lg:px-16 py-20 ${className}`}
    >
      <div
        className={`max-w-6xl w-full transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="mb-12">
          <span className="font-mono text-orange-500 text-lg uppercase tracking-wider">// {number}</span>
          <h2 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold mt-4 mb-8 leading-none">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
};
