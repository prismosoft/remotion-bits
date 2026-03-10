import React from "react";
import { ColorBends, GradientTransition, LiquidEther } from "../../../src/components";
import { Center } from "./Center";

const textStyle = {
  fontSize: "6rem",
  fontWeight: 700,
  color: "#fffcf0",
  fontFamily: "Inter, ui-sans-serif, system-ui",
  textAlign: "center" as const,
  textShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
};

export const LinearGradientShowcase: React.FC = () => (
  <GradientTransition
    gradient={[
      "linear-gradient(0deg, #205ea6 0%, #735eb5 100%)",
      "linear-gradient(180deg, #ce5d97 0%, #d14d41 100%)",
    ]}
    duration={90}
  >
    <Center style={{ padding: "4rem", ...textStyle }}>
      Linear Gradient Transition
    </Center>
  </GradientTransition>
);

export const RadialGradientShowcase: React.FC = () => (
  <GradientTransition
    gradient={[
      "radial-gradient(circle, #d14d41 0%, #24837b 100%)",
      "radial-gradient(circle, #dfb431 0%, #2f968d 100%)",
    ]}
    duration={90}
    easing="easeInOut"
  >
    <Center style={{ padding: "4rem", ...textStyle }}>
      Radial Gradient Transition
    </Center>
  </GradientTransition>
);

export const ConicGradientShowcase: React.FC = () => (
  <GradientTransition
    gradient={[
      "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
      "conic-gradient(from 180deg, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000, #ff00ff)",
    ]}
    duration={120}
  >
    <Center style={{ padding: "4rem", ...textStyle }}>
      Conic Rainbow
    </Center>
  </GradientTransition>
);

export const MultiStopGradientShowcase: React.FC = () => (
  <GradientTransition
    gradient={[
      "linear-gradient(45deg, #ce5d97 0%, #dfb431 50%, #2f968d 100%)",
      "linear-gradient(225deg, #205ea6 0%, #735eb5 50%, #ce5d97 100%)",
      "linear-gradient(135deg, #2f968d 0%, #24837b 50%, #768d21 100%)",
    ]}
    duration={120}
    easing="easeInOutCubic"
  >
    <Center style={{ padding: "4rem", ...textStyle }}>
      Multi-Stop Gradients
    </Center>
  </GradientTransition>
);

export const AngleInterpolationShowcase: React.FC = () => (
  <GradientTransition
    gradient={[
      "linear-gradient(0deg, #d14d41 0%, #da702c 100%)",
      "linear-gradient(90deg, #c03e35 0%, #dfb431 100%)",
      "linear-gradient(180deg, #d14d41 0%, #da702c 100%)",
      "linear-gradient(270deg, #c03e35 0%, #dfb431 100%)",
      "linear-gradient(360deg, #d14d41 0%, #da702c 100%)",
    ]}
    duration={150}
  >
    <Center style={{ padding: "4rem", ...textStyle }}>
      Angle Rotation
    </Center>
  </GradientTransition>
);

export const TypeTransitionShowcase: React.FC = () => (
  <GradientTransition
    gradient={[
      "linear-gradient(90deg, #5e409d 0%, #4f3685 100%)",
      "radial-gradient(circle, #b74583 0%, #2f968d 50%, #768d21 100%)",
      "conic-gradient(from 0deg, #24837b, #768d21, #24837b)",
      "linear-gradient(45deg, #c03e35 0%, #a02f6f 100%)",
    ]}
    duration={180}
    easing="easeInOut"
  >
    <Center style={{ padding: "4rem", ...textStyle }}>
      Gradient Type Transitions
    </Center>
  </GradientTransition>
);

export const ComplexGradientShowcase: React.FC = () => (
  <GradientTransition
    gradient={[
      "linear-gradient(135deg, #205ea6 0%, #735eb5 25%, #ce5d97 50%, #2f968d 75%, #24837b 100%)",
      "linear-gradient(225deg, #ce5d97 0%, #d14d41 25%, #dfb431 50%, #1a4f8c 75%, #205ea6 100%)",
    ]}
    duration={120}
  >
    <Center style={{ padding: "4rem", ...textStyle }}>
      Complex Multi-Stop
    </Center>
  </GradientTransition>
);

export const ShortestPathAngleShowcase: React.FC = () => (
  <GradientTransition
    gradient={[
      "linear-gradient(350deg, #ce5d97 0%, #dfb431 100%)",
      "linear-gradient(10deg, #2f968d 0%, #4f3685 100%)",
    ]}
    duration={90}
  >
    <Center style={{ padding: "4rem", ...textStyle }}>
      Shortest Path (350° → 10°)
    </Center>
  </GradientTransition>
);

export const ColorBlendsShowcase: React.FC = () => (
  <ColorBends
    rotation={0}
    autoRotate={0}
    speed={0.2}
    scale={1}
    frequency={1}
    warpStrength={1}
    parallax={0.5}
    noise={0.1}
    transparent={false}
    colors={["#ec8b49", "#fcc192", "#343331", "#1c1b1a"]}
  >
    <Center style={{ padding: "4rem", ...textStyle }}>
      Color Blends
    </Center>
  </ColorBends>
);

export const LiquidEtherShowcase: React.FC = () => (
  <LiquidEther
    mouseForce={20}
    cursorSize={100}
    resolution={0.5}
    isViscous
    viscous={30}
    iterationsViscous={32}
    iterationsPoisson={32}
    isBounce={false}
    autoSpeed={0.2}
    colors={["#ec8b49", "#fcc192", "#343331", "#1c1b1a"]}
  >
    <Center style={{ padding: "4rem", ...textStyle }}>
      Liquid Ether
    </Center>
  </LiquidEther>
);
