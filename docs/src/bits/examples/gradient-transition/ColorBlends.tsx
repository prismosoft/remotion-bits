import React from "react";
import { ColorBends } from "remotion-bits";

export const metadata = {
  name: "Color Blends",
  description: "Fluid shader-based color blend background with warp, noise, and rotation controls.",
  tags: ["background", "shader", "color", "blend"],
  duration: 180,
  width: 1920,
  height: 1080,
  registry: {
    name: "bit-color-blends",
    title: "Color Blends",
    description: "Fluid shader-based color blend background with warp, noise, and rotation controls.",
    type: "bit" as const,
    add: "when-needed" as const,
    registryDependencies: [],
    dependencies: [],
    files: [
      {
        path: "docs/src/bits/examples/gradient-transition/ColorBlends.tsx",
      },
    ],
  },
};

export const props = {
  rotation: 0,
  autoRotate: 0,
  speed: 0.2,
  scale: 1,
  frequency: 1,
  warpStrength: 1,
  parallax: 0.5,
  noise: 0.1,
};

export const controls = [
  { key: "rotation", type: "number" as const, label: "Rotation", min: -180, max: 180, step: 1 },
  { key: "autoRotate", type: "number" as const, label: "Auto Rotate", min: -120, max: 120, step: 1 },
  { key: "speed", type: "number" as const, label: "Speed", min: 0, max: 2, step: 0.01 },
  { key: "scale", type: "number" as const, label: "Scale", min: 0.2, max: 2.5, step: 0.01 },
  { key: "frequency", type: "number" as const, label: "Frequency", min: 0.25, max: 3, step: 0.01 },
  { key: "warpStrength", type: "number" as const, label: "Warp", min: 0, max: 3, step: 0.01 },
  { key: "parallax", type: "number" as const, label: "Parallax", min: 0, max: 2, step: 0.01 },
  { key: "noise", type: "number" as const, label: "Noise", min: 0, max: 0.5, step: 0.005 },
];

export const Component: React.FC = () => {
  return (
    <ColorBends
      rotation={props.rotation}
      autoRotate={props.autoRotate}
      speed={props.speed}
      scale={props.scale}
      frequency={props.frequency}
      warpStrength={props.warpStrength}
      parallax={props.parallax}
      noise={props.noise}
      transparent={false}
      colors={[
        "#ec8b49",
        "#fcc192",
        "#343331",
        "#1c1b1a",
      ]}
    />
  );
};
