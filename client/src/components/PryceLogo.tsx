import pryceLogoImage from "@assets/ChatGPT Image 6 juil. 2025, 14_19_58_1751923398269.png";

interface PryceLogoProps {
  size?: number;
  className?: string;
}

export function PryceLogo({ size = 40, className = "" }: PryceLogoProps) {
  return (
    <img 
      src={pryceLogoImage}
      alt="Pryce Logo"
      width={size}
      height={size}
      className={className}
      style={{ 
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        objectFit: 'contain'
      }}
    />
  );
}