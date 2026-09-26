import { createHeroTesseract } from './heroTesseract';

const TEMPLATE = `
  <div class="intro">
    <section class="intro-hero">
      <div class="intro-hero-canvas" id="intro-hero-canvas"></div>
      <div class="intro-hero-content">
        <h1 class="intro-title">Seeing the Fourth Dimension</h1>
        <p class="intro-sub">
          An intuition-first tool for perceiving 4D shapes. 4D is impossible to
          see directly, but the intuition for it can be built up step by step.
        </p>
        <a href="#flatland" class="intro-cta">Start with Flatland</a>
      </div>
    </section>

    <div class="intro-body">
      <section class="intro-block">
        <h2>How to explore</h2>
        <p class="intro-lead">
          The tabs above are meant to be visited in order, left to right. Each
          one borrows the idea from the one before it and applies it one
          dimension higher.
        </p>
        <ol class="intro-tabs">
          <li>
            <a href="#flatland" class="intro-tab-link">
              <strong>Flatland.</strong> A 3D shape passes through a 2D plane. A
              flat being living in that plane only ever sees the slice: a circle,
              a square, growing and shrinking. The 3D view shows the whole story.
              This is the trick, one dimension down.
            </a>
          </li>
          <li>
            <a href="#build-and-raise" class="intro-tab-link">
              <strong>Build &amp; Raise.</strong> Pick a 2D shape or draw a new
              one. The same operation that lifts a flat polygon into a 3D solid
              takes that 3D solid into a 4D one. Two takes, no new magic.
            </a>
          </li>
          <li>
            <a href="#tesseract" class="intro-tab-link">
              <strong>Tesseract.</strong> Now a real 4D shape passing through 3D
              space. The slice morphs through a sequence of polyhedra as the
              shape rotates. That morphing is the 4D experience for a 3D being.
            </a>
          </li>
          <li>
            <a href="#projection" class="intro-tab-link">
              <strong>Projection.</strong> The other way to render 4D: a "shadow"
              in 3D. Hue encodes the W coordinate the projection threw away.
              The classic cube-in-a-cube tesseract, but grounded.
            </a>
          </li>
          <li>
            <a href="#playground" class="intro-tab-link">
              <strong>Playground.</strong> Everything together. Four 4D shapes,
              slice or shadow, all six rotation planes on separate sliders. Free
              exploration lives here.
            </a>
          </li>
        </ol>
      </section>

      <section class="intro-block">
        <h2>A few words used here</h2>
        <dl class="intro-glossary">
          <dt>W, the fourth axis</dt>
          <dd>
            Our space has three directions: left/right (X), up/down (Y), and
            forward/back (Z). A fourth direction, W, points somewhere none of
            those do. Nobody can picture it, but the math treats it like any
            other axis: a point in 4D just has four numbers instead of three.
          </dd>
          <dt>Slice (cross-section)</dt>
          <dd>
            What remains when a shape is cut by something one dimension lower.
            A flat plane slices a 3D ball into a circle; a 3D space slices a 4D
            ball into a ball.
          </dd>
          <dt>Projection (shadow)</dt>
          <dd>
            Flattening a whole shape one dimension down, the way a photo
            flattens 3D into 2D. Nothing is cut away, but depth is lost.
          </dd>
          <dt>Rotation plane</dt>
          <dd>
            In 3D, objects spin around an axis. In 4D they spin within a flat
            plane made of two axes, such as XY or XW. There are six such
            planes; the three that include W have no 3D equivalent.
          </dd>
          <dt>The shapes</dt>
          <dd>
            A tesseract is a 4D cube (16 corners, 32 edges). A hypersphere is
            every point at the same distance from a center in 4D. The 5-cell
            and 16-cell are the 4D cousins of the tetrahedron and octahedron.
          </dd>
        </dl>
      </section>

      <section class="intro-block">
        <h2>Why this project</h2>
        <p>
          Most 4D visualizers open with a rotating tesseract and expect
          comprehension to follow. That shows the last step of understanding
          first. This project builds the intuition in layers, borrowing the
          cross-section trick from Flatland and generalizing it upward, so the
          tesseract at the end actually makes sense instead of just looking
          cool.
        </p>
      </section>
    </div>
  </div>
`;

export function mountIntro(root: HTMLElement): () => void {
  root.innerHTML = TEMPLATE;
  const canvasContainer = root.querySelector('#intro-hero-canvas') as HTMLElement | null;
  const hero = canvasContainer ? createHeroTesseract(canvasContainer) : null;
  return () => {
    hero?.dispose();
    root.innerHTML = '';
  };
}
