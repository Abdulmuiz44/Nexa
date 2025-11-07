import React from 'react';
import Image from 'next/image';

const logos = [
  { src: '/placeholder-logo.svg', alt: 'Company Logo 1' },
  { src: '/placeholder.svg', alt: 'Company Logo 2' },
  { src: '/placeholder-logo.svg', alt: 'Company Logo 3' },
  { src: '/placeholder.svg', alt: 'Company Logo 4' },
  { src: '/placeholder-logo.svg', alt: 'Company Logo 5' },
];

const TrustedBy = () => {
  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <h3 className="mb-6 text-center text-base font-medium text-muted-foreground sm:mb-8 sm:text-lg">
          Trusted by the world's most innovative companies
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-12 sm:gap-y-8">
          {logos.map((logo, idx) => (
            <Image
              key={idx}
              src={logo.src}
              alt={logo.alt}
              width={112}
              height={36}
              className="h-10 w-auto opacity-60 transition-opacity hover:opacity-100 sm:h-12"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;