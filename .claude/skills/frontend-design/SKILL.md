---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with Tailwind CSS v4. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished Tailwind code that avoids generic AI aesthetics.
---

This skill guides creation of distinctive, production-grade frontend interfaces using Tailwind CSS v4 that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code using Tailwind CSS v4's utility-first approach that is:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Tailwind CSS v4 Aesthetics Guidelines

Focus on:

- **Typography**: Use Tailwind's custom font configuration via the `@theme` directive to define beautiful, unique, and interesting typefaces. Avoid generic fonts like Arial, Inter, and system fonts; opt instead for distinctive Google Fonts or custom fonts that elevate the interface's aesthetics. Pair a distinctive display font with a refined body font. Leverage `font-*`, `text-*`, `tracking-*`, and `leading-*` utilities with arbitrary values like `text-[2.5rem]` for precise control.

- **Color & Theme**: Commit to a cohesive aesthetic using Tailwind v4's CSS-first configuration with the `@theme` directive to define custom color palettes, semantic color tokens, and design system variables. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Use arbitrary values `bg-[#FF6B35]` for unique colors. Leverage `dark:` variants for sophisticated dark mode implementations. Use cascade layers to organize theme priorities.

- **Motion**: Create impactful animations using Tailwind's animation utilities (`animate-*`), transition classes (`transition-*`, `duration-*`, `delay-*`, `ease-*`), and transform utilities (`translate-*`, `rotate-*`, `scale-*`, including native 3D transforms). Define custom animations via `@theme` using CSS `@keyframes`. Focus on high-impact moments: stagger delays with classes like `delay-[100ms]`, `delay-[200ms]` for orchestrated page loads. Use `hover:`, `group-hover:`, and `peer-*:` variants for surprising interactions. Leverage arbitrary properties `[animation-timeline:scroll()]` for scroll-triggered effects.

- **Spatial Composition**: Create unexpected layouts using Tailwind's flexbox (`flex`, `justify-*`, `items-*`), grid (`grid`, `grid-cols-*`, `grid-rows-*`), and positioning utilities (`absolute`, `relative`, `fixed`, `sticky`). Embrace asymmetry with arbitrary grid templates `grid-cols-[1fr,2fr,1fr]`. Use `z-*` layers, negative margins `-m-*`, and arbitrary spacing `gap-[3.5rem]` for overlap and diagonal flow. Break grids with `col-span-*` and `row-span-*`. Create generous negative space with custom spacing or controlled density with tight spacing scales.

- **Backgrounds & Visual Details**: Create atmosphere and depth using Tailwind's gradient utilities (`bg-gradient-to-*`, `from-*`, `via-*`, `to-*`), backdrop filters (`backdrop-blur-*`, `backdrop-brightness-*`), shadows (`shadow-*`, arbitrary shadows `shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]`), and border utilities. Define custom background patterns via CSS and apply with `@apply` or arbitrary properties. Use `bg-[url('/pattern.svg')]` for textures, layered backgrounds with multiple `bg-*` classes, and custom CSS for grain overlays and mesh gradients. Leverage `mix-blend-*` and opacity utilities for layered transparencies. Create decorative borders with `border-*`, `ring-*`, and arbitrary border styles.

## Tailwind CSS v4 Best Practices

- **CSS-First Configuration**: Define all customizations in CSS using the `@theme` directive instead of JavaScript configuration. This includes colors, fonts, spacing scales, and animation keyframes.

- **Arbitrary Values**: Use square bracket notation for one-off custom values: `w-[347px]`, `text-[#1da1f2]`, `top-[117px]`. This is key to breaking away from generic designs.

- **Component Extraction**: For repeated complex patterns, use `@apply` in CSS to extract utility combinations into semantic classes while maintaining the utility-first approach for most styling.

- **Responsive Design**: Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) to create adaptive layouts. Define custom breakpoints in `@theme` if needed.

- **State Variants**: Leverage hover, focus, active, group, peer, and other state variants to create interactive, polished experiences: `hover:scale-105`, `focus:ring-4`, `group-hover:opacity-100`.

- **Performance**: Tailwind v4's Oxide engine and automatic source detection ensure optimized builds. Arbitrary values are generated on-demand by the JIT compiler without performance penalties.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate utility combinations, extensive custom animations via `@theme`, and creative use of arbitrary values. Minimalist or refined designs need restraint, precision with spacing utilities, careful typography scales, and subtle hover states. Elegance comes from executing the vision well with Tailwind's powerful utility system.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision using Tailwind CSS v4's full potential.
