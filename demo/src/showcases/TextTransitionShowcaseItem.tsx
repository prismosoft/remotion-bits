import React from "react";
import { AbsoluteFill } from "remotion";
import { AnimatedText } from "../../../src/components";
import { Center } from "./Center";

const baseStyle = {
  fontSize: "12rem",
  fontWeight: 700,
  color: "#fffcf0",
  fontFamily: "Inter, ui-sans-serif, system-ui",
  textAlign: "center" as const,
};

export const Bg = ({ children }: { children: React.ReactNode }) => (
  <AbsoluteFill style={{ backgroundColor: "#100f0f" }}>
    <Center style={{ padding: '4rem', ...baseStyle }}>
      {children}
    </Center>
  </AbsoluteFill>
);

export const FadeInShowcase: React.FC = () => (
  <Bg>
    <AnimatedText transition={{ opacity: [0, 1] }}>
      Hello World
    </AnimatedText>
  </Bg>
);

export const SlideFromLeftShowcase: React.FC = () => (
  <Bg>
    <AnimatedText
      transition={{
        opacity: [0, 1],
        x: [-400, 0],
        easing: "easeInOut",
      }}
    >
      Sliding Text
    </AnimatedText>
  </Bg>
);

export const WordByWordShowcase: React.FC = () => (
  <Bg>
    <AnimatedText
      transition={{
        y: [200, 0],
        opacity: [0, 1],
        split: "word",
        splitStagger: 3,
        easing: "easeOutQuad",
      }}
    >
      This appears word by word
    </AnimatedText>
  </Bg>
);

export const CharacterColorShowcase: React.FC = () => (
  <Bg>
    <AnimatedText
      transition={{
        color: ["#fffcf0", "#100f0f", "oklch(100% 0.3 270)"],
        opacity: [1, 0.1, 1],
        split: "character",
        splitStagger: 1,
        frames: [0, 30],
      }}
    >
      Color Transition
    </AnimatedText>
  </Bg>
);

export const ComplexAnimationShowcase: React.FC = () => (
  <Bg>
    <AnimatedText
      transition={{
        x: [200, 0],
        y: [50, 0],
        scale: [0.5, 1],
        rotate: [30, 0],
        opacity: [0, 1],
        easing: "easeOutCubic",
        split: "word",
        splitStagger: 5,
        frames: [10, 50],
      }}
    >
      Composite Animation
    </AnimatedText>
  </Bg>
);

export const CyclingTextShowcase: React.FC = () => (
  <Bg>
    <AnimatedText
      transition={{
        opacity: [0, 1, 0],
        y: [24, 0, -24],
        duration: 30,
        cycle: {
          texts: ["Create", "Animate", "Export"],
          itemDuration: 30,
        },
      }}
    />
  </Bg>
);

export const CustomEasingShowcase: React.FC = () => (
  <Bg>
    <AnimatedText
      transition={{
        x: [-100, 0],
        opacity: [0, 1],
        easing: (t) => t * t * t,
        split: "character",
        splitStagger: 1,
      }}
    >
      Custom Easing
    </AnimatedText>
  </Bg>
);

export const LineByLineShowcase: React.FC = () => (
  <Bg>
    <AnimatedText
      transition={{
        x: [-50, 0],
        opacity: [0, 1],
        split: "line",
        splitStagger: 10,
        easing: "easeOutQuad",
      }}
    >
      {`First line\nSecond line\nThird line`}
    </AnimatedText>
  </Bg>
);
