"use client";

import {
  useId,
  useState,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

/* -------------------------------------------------------------------------- */
/* Shared SVG infrastructure                                                   */
/* -------------------------------------------------------------------------- */

export type DashboardGraphicProps = Omit<
  SVGProps<SVGSVGElement>,
  "children"
> & {
  size?: number;
  title?: string;
};

export type AvatarName = "fox" | "bunny" | "girl" | "boy";

function useGraphicId() {
  return `dg-${useId().replace(/:/g, "")}`;
}

function Graphic({
  children,
  size = 48,
  title,
  style,
  viewBox = "0 0 100 100",
  ...props
}: DashboardGraphicProps & { children: ReactNode }) {
  const titleId = useGraphicId();
  const hasAccessibleName = Boolean(
    title || props["aria-label"] || props["aria-labelledby"],
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      role={hasAccessibleName ? "img" : undefined}
      aria-hidden={hasAccessibleName ? undefined : true}
      aria-labelledby={title ? titleId : undefined}
      focusable="false"
      style={{ display: "block", flexShrink: 0, ...style }}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {children}
    </svg>
  );
}

function Portrait({
  id,
  background,
  children,
  ...props
}: DashboardGraphicProps & {
  id: string;
  background: readonly [string, string];
  children: ReactNode;
}) {
  return (
    <Graphic {...props}>
      <defs>
        <linearGradient id={`${id}-background`} x1="12" y1="4" x2="87" y2="100">
          <stop stopColor={background[0]} />
          <stop offset="1" stopColor={background[1]} />
        </linearGradient>
        <radialGradient
          id={`${id}-studio`}
          cx="0"
          cy="0"
          r="1"
          gradientTransform="translate(29 15) rotate(56) scale(83 72)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity=".72" />
          <stop offset=".7" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="20" y1="1" x2="81" y2="100">
          <stop stopColor="white" stopOpacity=".95" />
          <stop offset=".48" stopColor="white" stopOpacity=".25" />
          <stop offset="1" stopColor="white" stopOpacity=".65" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <circle cx="50" cy="50" r="49" fill={`url(#${id}-background)`} />
        <circle cx="50" cy="50" r="49" fill={`url(#${id}-studio)`} />
        <ellipse cx="51" cy="96" rx="35" ry="10" fill="#27224A" opacity=".12" />
        {children}
      </g>

      <circle
        cx="50"
        cy="50"
        r="48"
        stroke={`url(#${id}-rim)`}
        strokeWidth="1.6"
      />
      <path
        d="M12 34C17 18 31 8 47 7"
        stroke="white"
        strokeOpacity=".55"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Graphic>
  );
}

function GlossyEye({
  x,
  y,
  rx = 3.8,
  ry = 5,
}: {
  x: number;
  y: number;
  rx?: number;
  ry?: number;
}) {
  return (
    <g>
      <ellipse cx={x} cy={y + 0.7} rx={rx + 0.9} ry={ry + 0.6} fill="#7C3541" opacity=".1" />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#292438" />
      <ellipse cx={x + 0.65} cy={y + 1.8} rx={rx * 0.55} ry={ry * 0.38} fill="#655078" />
      <circle cx={x - 1.1} cy={y - 1.8} r={rx * 0.37} fill="white" />
      <circle cx={x + 1.25} cy={y + 1.5} r={rx * 0.16} fill="white" opacity=".75" />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Bespoke illustrated avatars                                                 */
/* -------------------------------------------------------------------------- */

export function AvatarFox(props: DashboardGraphicProps = {}) {
  const id = useGraphicId();

  return (
    <Portrait id={id} background={["#D7F5EF", "#92D7CA"]} {...props}>
      <defs>
        <linearGradient id={`${id}-fur`} x1="28" y1="19" x2="77" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB923C" />
          <stop offset=".5" stopColor="#F97A28" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="28" y1="20" x2="31" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDA4AF" />
          <stop offset="1" stopColor="#FFE4E6" />
        </linearGradient>
        <linearGradient id={`${id}-cream`} x1="50" y1="52" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFEDD5" />
        </linearGradient>
      </defs>

      <path
        d="M23 103C24 80 35 75 50 75C66 75 79 83 80 103Z"
        fill={`url(#${id}-fur)`}
      />
      <path
        d="M37 85C40 79 60 79 64 85L68 102H31Z"
        fill={`url(#${id}-cream)`}
      />

      <path
        d="M23 49C20 38 17 20 21 14C23 11 38 23 43 35L39 52Z"
        fill={`url(#${id}-fur)`}
      />
      <path
        d="M58 36C65 23 78 11 81 15C85 23 81 41 76 52Z"
        fill={`url(#${id}-fur)`}
      />
      <path
        d="M27 39C25 30 24 23 25 21C30 25 35 31 37 39L33 46Z"
        fill={`url(#${id}-inner)`}
      />
      <path
        d="M65 39C68 31 74 24 77 21C78 27 76 36 74 43L69 46Z"
        fill={`url(#${id}-inner)`}
      />
      <path
        d="M20 57C21 37 34 29 50 30C67 29 80 39 81 57L87 63L78 70C72 82 61 89 50 89C38 89 26 81 21 70L14 64Z"
        fill={`url(#${id}-fur)`}
      />

      <path
        d="M27 44C30 37 39 33 47 33"
        stroke="#FED7AA"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".62"
      />
      <path
        d="M20 60C29 58 39 63 50 73C61 63 70 58 81 60C77 78 65 87 50 88C35 87 24 78 20 60Z"
        fill={`url(#${id}-cream)`}
      />
      <path
        d="M21 61L29 67L23 68M80 61L72 67L78 68"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path d="M33 49C36 46 40 46 42 48" stroke="#9A3412" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M59 48C62 46 65 47 68 49" stroke="#9A3412" strokeWidth="1.7" strokeLinecap="round" />
      <GlossyEye x={37.5} y={56.5} />
      <GlossyEye x={63} y={56.5} />

      <ellipse cx="29" cy="65" rx="5.5" ry="3" fill="#FB7185" opacity=".27" />
      <ellipse cx="72" cy="65" rx="5.5" ry="3" fill="#FB7185" opacity=".27" />
      <path
        d="M44 70C44 66.5 56 66.5 56 70C56 72 52 75 50 75C48 75 44 72 44 70Z"
        fill="#3A2732"
      />
      <path d="M47 69.3C48.5 68.6 50.5 68.5 52 69" stroke="white" strokeOpacity=".55" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M50 75V78M50 78C47 81 43 80 42 78M50 78C53 81 57 80 58 78" stroke="#82412D" strokeWidth="1.5" strokeLinecap="round" />
    </Portrait>
  );
}

export function AvatarBunny(props: DashboardGraphicProps = {}) {
  const id = useGraphicId();

  return (
    <Portrait id={id} background={["#F3E8FF", "#C4B5FD"]} {...props}>
      <defs>
        <linearGradient id={`${id}-fur`} x1="30" y1="12" x2="72" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset=".48" stopColor="#FAF7FF" />
          <stop offset="1" stopColor="#DCD4F2" />
        </linearGradient>
        <linearGradient id={`${id}-rose`} x1="38" y1="9" x2="42" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F9A8C4" />
          <stop offset=".65" stopColor="#FBCFE8" />
          <stop offset="1" stopColor="#FCE7F3" />
        </linearGradient>
      </defs>

      <path d="M26 102C27 81 37 77 50 77C65 77 77 86 77 102Z" fill={`url(#${id}-fur)`} />
      <path d="M34 47C27 39 26 14 31 7C34 3 40 5 43 12C47 21 47 39 45 47Z" fill={`url(#${id}-fur)`} />
      <path d="M56 47C54 36 57 13 64 7C68 3 73 7 74 12C76 23 70 42 66 48Z" fill={`url(#${id}-fur)`} />
      <path d="M36 40C32 32 32 15 34 12C37 11 41 23 41 37C41 41 38 43 36 40Z" fill={`url(#${id}-rose)`} />
      <path d="M61 40C60 31 64 15 67 12C70 12 68 27 65 38C64 42 62 43 61 40Z" fill={`url(#${id}-rose)`} />

      <path
        d="M22 62C22 45 33 35 50 36C67 35 79 46 79 63C84 77 69 89 50 89C31 89 16 77 22 62Z"
        fill={`url(#${id}-fur)`}
      />
      <path d="M25 60C26 48 36 40 46 40" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M74 56C79 71 68 84 54 85" stroke="#C4B5DF" strokeWidth="2.5" strokeLinecap="round" opacity=".45" />

      <path d="M33 53C35 51 39 51 41 53M59 53C62 51 65 51 67 53" stroke="#A99ABD" strokeWidth="1.5" strokeLinecap="round" />
      <GlossyEye x={37} y={61} rx={3.5} ry={4.8} />
      <GlossyEye x={63} y={61} rx={3.5} ry={4.8} />
      <ellipse cx="29" cy="70" rx="6.5" ry="3.8" fill="#F9A8C4" opacity=".5" />
      <ellipse cx="71" cy="70" rx="6.5" ry="3.8" fill="#F9A8C4" opacity=".5" />

      <ellipse cx="44" cy="74" rx="7" ry="5.5" fill="white" opacity=".78" />
      <ellipse cx="56" cy="74" rx="7" ry="5.5" fill="white" opacity=".78" />
      <path d="M46 69C47 67.5 53 67.5 54 69C55 71 51.5 73 50 73C48.5 73 45 71 46 69Z" fill="#DF8BA9" />
      <path d="M48 69H51" stroke="#FFF1F5" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M50 73V76M50 76C48 79 44 78 43 76M50 76C52 79 56 78 57 76" stroke="#9B779D" strokeWidth="1.35" strokeLinecap="round" />

      <path d="M34 87C40 90 60 90 66 87" stroke="white" strokeWidth="2" strokeLinecap="round" opacity=".9" />
      <path d="M39 96C45 92 55 92 61 96" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
    </Portrait>
  );
}

export function AvatarCreatorGirl(props: DashboardGraphicProps = {}) {
  const id = useGraphicId();

  return (
    <Portrait id={id} background={["#FFE8DC", "#F5BDB7"]} {...props}>
      <defs>
        <linearGradient id={`${id}-hair`} x1="23" y1="20" x2="81" y2="81" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id={`${id}-skin`} x1="36" y1="33" x2="66" y2="81" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE4CC" />
          <stop offset="1" stopColor="#EFAE91" />
        </linearGradient>
        <linearGradient id={`${id}-shirt`} x1="28" y1="82" x2="73" y2="107" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8F5FF" />
          <stop offset="1" stopColor="#C4B5FD" />
        </linearGradient>
        <linearGradient id={`${id}-lens`} x1="29" y1="50" x2="69" y2="66" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity=".3" />
          <stop offset="1" stopColor="#C7D2FE" stopOpacity=".04" />
        </linearGradient>
      </defs>

      <path d="M19 69V43C19 22 32 13 50 13C70 13 83 26 82 45L81 72C71 81 30 81 19 69Z" fill={`url(#${id}-hair)`} />
      <path d="M23 62C24 42 27 29 38 22C25 28 22 43 23 62Z" fill="#C7D2FE" opacity=".6" />
      <path d="M18 103C20 85 33 80 50 80C67 80 80 86 83 103Z" fill={`url(#${id}-shirt)`} />

      <path d="M42 74H59V86C55 93 46 93 42 86Z" fill={`url(#${id}-skin)`} />
      <path d="M42 78C47 82 55 82 59 78V83C54 86 47 86 42 83Z" fill="#CD8775" opacity=".3" />
      <ellipse cx="28.5" cy="58" rx="5.5" ry="8" fill="#F2B296" />
      <ellipse cx="72" cy="58" rx="5.5" ry="8" fill="#EAA78E" />
      <path
        d="M29 43C29 28 70 27 72 44V60C72 74 62 82 51 83C38 82 29 73 29 60Z"
        fill={`url(#${id}-skin)`}
      />

      <path d="M26 47C25 26 37 19 52 20C66 20 75 28 76 43C63 43 54 36 50 29C45 41 36 47 26 47Z" fill={`url(#${id}-hair)`} />
      <path d="M32 35C38 27 44 24 51 24M56 25C61 31 66 34 71 35" stroke="#C7D2FE" strokeWidth="2.4" strokeLinecap="round" opacity=".72" />
      <path d="M24 48L27 69M77 46L75 70" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" opacity=".4" />

      <path d="M34 50C37 48 41 48 44 50M57 50C60 48 64 48 67 50" stroke="#62518B" strokeWidth="1.6" strokeLinecap="round" />
      <GlossyEye x={39} y={58} rx={2.55} ry={3.5} />
      <GlossyEye x={62} y={58} rx={2.55} ry={3.5} />

      <circle cx="39" cy="58" r="10" fill={`url(#${id}-lens)`} stroke="#4C426D" strokeWidth="1.8" />
      <circle cx="62" cy="58" r="10" fill={`url(#${id}-lens)`} stroke="#4C426D" strokeWidth="1.8" />
      <path d="M49 57C50 56 51 56 52 57M29 56L25 54M72 56L76 54" stroke="#4C426D" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M32 54C33 51 35 50 38 50M55 54C56 51 58 50 61 50" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity=".75" />

      <ellipse cx="34" cy="68" rx="5" ry="2.8" fill="#EC8397" opacity=".38" />
      <ellipse cx="67" cy="68" rx="5" ry="2.8" fill="#EC8397" opacity=".38" />
      <path d="M50 60L48 66C49 67 51 67 53 66" stroke="#CC8D7B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M44 72C48 76 55 76 59 71" stroke="#A45565" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M47 73C50 74 53 74 55 73" stroke="#FFF0E8" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="27" cy="67" r="2" fill="#FDE68A" />
      <circle cx="74" cy="67" r="2" fill="#FDE68A" />
      <path d="M36 89L42 96L50 90L59 96L65 89" stroke="white" strokeWidth="2" strokeLinejoin="round" />
    </Portrait>
  );
}

export function AvatarCreatorBoy(props: DashboardGraphicProps = {}) {
  const id = useGraphicId();

  return (
    <Portrait id={id} background={["#DBEAFE", "#93C5FD"]} {...props}>
      <defs>
        <linearGradient id={`${id}-hair`} x1="24" y1="17" x2="76" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#312E81" />
        </linearGradient>
        <linearGradient id={`${id}-skin`} x1="32" y1="37" x2="69" y2="83" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EFC09C" />
          <stop offset="1" stopColor="#C88468" />
        </linearGradient>
        <linearGradient id={`${id}-jacket`} x1="26" y1="82" x2="80" y2="105" gradientUnits="userSpaceOnUse">
          <stop stopColor="#475569" />
          <stop offset="1" stopColor="#172554" />
        </linearGradient>
      </defs>

      <path d="M17 103C19 86 34 80 50 80C67 80 81 87 84 103Z" fill={`url(#${id}-jacket)`} />
      <path d="M41 76H60V88L51 96L41 88Z" fill={`url(#${id}-skin)`} />
      <path d="M39 85L51 94L62 85L66 101H35Z" fill="#E0F2FE" />
      <path d="M37 84L30 91L39 95L35 102M64 84L72 91L64 96L68 103" stroke="#7A90BB" strokeWidth="1.7" strokeLinejoin="round" />

      <ellipse cx="27" cy="58" rx="5.5" ry="8" fill="#D99979" />
      <ellipse cx="74" cy="58" rx="5.5" ry="8" fill="#CB896C" />
      <path d="M28 44C28 29 73 27 74 45V59C74 75 63 83 51 84C39 83 28 74 28 59Z" fill={`url(#${id}-skin)`} />
      <path d="M31 47C31 41 33 38 36 36" stroke="#FFE2C3" strokeWidth="2.3" strokeLinecap="round" opacity=".6" />

      <path
        d="M25 55C20 51 20 44 22 39C17 33 21 25 27 24C26 17 34 12 40 15C44 8 53 9 57 13C65 8 72 14 73 19C81 19 85 26 81 33C87 40 82 49 77 51L74 58L69 42C61 45 56 41 52 36C47 43 38 45 31 41L28 56Z"
        fill={`url(#${id}-hair)`}
      />
      <path d="M25 33C22 27 31 22 35 28C38 33 31 37 28 33" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
      <path d="M36 24C32 18 40 14 44 19C48 24 41 29 38 25" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" opacity=".65" />
      <path d="M48 20C48 14 57 14 58 20C59 26 51 28 49 24" stroke="#A5B4FC" strokeWidth="2.4" strokeLinecap="round" opacity=".6" />
      <path d="M62 22C63 16 72 19 71 24C70 29 65 30 63 27" stroke="#818CF8" strokeWidth="2.4" strokeLinecap="round" opacity=".6" />
      <path d="M72 33C74 28 81 32 78 37M39 36C40 30 48 30 48 35M54 33C56 28 63 31 62 36" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 43C26 47 27 49 27 53M76 42L75 50" stroke="#262263" strokeWidth="3" strokeLinecap="round" />

      <path d="M33 52C36 50 41 50 44 52M58 52C61 50 66 50 69 53" stroke="#48324A" strokeWidth="2" strokeLinecap="round" />
      <GlossyEye x={39} y={59} rx={2.8} ry={3.7} />
      <GlossyEye x={63} y={59} rx={2.8} ry={3.7} />
      <path d="M51 59L49 66C50 68 52 68 54 66" stroke="#AF715D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="34" cy="68" rx="5" ry="2.5" fill="#DF8B83" opacity=".35" />
      <ellipse cx="68" cy="68" rx="5" ry="2.5" fill="#DF8B83" opacity=".35" />
      <path d="M43 72C47 78 56 78 61 71C55 73 49 73 43 72Z" fill="#8F4A4A" />
      <path d="M46 73C50 75 55 74 58 73" stroke="#FFF5EB" strokeWidth="2" strokeLinecap="round" />

      <path d="M70 92L73 89L76 92L73 95Z" fill="#6EE7D3" />
      <path d="M21 96C23 91 27 88 31 87" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
    </Portrait>
  );
}
export const AvatarGirl = AvatarCreatorGirl;
export const AvatarBoy = AvatarCreatorBoy;

const AVATAR_COMPONENTS = {
  fox: AvatarFox,
  bunny: AvatarBunny,
  girl: AvatarCreatorGirl,
  boy: AvatarCreatorBoy,
} satisfies Record<AvatarName, (props: DashboardGraphicProps) => ReactNode>;

const AVATAR_LABELS: Record<AvatarName, string> = {
  fox: "fox",
  bunny: "bunny",
  girl: "girl creator",
  boy: "boy creator",
};

const STACK_STYLES = `
  .dg-avatar-stack {
    --dg-stack-ring: var(--dg-avatar-ring, #fff);
    display: inline-flex;
    align-items: center;
    flex: none;
    isolation: isolate;
    padding: 2px;
  }
  .dg-avatar-stack__disc {
    display: block;
    width: var(--dg-stack-size, 34px);
    height: var(--dg-stack-size, 34px);
    flex: none;
    overflow: hidden;
    border-radius: 50%;
    background: var(--dg-stack-ring);
    box-shadow:
      0 0 0 2.5px var(--dg-stack-ring),
      0 3px 7px rgb(30 27 75 / 12%);
  }
  .dg-avatar-stack__disc + .dg-avatar-stack__disc {
    margin-left: calc(var(--dg-stack-size, 34px) * -.3);
  }
  :where(.dark, [data-theme="dark"]) .dg-avatar-stack {
    --dg-stack-ring: var(--dg-avatar-ring, #25243b);
  }
  @media (prefers-color-scheme: dark) {
    :root:not(.light):not([data-theme="light"]) .dg-avatar-stack {
      --dg-stack-ring: var(--dg-avatar-ring, #25243b);
    }
  }
`;

export function OverlappingAvatarStack({
  avatars,
}: {
  avatars: AvatarName[];
}) {
  if (avatars.length === 0) return null;

  return (
    <span
      className="dg-avatar-stack"
      role="img"
      aria-label={`Creators: ${avatars.map((avatar) => AVATAR_LABELS[avatar]).join(", ")}`}
    >
      <style>{STACK_STYLES}</style>
      {avatars.map((avatar, index) => {
        const Avatar = AVATAR_COMPONENTS[avatar];

        return (
          <span
            key={`${avatar}-${index}`}
            className="dg-avatar-stack__disc"
            style={{ zIndex: index + 1 }}
          >
            <Avatar width="100%" height="100%" aria-hidden />
          </span>
        );
      })}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Bespoke brand and feature graphics                                          */
/* -------------------------------------------------------------------------- */

export function ReelMemoryNucleus(props: DashboardGraphicProps = {}) {
  const id = useGraphicId();

  return (
    <Graphic size={120} viewBox="0 0 120 120" {...props}>
      <defs>
        <linearGradient id={`${id}-shield`} x1="28" y1="15" x2="94" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C4B5FD" />
          <stop offset=".48" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id={`${id}-star`} x1="46" y1="33" x2="76" y2="86" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset=".6" stopColor="#F5F3FF" />
          <stop offset="1" stopColor="#DDD6FE" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop stopColor="#DDD6FE" stopOpacity=".95" />
          <stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="30" y1="18" x2="90" y2="102" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity=".9" />
          <stop offset=".5" stopColor="white" stopOpacity=".2" />
          <stop offset="1" stopColor="#DDD6FE" stopOpacity=".7" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-45%" y="-35%" width="190%" height="190%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#6D28D9" floodOpacity=".24" />
        </filter>
        <filter id={`${id}-glow`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <circle cx="60" cy="60" r="59" fill={`url(#${id}-halo)`} />
      <ellipse cx="60" cy="60" rx="55" ry="28" transform="rotate(-32 60 60)" stroke="#C4B5FD" strokeOpacity=".7" />
      <ellipse cx="60" cy="60" rx="52" ry="35" transform="rotate(40 60 60)" stroke="#DDD6FE" strokeOpacity=".5" strokeDasharray="2 6" />

      <g filter={`url(#${id}-shadow)`}>
        <path
          d="M60 17C78 17 89 19 96 26C103 33 103 45 103 60C103 76 102 87 94 95C87 102 75 103 60 103C44 103 33 102 25 94C18 87 17 75 17 60C17 44 18 33 26 25C34 18 45 17 60 17Z"
          fill={`url(#${id}-shield)`}
        />
        <path
          d="M60 20C78 20 88 22 94 28C100 34 100 46 100 60C100 75 99 86 92 93C85 99 74 100 60 100C45 100 34 99 27 92C21 85 20 74 20 60C20 45 21 34 28 27C35 21 46 20 60 20Z"
          stroke={`url(#${id}-rim)`}
          strokeWidth="1.3"
        />
        <path d="M29 45C29 32 34 27 47 27" stroke="white" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
      </g>

      <path d="M60 29C65 48 72 55 91 60C72 65 65 72 60 91C55 72 48 65 29 60C48 55 55 48 60 29Z" fill="#EDE9FE" opacity=".65" filter={`url(#${id}-glow)`} />
      <path d="M60 28C66 48 72 54 92 60C72 66 66 72 60 92C54 72 48 66 28 60C48 54 54 48 60 28Z" fill="#DDD6FE" opacity=".3" transform="rotate(18 60 60)" />
      <path d="M60 31C64 49 71 56 89 60C71 64 64 71 60 89C56 71 49 64 31 60C49 56 56 49 60 31Z" fill={`url(#${id}-star)`} />
      <path d="M60 46C62 55 65 58 74 60C65 62 62 65 60 74C58 65 55 62 46 60C55 58 58 55 60 46Z" fill="white" />

      <circle cx="14" cy="76" r="4.5" fill="#C4B5FD" stroke="white" strokeWidth="1.5" />
      <circle cx="105" cy="42" r="3.8" fill="#F9A8D4" stroke="#FFF1F8" strokeWidth="1.3" />
      <circle cx="86" cy="106" r="3" fill="#A5F3FC" stroke="white" />
      <circle cx="29" cy="16" r="2.5" fill="#E9D5FF" />
    </Graphic>
  );
}

export function InstagramVaultIcon(props: DashboardGraphicProps = {}) {
  const id = useGraphicId();

  return (
    <Graphic size={32} viewBox="0 0 48 48" {...props}>
      <defs>
        <linearGradient id={`${id}-sunset`} x1="8" y1="40" x2="39" y2="7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB7185" />
          <stop offset=".45" stopColor="#E879B9" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <radialGradient id={`${id}-wash`}>
          <stop stopColor="#FBCFE8" stopOpacity=".7" />
          <stop offset="1" stopColor="#FBCFE8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill={`url(#${id}-wash)`} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 6H30C38 6 42 10 42 18V30C42 38 38 42 30 42H18C10 42 6 38 6 30V18C6 10 10 6 18 6ZM18 10C12.5 10 10 12.5 10 18V30C10 35.5 12.5 38 18 38H30C35.5 38 38 35.5 38 30V18C38 12.5 35.5 10 30 10H18Z"
        fill={`url(#${id}-sunset)`}
      />
      <circle cx="24" cy="24" r="8.1" stroke={`url(#${id}-sunset)`} strokeWidth="3.7" />
      <circle cx="33.7" cy="14.4" r="2.4" fill={`url(#${id}-sunset)`} />
      <path d="M12 19V17C12 13.7 13.8 12 17 12H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
      <path d="M19 22C19.6 20 21 19 23 18.8" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity=".75" />
    </Graphic>
  );
}

export function AudioSpectrumIcon(props: DashboardGraphicProps = {}) {
  const id = useGraphicId();
  const bars = [
    { x: 6, y: 19, height: 10 },
    { x: 14, y: 12, height: 24 },
    { x: 22, y: 6, height: 36 },
    { x: 30, y: 14, height: 20 },
    { x: 38, y: 19, height: 10 },
  ];

  return (
    <Graphic size={32} viewBox="0 0 48 48" {...props}>
      <defs>
        <linearGradient id={`${id}-mint`} x1="11" y1="6" x2="37" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A7F3D0" />
          <stop offset=".48" stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="#6EE7B7" opacity=".1" />
      {bars.map(({ x, y, height }) => (
        <g key={x}>
          <rect x={x} y={y + 1} width="4.6" height={height} rx="2.3" fill="#047857" opacity=".12" />
          <rect x={x} y={y} width="4.6" height={height} rx="2.3" fill={`url(#${id}-mint)`} />
          <path d={`M${x + 1.4} ${y + 3.5}V${y + Math.min(height - 3, 7)}`} stroke="white" strokeOpacity=".55" strokeWidth="1" strokeLinecap="round" />
        </g>
      ))}
    </Graphic>
  );
}
export function SmartCategorizeIcon(props: DashboardGraphicProps = {}) {
  const id = useGraphicId();

  return (
    <Graphic size={32} viewBox="0 0 32 32" {...props}>
      <defs>
        <linearGradient id={`${id}-tile`} x1="4" y1="2" x2="27" y2="31">
          <stop stopColor="#FFF5DF" />
          <stop offset="1" stopColor="#FFD7B0" />
        </linearGradient>
        <linearGradient id={`${id}-tag`} x1="8" y1="12" x2="23" y2="27">
          <stop stopColor="#FFC16D" />
          <stop offset="1" stopColor="#ED8A45" />
        </linearGradient>
        <linearGradient id={`${id}-star`} x1="24" y1="4" x2="28" y2="14">
          <stop stopColor="#FFD16C" />
          <stop offset="1" stopColor="#E89136" />
        </linearGradient>
      </defs>

      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="10"
        fill={`url(#${id}-tile)`}
        stroke="#FFFFFF"
        strokeOpacity=".85"
      />
      <path
        d="M5 13V10a5 5 0 0 1 5-5h7"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity=".7"
      />
      <path
        d="M8.3 12.3a2 2 0 0 1 2-2h6.1a2 2 0 0 1 1.42.59l7.04 7.04a2.3 2.3 0 0 1 0 3.25l-4.63 4.63a2.3 2.3 0 0 1-3.25 0l-8.1-8.1a2 2 0 0 1-.58-1.42V12.3Z"
        fill="#CC783B"
        opacity=".13"
        transform="translate(0 1.3)"
      />
      <path
        d="M8.3 11.3a2 2 0 0 1 2-2h6.1a2 2 0 0 1 1.42.59l7.04 7.04a2.3 2.3 0 0 1 0 3.25l-4.63 4.63a2.3 2.3 0 0 1-3.25 0l-8.1-8.1a2 2 0 0 1-.58-1.42V11.3Z"
        fill={`url(#${id}-tag)`}
        stroke="#EBA05C"
        strokeWidth=".8"
      />
      <path
        d="M10.2 11h5.9l7.1 7.1"
        stroke="#FFE5B4"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12.7" cy="13.6" r="1.8" fill="#FFF8EC" />
      <circle cx="12.7" cy="13.6" r=".85" fill="#D48B50" opacity=".5" />
      <path
        d="m16 18.5 3.7 3.7"
        stroke="#FFF3DC"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24.1 3.6c.66 3.61 1.7 4.65 5.31 5.31-3.61.66-4.65 1.7-5.31 5.31-.66-3.61-1.7-4.65-5.31-5.31 3.61-.66 4.65-1.7 5.31-5.31Z"
        fill={`url(#${id}-star)`}
        stroke="#FFF9EB"
        strokeWidth=".8"
        strokeLinejoin="round"
      />
      <circle cx="27.5" cy="16" r="1" fill="#F2B651" />
    </Graphic>
  );
}

export function SparkleStar({
  color = "#C084FC",
  size = 24,
  title,
  style,
  ...props
}: DashboardGraphicProps & { color?: string }) {
  const id = useGraphicId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      style={{ display: "block", overflow: "visible", flexShrink: 0, ...style }}
      {...props}
    >
      {title && <title>{title}</title>}
      <path
        d="M16 1.5C17.75 11.45 20.55 14.25 30.5 16 20.55 17.75 17.75 20.55 16 30.5 14.25 20.55 11.45 17.75 1.5 16 11.45 14.25 14.25 11.45 16 1.5Z"
        fill={color}
      />
      <path
        d="M16 5.5c.8 5.65 2.85 8.15 7.75 10.5-5.6-1.2-7.55-3.45-7.75-10.5Z"
        fill="#FFFFFF"
        opacity=".42"
      />
    </svg>
  );
}