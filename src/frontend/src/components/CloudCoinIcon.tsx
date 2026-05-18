import type React from "react";

interface CloudCoinIconProps {
  size?: number;
  className?: string;
}

const CloudCoinIcon: React.FC<CloudCoinIconProps> = ({
  size = 32,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Cloud coin"
    >
      {/* Outer gold coin circle with gradient */}
      <defs>
        <radialGradient id="coinGradient" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        <radialGradient id="cloudGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F0F9FF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </radialGradient>
        <filter id="coinShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Coin body with shadow */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="url(#coinGradient)"
        stroke="#B45309"
        strokeWidth="2"
        filter="url(#coinShadow)"
      />

      {/* Inner coin ring for depth */}
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke="#FDE68A"
        strokeWidth="1"
        opacity="0.6"
      />

      {/* Stylized cloud shape in center */}
      <g filter="url(#glow)">
        {/* Main cloud body */}
        <ellipse
          cx="32"
          cy="32"
          rx="14"
          ry="9"
          fill="url(#cloudGradient)"
          stroke="#BAE6FD"
          strokeWidth="1"
        />

        {/* Left cloud puff */}
        <circle
          cx="22"
          cy="30"
          r="6"
          fill="url(#cloudGradient)"
          stroke="#BAE6FD"
          strokeWidth="1"
        />

        {/* Right cloud puff */}
        <circle
          cx="42"
          cy="30"
          r="6"
          fill="url(#cloudGradient)"
          stroke="#BAE6FD"
          strokeWidth="1"
        />

        {/* Top center cloud puff */}
        <circle
          cx="32"
          cy="26"
          r="7"
          fill="url(#cloudGradient)"
          stroke="#BAE6FD"
          strokeWidth="1"
        />
      </g>

      {/* Highlight shine on coin */}
      <ellipse
        cx="26"
        cy="22"
        rx="8"
        ry="6"
        fill="#FEF3C7"
        opacity="0.5"
        transform="rotate(-30 26 22)"
      />
    </svg>
  );
};

export default CloudCoinIcon;
