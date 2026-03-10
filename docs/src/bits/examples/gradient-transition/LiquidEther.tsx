import React from "react";
import { LiquidEther } from "remotion-bits";

export const metadata = {
  name: "Liquid Ether",
  description: "Fluid field background driven by a deterministic pressure and velocity simulation.",
  tags: ["background", "fluid", "shader", "simulation"],
  duration: 180,
  width: 1920,
  height: 1080,
  registry: {
    name: "bit-liquid-ether",
    title: "Liquid Ether",
    description: "Fluid field background driven by a deterministic pressure and velocity simulation.",
    type: "bit" as const,
    add: "when-needed" as const,
    registryDependencies: [],
    dependencies: [],
    files: [
      {
        path: "docs/src/bits/examples/gradient-transition/LiquidEther.tsx",
      },
    ],
  },
};

export const props = {
  mouseForce: 20,
  cursorSize: 100,
  resolution: 0.5,
  isViscous: true,
  viscous: 30,
  iterationsViscous: 32,
  iterationsPoisson: 32,
  isBounce: false,
  autoSpeed: 0.2,
};

export const controls = [
  { key: "mouseForce", type: "number" as const, label: "Mouse Force", min: 0, max: 80, step: 1 },
  { key: "cursorSize", type: "number" as const, label: "Cursor Size", min: 10, max: 200, step: 1 },
  { key: "resolution", type: "number" as const, label: "Resolution", min: 0.2, max: 1, step: 0.05 },
  { key: "isViscous", type: "boolean" as const, label: "Viscous" },
  { key: "viscous", type: "number" as const, label: "Viscosity", min: 1, max: 60, step: 1 },
  { key: "iterationsViscous", type: "number" as const, label: "Viscous Iter", min: 1, max: 64, step: 1 },
  { key: "iterationsPoisson", type: "number" as const, label: "Poisson Iter", min: 1, max: 64, step: 1 },
  { key: "isBounce", type: "boolean" as const, label: "Bounce" },
  { key: "autoSpeed", type: "number" as const, label: "Auto Speed", min: 0, max: 2, step: 0.01 },
];

export const Component: React.FC = () => {
  return (
    <LiquidEther
      mouseForce={props.mouseForce}
      cursorSize={props.cursorSize}
      resolution={props.resolution}
      isViscous={props.isViscous}
      viscous={props.viscous}
      iterationsViscous={props.iterationsViscous}
      iterationsPoisson={props.iterationsPoisson}
      isBounce={props.isBounce}
      autoSpeed={props.autoSpeed}
      colors={["#ec8b49", "#fcc192", "#343331", "#1c1b1a"]}
    />
  );
};
