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
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <h3 className="text-center text-lg font-medium text-muted-foreground mb-8">
          Trusted by the world's most innovative companies
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
          {logos.map((logo, idx) => (
            <Image
              key={idx}
              src={logo.src}
              alt={logo.alt}
              width={120}
              height={40}
              className="opacity-60 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;