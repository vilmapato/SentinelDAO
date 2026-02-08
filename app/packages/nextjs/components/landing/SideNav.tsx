"use client";

import { useEffect, useState } from "react";

type SideNavProps = {
  sections: { id: string; label: string }[];
};

export const SideNav = ({ sections }: SideNavProps) => {
  const [activeSection, setActiveSection] = useState("01");

  useEffect(() => {
    const observers = sections.map(({ id }) => {
      const element = document.getElementById(id);
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.5 }
      );

      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Desktop: Fixed Left Nav */}
      <nav className="hidden lg:fixed lg:left-8 lg:top-1/2 lg:-translate-y-1/2 lg:flex lg:flex-col lg:gap-8 lg:z-50">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className={`text-left transition-all duration-300 ${
              activeSection === id
                ? "text-orange-500 scale-110"
                : "text-gray-600 hover:text-gray-400"
            }`}
          >
            <span className="font-mono text-lg font-bold">{label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile: Top Nav */}
      <nav className="lg:hidden fixed top-20 left-0 right-0 bg-black/80 backdrop-blur-sm z-40 px-4 py-3 overflow-x-auto">
        <div className="flex gap-4 justify-center">
          {sections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`font-mono text-sm whitespace-nowrap px-4 py-2 rounded ${
                activeSection === id
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};
