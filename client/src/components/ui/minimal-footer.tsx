"use client";

import {
  FacebookIcon,
  GithubIcon,
  GraduationCapIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from 'lucide-react';
import { memo } from 'react';

export const MinimalFooter = memo(function MinimalFooter() {
  const year = new Date().getFullYear();

  const company = [
    {
      title: 'About Us',
      href: '#',
    },
    {
      title: 'Careers',
      href: '#',
    },
    {
      title: 'Blog',
      href: '#',
    },
    {
      title: 'Privacy Policy',
      href: '#',
    },
    {
      title: 'Terms of Service',
      href: '#',
    },
  ];

  const resources = [
    {
      title: 'Documentation',
      href: '#',
    },
    {
      title: 'Help Center',
      href: '#',
    },
    {
      title: 'Contact Support',
      href: '#',
    },
    {
      title: 'Community',
      href: '#',
    },
    {
      title: 'Tutorials',
      href: '#',
    },
  ];

  const socialLinks = [
    {
      icon: <FacebookIcon className="size-4" />,
      link: '#',
      label: 'Facebook',
    },
    {
      icon: <GithubIcon className="size-4" />,
      link: '#',
      label: 'GitHub',
    },
    {
      icon: <InstagramIcon className="size-4" />,
      link: '#',
      label: 'Instagram',
    },
    {
      icon: <LinkedinIcon className="size-4" />,
      link: '#',
      label: 'LinkedIn',
    },
    {
      icon: <TwitterIcon className="size-4" />,
      link: '#',
      label: 'Twitter',
    },
    {
      icon: <YoutubeIcon className="size-4" />,
      link: '#',
      label: 'YouTube',
    },
  ];

  return (
    <footer className="relative bg-[#0A0B09]">
      <div className="bg-[radial-gradient(35%_80%_at_30%_0%,hsl(16_89%_40%/.08),transparent)] mx-auto max-w-6xl border-x border-[#bf3a0d]/20">
        <div className="absolute inset-x-0 h-px w-full bg-[#bf3a0d]/40" />
        
        <div className="grid grid-cols-6 gap-6 p-6 md:p-8">
          <div className="col-span-6 flex flex-col gap-5 md:col-span-4">
            <a href="#" className="w-max opacity-70 hover:opacity-100 transition-opacity duration-300">
              <GraduationCapIcon className="size-8 text-[#bf3a0d]" strokeWidth={1.5} />
            </a>
            <p className="text-[#fafafa]/60 max-w-md text-sm text-balance leading-relaxed">
              Revolutionizing education with AI-powered learning. Experience personalized lessons that adapt to your unique learning style.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((item, i) => (
                <a
                  key={i}
                  className="rounded-md border border-[#bf3a0d]/40 p-1.5 text-[#fafafa]/70 hover:bg-[#bf3a0d]/10 hover:border-[#bf3a0d] hover:text-[#bf3a0d] transition-all duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={item.link}
                  aria-label={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
          
          <div className="col-span-3 w-full md:col-span-1">
            <span className="text-[#fafafa]/50 mb-2 text-xs font-semibold uppercase tracking-wider block">
              Resources
            </span>
            <div className="flex flex-col gap-2">
              {resources.map(({ href, title }, i) => (
                <a
                  key={i}
                  className="w-max py-1 text-sm text-[#fafafa]/70 hover:text-[#bf3a0d] transition-colors duration-200"
                  href={href}
                >
                  {title}
                </a>
              ))}
            </div>
          </div>
          
          <div className="col-span-3 w-full md:col-span-1">
            <span className="text-[#fafafa]/50 mb-2 text-xs font-semibold uppercase tracking-wider block">
              Company
            </span>
            <div className="flex flex-col gap-2">
              {company.map(({ href, title }, i) => (
                <a
                  key={i}
                  className="w-max py-1 text-sm text-[#fafafa]/70 hover:text-[#bf3a0d] transition-colors duration-200"
                  href={href}
                >
                  {title}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="absolute inset-x-0 h-px w-full bg-[#bf3a0d]/40" />
        
        <div className="flex flex-col justify-between gap-2 pt-4 pb-6 px-6">
          <p className="text-[#fafafa]/50 text-center text-sm">
            © {year} AI Learning Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
});
